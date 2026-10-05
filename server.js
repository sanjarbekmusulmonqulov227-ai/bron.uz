// bron.uz server: static site + JSON API + admin panel. No npm dependencies (Node.js 22.13+).
// Run: ADMIN_PASSWORD=... node server.js
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || "";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");

if (!ADMIN_PASSWORD) console.warn("[!] ADMIN_PASSWORD o'rnatilmagan: admin panel yopiq bo'ladi.");

// ---------- database ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, "bron.db"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY, type TEXT NOT NULL,
    name TEXT NOT NULL, city TEXT NOT NULL, rating REAL DEFAULT 0, reviews INTEGER DEFAULT 0,
    price INTEGER NOT NULL, capacity INTEGER NOT NULL, tags TEXT DEFAULT '[]',
    hue INTEGER DEFAULT 200, glyph TEXT DEFAULT '', active INTEGER DEFAULT 1, details TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS bookings (
    code TEXT PRIMARY KEY, listing_id TEXT NOT NULL, listing_name TEXT, city TEXT, type TEXT,
    date_from TEXT NOT NULL, date_to TEXT NOT NULL, guests INTEGER NOT NULL, sum INTEGER NOT NULL,
    pay TEXT, client TEXT NOT NULL, phone TEXT NOT NULL, note TEXT,
    status TEXT NOT NULL DEFAULT 'yangi', created TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS group_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, kind TEXT, people INTEGER,
    phone TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'yangi', created TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL, salt TEXT NOT NULL, created TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL
  );
`);
if (!db.prepare("PRAGMA table_info(bookings)").all().some((c) => c.name === "user_id")) db.exec("ALTER TABLE bookings ADD COLUMN user_id INTEGER");
// Hotels can be booked for several identical rooms at once.
if (!db.prepare("PRAGMA table_info(bookings)").all().some((c) => c.name === "rooms")) db.exec("ALTER TABLE bookings ADD COLUMN rooms INTEGER DEFAULT 1");
if (!db.prepare("PRAGMA table_info(bookings)").all().some((c) => c.name === "room")) db.exec("ALTER TABLE bookings ADD COLUMN room TEXT");
// reminded = 1 once the manager was reminded about an unanswered booking (older bookings count as reminded).
if (!db.prepare("PRAGMA table_info(bookings)").all().some((c) => c.name === "reminded")) db.exec("ALTER TABLE bookings ADD COLUMN reminded INTEGER DEFAULT 0; UPDATE bookings SET reminded = 1");
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id TEXT NOT NULL, booking_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    rating INTEGER NOT NULL, text TEXT, created TEXT NOT NULL, hidden INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS otps (
    phone TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL, expires INTEGER NOT NULL, tries INTEGER DEFAULT 0,
    PRIMARY KEY (phone, purpose)
  );
  CREATE TABLE IF NOT EXISTS counters (k TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY, first TEXT NOT NULL, last TEXT NOT NULL, visits INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS listing_views (listing_id TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
`);

// Older databases limited listing types to hotel/venue/tour; rebuild without that CHECK so hostels fit.
if (/CHECK \(type IN/.test(db.prepare("SELECT sql FROM sqlite_master WHERE name = 'listings'").get()?.sql || "")) {
  db.exec(`BEGIN;
    CREATE TABLE listings_new (id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, rating REAL DEFAULT 0, reviews INTEGER DEFAULT 0,
      price INTEGER NOT NULL, capacity INTEGER NOT NULL, tags TEXT DEFAULT '[]', hue INTEGER DEFAULT 200, glyph TEXT DEFAULT '', active INTEGER DEFAULT 1, details TEXT DEFAULT '{}');
    INSERT INTO listings_new SELECT id, type, name, city, rating, reviews, price, capacity, tags, hue, glyph, active, COALESCE(details, '{}') FROM listings;
    DROP TABLE listings; ALTER TABLE listings_new RENAME TO listings; COMMIT;`);
}
// Partners (hotel, hostel and venue owners) manage their own listings, prices, free dates and bookings.
db.exec(`
  CREATE TABLE IF NOT EXISTS listing_owners (listing_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS blocks (listing_id TEXT NOT NULL, date TEXT NOT NULL, PRIMARY KEY (listing_id, date));
  CREATE TABLE IF NOT EXISTS partner_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, property TEXT NOT NULL, type TEXT, city TEXT, units INTEGER,
    contact TEXT, phone TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'yangi', created TEXT NOT NULL
  );
`);

// Older databases lack the details column.
if (!db.prepare("PRAGMA table_info(listings)").all().some((c) => c.name === "details")) db.exec("ALTER TABLE listings ADD COLUMN details TEXT DEFAULT '{}'");

// Extra listing fields kept as JSON: district, stars, old price, free cancellation, amenities, description, art style.
const DETAIL_KEYS = ["real", "district", "stars", "old", "free", "amenities", "desc", "art", "photo", "photos", "format", "kind", "area", "layouts", "days", "nights", "route", "itinerary", "beds", "units", "lat", "lng", "checkin", "checkout", "rules"];
const pickDetails = (x) => Object.fromEntries(DETAIL_KEYS.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));

// The site's own sample data (public/data.js): seeds an empty database and holds the transport timetable.
const SAMPLE = { window: {} };
require("node:vm").runInNewContext(fs.readFileSync(path.join(PUBLIC_DIR, "data.js"), "utf8"), SAMPLE);
const TRANSPORT = SAMPLE.window.BRON_TRANSPORT || { avia: [], poyezd: [], avto: [] };
const TRIPS = new Map([...TRANSPORT.avia, ...TRANSPORT.poyezd, ...TRANSPORT.avto].map((t) => [t.id, t]));

if (db.prepare("SELECT COUNT(*) AS n FROM listings").get().n === 0) {
  const seed = SAMPLE.window.BRON_LISTINGS || [];
  const ins = db.prepare("INSERT INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const x of seed) ins.run(x.id, x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.amenities || []), x.hue, "", JSON.stringify(pickDetails(x)));
  console.log(`Bazaga ${seed.length} ta namuna joy yozildi.`);
}

// Databases created before the regional sample listings get them once (a marker file stops deleted ones coming back).
const REGIONS_MARK = path.join(DATA_DIR, "regions-v9.done");
if (!fs.existsSync(REGIONS_MARK)) {
  const ins = db.prepare("INSERT OR IGNORE INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
  let added = 0;
  for (const x of (SAMPLE.window.BRON_LISTINGS || []).filter((x) => x.sample)) added += ins.run(x.id, x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.amenities || []), x.hue, "", JSON.stringify(pickDetails(x))).changes;
  fs.writeFileSync(REGIONS_MARK, new Date().toISOString());
  if (added) console.log(`Viloyatlar uchun ${added} ta namuna joy qo'shildi.`);
}

// The listings shipped in data.js are made up; they stay marked as samples until the admin ticks
// "real place" or a partner owns them. Places the admin adds or imports are real.
const SEED_IDS = new Set((SAMPLE.window.BRON_LISTINGS || []).map((x) => x.id));
const isSample = (x) => SEED_IDS.has(x.id) && !x.real && !db.prepare("SELECT 1 FROM listing_owners WHERE listing_id = ?").get(x.id);
const rowToListing = (r) => {
  const { details, ...rest } = r;
  const d = JSON.parse(details || "{}");
  return { ...rest, ...d, tags: JSON.parse(r.tags || "[]"), amenities: d.amenities || JSON.parse(r.tags || "[]"), active: !!r.active };
};

// ---------- rules shared with the front-end ----------
const TYPES = ["hotel", "hostel", "venue", "tour"];
const PAY = ["joyida", "click", "payme", "uzum"];
const STATUSES = ["yangi", "tasdiqlandi", "bekor qilindi", "yakunlandi"];
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Xiva"];
// Real calendar dates only ("2026-11-31" is rejected rather than rolled over to December).
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
// "Today" in Tashkent (UTC+5, no daylight saving), so late-night bookings can't pick yesterday.
const today = () => new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const normPhone = (p) => String(p || "").replace(/[\s()-]/g, "");
const uzPhone = (p) => /^\+998\d{9}$/.test(normPhone(p));
// Foreign guests book with their own number; Uzbek numbers must have all 9 digits.
const validPhone = (p) => uzPhone(p) || /^\+(?!998)[1-9]\d{7,14}$/.test(normPhone(p));
const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
const str = (v, max) => String(v ?? "").trim().slice(0, max);

// Same room multipliers as public/app.js.
const ROOMS = { standart: { mult: 1, extra: 0 }, deluxe: { mult: 1.35, extra: 0 }, lyuks: { mult: 1.8, extra: 2 } };
const ROOM_NAMES = { standart: "Standart xona", deluxe: "Deluxe", lyuks: "Oilaviy lyuks" };
const roomOf = (item, room) => (item.type === "hotel" && ROOMS[room]) || ROOMS.standart;
function quote(item, from, to, guests, room, rooms = 1) {
  const p = Math.round(item.price * roomOf(item, room).mult / 1000) * 1000;
  if (item.type === "tour") return p * guests;
  const n = Math.max(1, days(from, to) + (item.type === "venue" ? 1 : 0));
  return item.type === "hostel" ? p * n * guests : item.type === "hotel" ? p * n * rooms : p * n;
}

// ---------- availability ----------
// How much a listing can sell per day: hotel rooms, hostel beds, one venue, tour group seats.
const capacityOf = (item) => item.type === "hotel" ? item.units || 10 : item.type === "hostel" ? item.beds || item.capacity : item.type === "venue" ? 1 : item.capacity;
// Hotels and hostels sell nights (from..to-1), venues sell days (from..to), tours sell their start date.
function dayList(item, from, to) {
  const out = [];
  const last = item.type === "venue" ? to : item.type === "tour" ? from : addIso(to, -1);
  for (let d = from; d <= last && out.length < 62; d = addIso(d, 1)) out.push(d);
  return out;
}
const addIso = (d, n) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);
function usedOn(item, d, ignoreCode) {
  const rows = db.prepare("SELECT code, type, date_from, date_to, guests, rooms FROM bookings WHERE listing_id = ? AND status != 'bekor qilindi' AND date_from <= ? AND date_to >= ?").all(item.id, d, d);
  return rows.filter((r) => r.code !== ignoreCode && (item.type === "venue" || item.type === "tour" ? true : d < r.date_to))
    .reduce((n, r) => n + (item.type === "hostel" || item.type === "tour" ? r.guests : item.type === "hotel" ? r.rooms || 1 : 1), 0);
}
function availability(item, from, to, guests, ignoreCode, rooms = 1) {
  const need = item.type === "hostel" || item.type === "tour" ? guests : item.type === "hotel" ? rooms : 1;
  const cap = capacityOf(item);
  let free = cap;
  for (const d of dayList(item, from, to)) {
    if (db.prepare("SELECT 1 FROM blocks WHERE listing_id = ? AND date = ?").get(item.id, d)) return { ok: false, free: 0, reason: `${d.split("-").reverse().join(".")} kuni joy yopiq.` };
    free = Math.min(free, cap - usedOn(item, d, ignoreCode));
  }
  free = Math.max(0, free);
  return { ok: free >= need, free, reason: free >= need ? "" : free ? `Bu sanalarda faqat ${free} ta bo'sh joy qoldi.` : "Bu sanalarda bo'sh joy qolmadi." };
}

// ---------- transport (sample timetable from data.js) ----------
function tripQuote(t, cls, guests) {
  if (t.mode === "avto") return { sum: t.price, label: `${t.name}: ${t.from}${t.transfer ? " transfer" : " → " + t.to}`, cap: t.seats };
  if (t.mode === "poyezd") { const c = t.classes[cls] ? cls : Object.keys(t.classes)[0]; return { sum: t.classes[c] * guests, label: `${t.name} ${t.no}: ${t.from} → ${t.to}, ${c}`, cap: 10, cls: c }; }
  return { sum: t.price * guests, label: `${t.no}: ${t.from} → ${t.to}`, cap: 9 };
}

// ---------- exchange rates (Central Bank of Uzbekistan, display only: bookings stay in so'm) ----------
let rateCache = { at: 0, data: null };
async function rates() {
  if (rateCache.data && Date.now() - rateCache.at < 6 * 3600e3) return rateCache.data;
  try {
    const r = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", { signal: AbortSignal.timeout(5000) });
    const list = await r.json();
    const pick = {};
    for (const x of list) if (["USD", "EUR", "RUB", "GBP", "KZT", "CNY", "TRY"].includes(x.Ccy)) pick[x.Ccy] = Number(x.Rate) / (Number(x.Nominal) || 1);
    if (!pick.USD) throw new Error("no USD");
    rateCache = { at: Date.now(), data: { date: list[0] && list[0].Date, source: "cbu.uz", rates: pick } };
  } catch (e) {
    if (!rateCache.data) return { rates: null };
  }
  return rateCache.data;
}

// ---------- telegram ----------
async function notify(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, disable_web_page_preview: true })
    });
    if (!r.ok) console.warn("Telegram xatosi:", r.status, await r.text());
  } catch (e) {
    console.warn("Telegram'ga yuborib bo'lmadi:", e.message);
  }
}

// ---------- http helpers ----------
// Browser-side protections sent with every response.
const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com", "img-src 'self' data: https:",
  "connect-src 'self' https://cbu.uz https://api.open-meteo.com https://overpass-api.de https://en.wikipedia.org https://commons.wikimedia.org https://upload.wikimedia.org https://fonts.googleapis.com https://fonts.gstatic.com",
  "manifest-src 'self'", "worker-src 'self'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"
].join("; ");
const SECURITY_HEADERS = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "cross-origin-opener-policy": "same-origin"
};
const isHttps = (req) => !!req.socket.encrypted || (TRUST_PROXY && String(req.headers["x-forwarded-proto"] || "").includes("https"));

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    "content-type": isJson ? "application/json; charset=utf-8" : headers["content-type"] || "text/plain; charset=utf-8",
    ...SECURITY_HEADERS,
    ...(res.req && isHttps(res.req) ? { "strict-transport-security": "max-age=31536000; includeSubDomains" } : {}),
    ...(isJson ? { "cache-control": "no-store" } : {}),
    ...headers
  });
  res.end(isJson ? JSON.stringify(body) : body);
}
const fail = (res, status, error) => send(res, status, { error });

function readJson(req, max = 20000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > max) { reject(Object.assign(new Error("So'rov juda katta."), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      let v;
      try { v = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }
      catch { reject(Object.assign(new Error("JSON noto'g'ri."), { status: 400 })); return; }
      if (!v || typeof v !== "object" || Array.isArray(v)) { reject(Object.assign(new Error("JSON obyekt bo'lishi kerak."), { status: 400 })); return; }
      resolve(v);
    });
    req.on("error", reject);
  });
}

// X-Forwarded-For can be forged by anyone, so it is trusted only behind your own proxy (TRUST_PROXY=1).
const clientIp = (req) => (TRUST_PROXY && req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : req.socket.remoteAddress || "");

// Per-IP sliding-window limit, counted separately per bucket (bookings, login, admin...).
const hits = new Map();
const seen = new Map();
setInterval(() => { const old = Date.now() - 3600000; for (const [k, t] of seen) if (t < old) seen.delete(k); }, 600000).unref();
function siteStats() {
  const c = (sql) => (db.prepare(sql).get() || {}).n || 0;
  return { visits: c("SELECT n FROM counters WHERE k = 'visits'"), visitors: c("SELECT COUNT(*) AS n FROM visitors"), users: c("SELECT COUNT(*) AS n FROM users"), views: c("SELECT COALESCE(SUM(n), 0) AS n FROM listing_views") };
}

function limited(req, bucket = "post", max = 10, windowMs = 60000) {
  const key = bucket + "|" + clientIp(req);
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

// Password guessing: 5 wrong passwords for one phone number from one address lock it there for 15 minutes
// (per address, so nobody can lock a stranger out of their own account).
const failures = new Map();
const locked = (phone, ip) => { const f = failures.get(phone + "|" + ip); return !!f && f.n >= 5 && Date.now() - f.t < 15 * 60000; };
const noteFailure = (phone, ip) => { const k = phone + "|" + ip, f = failures.get(k); const fresh = !f || Date.now() - f.t > 15 * 60000; failures.set(k, { n: fresh ? 1 : f.n + 1, t: Date.now() }); };
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.every((t) => now - t > 15 * 60000)) hits.delete(k);
  for (const [k, f] of failures) if (now - f.t > 15 * 60000) failures.delete(k);
}, 300000).unref();

// ---------- customer accounts ----------
const SESSION_DAYS = 30;
const hashPass = (pass, salt) => crypto.scryptSync(pass, salt, 64).toString("hex");
// A code is good for 5 minutes and 5 tries, and only once.
function checkOtp(phone, purpose, code) {
  const r = db.prepare("SELECT * FROM otps WHERE phone = ? AND purpose = ?").get(phone, purpose);
  if (!r || r.expires < Date.now() || r.tries >= 5 || !/^\d{6}$/.test(String(code || ""))) { if (r) db.prepare("UPDATE otps SET tries = tries + 1 WHERE phone = ? AND purpose = ?").run(phone, purpose); return false; }
  const ok = crypto.timingSafeEqual(Buffer.from(hashPass(String(code), SECRET.slice(0, 32)), "hex"), Buffer.from(r.code_hash, "hex"));
  if (ok) db.prepare("DELETE FROM otps WHERE phone = ? AND purpose = ?").run(phone, purpose);
  else db.prepare("UPDATE otps SET tries = tries + 1 WHERE phone = ? AND purpose = ?").run(phone, purpose);
  return ok;
}
const safeDecode = (v) => { try { return decodeURIComponent(v); } catch { return ""; } };
const cookies = (req) => Object.fromEntries((req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).filter((p) => p[0]).map(([k, ...v]) => [k, safeDecode(v.join("="))]));
// Only a SHA-256 of the session token is stored, so a leaked database cannot be used to log in.
const tokenHash = (t) => crypto.createHash("sha256").update(t).digest("hex");
function currentUser(req) {
  const t = cookies(req).bron_session;
  if (!t || !/^[0-9a-f]{64}$/.test(t)) return null;
  const row = db.prepare("SELECT u.id, u.name, u.phone FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires > ?").get(tokenHash(t), Date.now());
  return row || null;
}
function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)").run(tokenHash(token), userId, Date.now() + SESSION_DAYS * 86400000);
  const secure = isHttps(req) ? "; Secure" : "";
  return `bron_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}
setInterval(() => db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now()), 3600000).unref();

function isAdmin(req) {
  if (!ADMIN_PASSWORD) return false;
  const m = /^Basic (.+)$/.exec(req.headers.authorization || "");
  if (!m) return false;
  const [u, ...rest] = Buffer.from(m[1], "base64").toString("utf8").split(":");
  const p = rest.join(":");
  const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
  const okUser = eq(u, ADMIN_USER), okPass = eq(p, ADMIN_PASSWORD);
  return okUser && okPass;
}
const askAuth = (res) => send(res, 401, "Kirish uchun login va parol kerak.", { "www-authenticate": 'Basic realm="bron.uz admin", charset="UTF-8"' });

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8" };
// Static files: compressed once per file version (text types only), revalidated with an ETag.
const packed = new Map();
function serveFile(res, file, status = 200) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return status === 200 && path.extname(file) !== ".html" && path.extname(file) ? send(res, 404, "Topilmadi.")
      : status === 200 ? serveFile(res, path.join(PUBLIC_DIR, "404.html"), 404) : send(res, 404, "Sahifa topilmadi.");
    const ext = path.extname(file), type = MIME[ext] || "application/octet-stream";
    const etag = `"${st.size.toString(36)}-${Math.round(st.mtimeMs).toString(36)}"`;
    const headers = { "content-type": type, etag, vary: "accept-encoding",
      "cache-control": ext === ".png" || ext === ".jpg" || ext === ".webp" || ext === ".ico" ? "public, max-age=604800" : "no-cache" };
    const req = res.req;
    if (status === 200 && req && req.headers["if-none-match"] === etag) { res.writeHead(304, { etag, "cache-control": headers["cache-control"] }); return res.end(); }
    fs.readFile(file, (e2, data) => {
      if (e2) return send(res, 404, "Topilmadi.");
      // The static 404 page is built for GitHub Pages (<base href="/repo/">); here the site lives at the root.
      if (status === 404) data = Buffer.from(String(data).replace(/<base href="[^"]*">/, '<base href="/">'));
      const enc = String(req && req.headers["accept-encoding"] || "");
      const text = /^(text\/|application\/(json|manifest)|image\/svg)/.test(type) && data.length > 1024;
      const kind = text && /\bbr\b/.test(enc) ? "br" : text && /\bgzip\b/.test(enc) ? "gzip" : "";
      if (!kind) return send(res, status, req && req.method === "HEAD" ? "" : data, headers);
      const key = file + kind + etag;
      let body = packed.get(key);
      if (!body) {
        body = kind === "br" ? zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }) : zlib.gzipSync(data, { level: 9 });
        if (packed.size > 400) packed.clear();
        packed.set(key, body);
      }
      send(res, status, req && req.method === "HEAD" ? "" : body, { ...headers, "content-encoding": kind });
    });
  });
}

// ---------- validation ----------
function validListing(b, id) {
  const x = {
    id, type: b.type, name: str(b.name, 120), city: str(b.city, 40),
    rating: Math.min(10, Math.max(0, Number(b.rating) || 0)), reviews: Math.max(0, parseInt(b.reviews, 10) || 0),
    price: parseInt(b.price, 10), capacity: parseInt(b.capacity, 10),
    details: {
      district: str(b.district, 80), stars: Math.min(5, Math.max(0, parseInt(b.stars, 10) || 0)) || undefined,
      old: parseInt(b.old, 10) > 0 ? parseInt(b.old, 10) : undefined, free: b.free === undefined ? true : !!b.free,
      real: b.real ? true : undefined,
      amenities: Array.isArray(b.amenities) ? b.amenities.map((t) => str(t, 20)).slice(0, 12) : undefined,
      desc: str(b.desc, 600), art: str(b.art, 20) || undefined,
      photo: /^https:\/\/\S+$/.test(str(b.photo, 500)) ? str(b.photo, 500) : undefined,
      // Venue and tour-package extras (kept as-is from the sample data, cleaned up here).
      // Photos: Commons file names ({file}) or direct https links (a string or {url}), e.g. from a bulk import.
      photos: Array.isArray(b.photos) ? b.photos.map((x) => typeof x === "string" ? { url: x } : x).filter((x) => x && (typeof x.file === "string" || /^https:\/\/\S+$/.test(str(x.url, 500)))).slice(0, 8)
        .map((x) => x.file ? { file: str(x.file, 200), title: str(x.title, 100) } : { url: str(x.url, 500), title: str(x.title, 100) }) : undefined,
      format: ["conf", "meet", "gala", "open", "expo"].includes(b.format) ? b.format : undefined,
      kind: str(b.kind, 40) || undefined,
      area: parseInt(b.area, 10) > 0 ? parseInt(b.area, 10) : undefined,
      layouts: b.layouts && typeof b.layouts === "object" ? Object.fromEntries(["teatr", "sinf", "banket", "furshet"].map((k) => [k, Math.max(0, parseInt(b.layouts[k], 10) || 0)])) : undefined,
      days: parseInt(b.days, 10) > 0 ? Math.min(30, parseInt(b.days, 10)) : undefined,
      nights: parseInt(b.nights, 10) >= 0 && b.nights !== undefined ? Math.min(30, parseInt(b.nights, 10)) : undefined,
      route: Array.isArray(b.route) ? b.route.map((x) => str(x, 40)).filter(Boolean).slice(0, 8) : undefined,
      beds: parseInt(b.beds, 10) > 0 ? Math.min(500, parseInt(b.beds, 10)) : undefined,
      units: parseInt(b.units, 10) > 0 ? Math.min(500, parseInt(b.units, 10)) : undefined,
      checkin: /^([01]\d|2[0-3]):[0-5]\d$/.test(b.checkin || "") ? b.checkin : undefined,
      checkout: /^([01]\d|2[0-3]):[0-5]\d$/.test(b.checkout || "") ? b.checkout : undefined,
      rules: str(b.rules, 400) || undefined,
      lat: Number.isFinite(+b.lat) && b.lat !== undefined && b.lat !== "" ? +b.lat : undefined,
      lng: Number.isFinite(+b.lng) && b.lng !== undefined && b.lng !== "" ? +b.lng : undefined,
      itinerary: Array.isArray(b.itinerary) ? b.itinerary.filter(Array.isArray).slice(0, 15).map(([t, d]) => [str(t, 60), str(d, 400)]) : undefined
    },
    tags: (Array.isArray(b.tags) ? b.tags : String(b.tags || "").split(",")).map((t) => str(t, 40)).filter(Boolean).slice(0, 8),
    hue: (parseInt(b.hue, 10) || 200) % 360, glyph: str(b.glyph, 4), active: b.active === undefined ? true : !!b.active
  };
  if (!TYPES.includes(x.type)) return "Turi noto'g'ri (hotel, venue yoki tour).";
  if (x.name.length < 2) return "Nomini kiriting.";
  if (!x.city) return "Shaharni kiriting.";
  if (!(x.price > 0)) return "Narx musbat son bo'lishi kerak.";
  if (!(x.capacity > 0)) return "Sig'im musbat son bo'lishi kerak.";
  return x;
}

// ---------- partner cabinet ----------
// Secret for iCal links, created once per installation.
const SECRET_FILE = path.join(DATA_DIR, "secret.key");
if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
const SECRET = fs.readFileSync(SECRET_FILE, "utf8").trim();
const icalKey = (id) => crypto.createHmac("sha256", SECRET).update("ical:" + id).digest("hex").slice(0, 32);
const ownedIds = (uid) => db.prepare("SELECT listing_id FROM listing_owners WHERE user_id = ?").all(uid).map((r) => r.listing_id);

// ---------- Telegram bot (customers follow their booking, partners get new bookings) ----------
const STATUS_TEXT = { yangi: "🕓 yangi, menejer ko'rib chiqmoqda", tasdiqlandi: "✅ tasdiqlandi", "bekor qilindi": "❌ bekor qilindi", yakunlandi: "🏁 yakunlandi" };
const describeBooking = (code) => {
  const b = db.prepare("SELECT * FROM bookings WHERE code = ?").get(code);
  if (!b) return "";
  const dates = b.date_from === b.date_to ? b.date_from : `${b.date_from} – ${b.date_to}`;
  return `${b.code}: ${b.listing_name}\n${dates}, ${b.guests} kishi${b.room ? `, ${ROOM_NAMES[b.room] || b.room}` : ""}${b.rooms > 1 ? ` × ${b.rooms}` : ""}\nSumma: ${som(b.sum)}\nHolat: ${STATUS_TEXT[b.status] || b.status}`;
};
const tg = require("./lib/telegram")({ db, token: TG_TOKEN, secret: SECRET, describe: { booking: describeBooking } });
const statusChanged = (code) => tg.toBooking(code, `Bron holati o'zgardi.\n\n${describeBooking(code)}`);
// One place for status changes: a cancelled booking comes back only if its dates are still free,
// and its review (if any) disappears with it.
function setStatus(row, status) {
  if (row.status === "bekor qilindi" && status !== "bekor qilindi" && row.type !== "transport") {
    const l = db.prepare("SELECT * FROM listings WHERE id = ?").get(row.listing_id);
    if (l) {
      const av = availability(rowToListing(l), row.date_from, row.date_to, row.guests, row.code, row.rooms || 1);
      if (!av.ok) return `Bronni qayta tiklab bo'lmaydi: ${av.reason}`;
    }
  }
  db.prepare("UPDATE bookings SET status = ? WHERE code = ?").run(status, row.code);
  if (status === "bekor qilindi") db.prepare("UPDATE reviews SET hidden = 1 WHERE booking_code = ?").run(row.code);
  statusChanged(row.code);
  // After the stay, ask the guest for a review (the only way reviews get on the site).
  if (status === "yakunlandi" && row.type !== "transport") {
    const site = (process.env.SITE_URL || "").replace(/\/$/, "");
    tg.toBooking(row.code, `⭐ Qanday o'tdi? Bahoingiz boshqa mehmonlarga yordam beradi.\n${site ? `${site}/#sharh=${row.code}` : "Saytdagi \"Bronlarim\" bo'limida \"Sharh qoldirish\" tugmasini bosing."}`);
  }
  return "";
}
const sms = require("./lib/sms");

// Unanswered bookings: remind the manager after 2 hours, and release requests whose start day passed unconfirmed.
function sweepBookings() {
  const cutoff = new Date(Date.now() - 2 * 3600e3).toISOString();
  for (const b of db.prepare("SELECT code FROM bookings WHERE status = 'yangi' AND reminded = 0 AND created < ?").all(cutoff)) {
    db.prepare("UPDATE bookings SET reminded = 1 WHERE code = ?").run(b.code);
    notify(`⏰ 2 soatdan beri javob berilmagan bron:\n${describeBooking(b.code)}`);
  }
  for (const b of db.prepare("SELECT * FROM bookings WHERE status = 'yangi' AND date_from < ?").all(today())) {
    setStatus(b, "bekor qilindi");
    db.prepare("UPDATE bookings SET note = trim(coalesce(note, '') || ' [Avtomatik: kelish kunigacha tasdiqlanmadi]') WHERE code = ?").run(b.code);
  }
}
if (require.main === module) { setTimeout(sweepBookings, 5000).unref(); setInterval(sweepBookings, 10 * 60e3).unref(); }

async function partnerRoutes(req, res, p, M, url) {
  const u = currentUser(req);
  if (!u) return fail(res, 401, "Avval hisobingizga kiring.");
  const ids = ownedIds(u.id);
  const own = (id) => ids.includes(id) ? db.prepare("SELECT * FROM listings WHERE id = ?").get(id) : null;
  if (p === "/api/partner/me" && M === "GET") {
    const listings = ids.map((id) => db.prepare("SELECT * FROM listings WHERE id = ?").get(id)).filter(Boolean).map(rowToListing)
      .map((x) => ({ ...x, capacityPerDay: capacityOf(x), ical: `/api/ical/${x.id}.ics?key=${icalKey(x.id)}` }));
    return send(res, 200, { user: u, listings, tg: tg.partnerLink(u.id) });
  }
  if (p === "/api/partner/bookings" && M === "GET") {
    if (!ids.length) return send(res, 200, []);
    const rows = db.prepare(`SELECT code, listing_id, listing_name, type, date_from, date_to, guests, room, rooms, sum, pay, client, phone, note, status, created FROM bookings
      WHERE listing_id IN (${ids.map(() => "?").join(",")}) ORDER BY date_from DESC LIMIT 300`).all(...ids);
    return send(res, 200, rows);
  }
  let m = /^\/api\/partner\/bookings\/(BRN-[A-Z0-9]{6})$/.exec(p);
  if (m && M === "PATCH") {
    const b = await readJson(req);
    const row = db.prepare("SELECT * FROM bookings WHERE code = ?").get(m[1]);
    if (!row || !ids.includes(row.listing_id)) return fail(res, 404, "Bron topilmadi.");
    if (!["tasdiqlandi", "bekor qilindi", "yakunlandi"].includes(b.status)) return fail(res, 400, "Holat noto'g'ri.");
    const err = setStatus(row, b.status);
    if (err) return fail(res, 409, err);
    notify(`🏨 Hamkor ${u.name}: ${m[1]} → ${b.status}`);
    return send(res, 200, { ok: true });
  }
  m = /^\/api\/partner\/listings\/([\w-]{1,40})$/.exec(p);
  if (m && M === "PUT") {
    const row = own(m[1]);
    if (!row) return fail(res, 404, "Joy topilmadi.");
    const b = await readJson(req);
    const d = JSON.parse(row.details || "{}");
    const price = parseInt(b.price, 10);
    if (!(price > 0)) return fail(res, 400, "Narx musbat son bo'lishi kerak.");
    const units = parseInt(b.units, 10);
    if (units > 0) { if (row.type === "hostel") d.beds = Math.min(500, units); else if (row.type === "hotel") d.units = Math.min(500, units); }
    db.prepare("UPDATE listings SET price = ?, active = ?, details = ? WHERE id = ?").run(price, b.active === false ? 0 : 1, JSON.stringify(d), row.id);
    return send(res, 200, { ok: true });
  }
  m = /^\/api\/partner\/listings\/([\w-]{1,40})\/calendar$/.exec(p);
  if (m && M === "GET") {
    const row = own(m[1]);
    if (!row) return fail(res, 404, "Joy topilmadi.");
    const item = rowToListing(row);
    const month = /^\d{4}-\d{2}$/.test(url.searchParams.get("month") || "") ? url.searchParams.get("month") : today().slice(0, 7);
    const out = [];
    for (let d = month + "-01"; d.startsWith(month); d = addIso(d, 1)) {
      out.push({ date: d, used: usedOn(item, d), cap: capacityOf(item), blocked: !!db.prepare("SELECT 1 FROM blocks WHERE listing_id = ? AND date = ?").get(item.id, d) });
    }
    return send(res, 200, { month, days: out });
  }
  m = /^\/api\/partner\/listings\/([\w-]{1,40})\/blocks$/.exec(p);
  if (m && M === "POST") {
    if (!own(m[1])) return fail(res, 404, "Joy topilmadi.");
    const b = await readJson(req);
    if (!isDate(b.date)) return fail(res, 400, "Sanani tekshiring.");
    if (b.blocked) db.prepare("INSERT OR IGNORE INTO blocks (listing_id, date) VALUES (?, ?)").run(m[1], b.date);
    else db.prepare("DELETE FROM blocks WHERE listing_id = ? AND date = ?").run(m[1], b.date);
    return send(res, 200, { ok: true });
  }
  return fail(res, 404, "Topilmadi.");
}

// ---------- routes ----------
async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const M = req.method;

  // Cross-site request protection: every write must be JSON (other sites cannot send it without
  // a CORS preflight, which this server never approves) and, when the browser says where it came from, from this site.
  if (M !== "GET" && M !== "HEAD") {
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) return fail(res, 415, "So'rov JSON formatida bo'lishi kerak.");
    const origin = req.headers.origin;
    if (origin && origin !== "null") {
      let host = ""; try { host = new URL(origin).host; } catch { /* bad origin */ }
      if (host !== req.headers.host) return fail(res, 403, "Boshqa saytdan yuborilgan so'rov rad etildi.");
    }
  }

  // Public API
  // What this server can do, so the page shows only working features.
  // Visit and view counters. A browser keeps a random id, so the same person counts once as a user;
  // repeats within 30 minutes (visits) or an hour (views of one place) are not counted again.
  if (p === "/api/visit" && M === "POST") {
    const b = await readJson(req, 500);
    const vid = /^[\w-]{8,40}$/.test(b.vid || "") ? b.vid : "";
    const now = Date.now(), key = "v|" + (vid || clientIp(req));
    if (vid && now - (seen.get(key) || 0) > 30 * 60000 && !limited(req, "visit", 20)) {
      seen.set(key, now);
      const at = new Date().toISOString();
      db.prepare("INSERT INTO visitors (id, first, last) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET last = excluded.last, visits = visits + 1").run(vid, at, at);
      db.prepare("INSERT INTO counters (k, n) VALUES ('visits', 1) ON CONFLICT(k) DO UPDATE SET n = n + 1").run();
    }
    return send(res, 200, siteStats());
  }
  if (p === "/api/stats" && M === "GET") return send(res, 200, siteStats());
  const m0 = /^\/api\/listings\/([\w-]{1,40})\/view$/.exec(p);
  if (m0 && M === "POST") {
    const id = m0[1];
    if (!db.prepare("SELECT 1 FROM listings WHERE id = ?").get(id)) return fail(res, 404, "Bu joy topilmadi.");
    const now = Date.now(), key = "l|" + clientIp(req) + "|" + id;
    if (now - (seen.get(key) || 0) > 3600000 && !limited(req, "view", 60)) {
      seen.set(key, now);
      db.prepare("INSERT INTO listing_views (listing_id, n) VALUES (?, 1) ON CONFLICT(listing_id) DO UPDATE SET n = n + 1").run(id);
    }
    const r = db.prepare("SELECT n FROM listing_views WHERE listing_id = ?").get(id);
    return send(res, 200, { views: r ? r.n : 0 });
  }

  if (p === "/api/config" && M === "GET") return send(res, 200, { sms: sms.enabled, telegram: tg.username ? `https://t.me/${tg.username}` : "", reviews: true });

  // One-time SMS code for registration and password reset (only when SMS is configured).
  if (p === "/api/auth/otp" && M === "POST") {
    if (!sms.enabled) return fail(res, 400, "SMS tasdiqlash yoqilmagan.");
    if (limited(req, "otp", 3, 10 * 60000)) return fail(res, 429, "Juda ko'p SMS so'raldi. 10 daqiqadan keyin qayta urinib ko'ring.");
    const b = await readJson(req);
    const phone = normPhone(b.phone), purpose = b.purpose === "reset" ? "reset" : "register";
    if (!uzPhone(phone)) return fail(res, 400, "SMS kod faqat O'zbekiston raqamlariga (+998) yuboriladi.");
    const exists = !!db.prepare("SELECT 1 FROM users WHERE phone = ?").get(phone);
    if (purpose === "register" && exists) return fail(res, 409, "Bu raqam bilan hisob bor. \"Kirish\" ni tanlang.");
    const last = db.prepare("SELECT expires FROM otps WHERE phone = ? AND purpose = ?").get(phone, purpose);
    if (last && last.expires - 4 * 60000 > Date.now()) return fail(res, 429, "Kod yuborildi. Qayta so'rashdan oldin bir daqiqa kuting.");
    // A reset for an unknown number answers the same way, so the form does not reveal who has an account.
    if (purpose === "reset" && !exists) return send(res, 200, { ok: true });
    const code = String(crypto.randomInt(100000, 1000000));
    db.prepare("INSERT INTO otps (phone, purpose, code_hash, expires, tries) VALUES (?,?,?,?,0) ON CONFLICT(phone, purpose) DO UPDATE SET code_hash = excluded.code_hash, expires = excluded.expires, tries = 0")
      .run(phone, purpose, hashPass(code, SECRET.slice(0, 32)), Date.now() + 5 * 60000);
    try { await sms.sendCode(phone, code); } catch (e) { console.warn(e.message); return fail(res, 502, "SMS yuborilmadi. Keyinroq urinib ko'ring."); }
    return send(res, 200, { ok: true });
  }

  if (p === "/api/auth/reset" && M === "POST") {
    if (!sms.enabled) return fail(res, 400, "SMS tasdiqlash yoqilmagan.");
    if (limited(req, "reset", 5)) return fail(res, 429, "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.");
    const b = await readJson(req);
    const phone = normPhone(b.phone), pass = String(b.password || "");
    if (pass.length < 8 || pass.length > 200) return fail(res, 400, "Parol kamida 8 belgidan iborat bo'lsin.");
    if (!checkOtp(phone, "reset", b.code)) return fail(res, 400, "SMS kod noto'g'ri yoki eskirgan.");
    const u = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
    if (!u) return fail(res, 400, "SMS kod noto'g'ri yoki eskirgan.");
    const salt = crypto.randomBytes(16).toString("hex");
    db.prepare("UPDATE users SET pass_hash = ?, salt = ? WHERE id = ?").run(hashPass(pass, salt), salt, u.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(u.id);
    for (const k of failures.keys()) if (k.startsWith(phone + "|")) failures.delete(k);
    return send(res, 200, { ok: true });
  }

  if (p === "/api/auth/register" && M === "POST") {
    if (limited(req, "register", 5)) return fail(res, 429, "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.");
    const b = await readJson(req);
    const name = str(b.name, 80), phone = normPhone(b.phone), pass = String(b.password || "");
    if (name.length < 3) return fail(res, 400, "Ism familiyangizni kiriting.");
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67.");
    if (pass.length < 8 || pass.length > 200) return fail(res, 400, "Parol kamida 8 belgidan iborat bo'lsin.");
    if (db.prepare("SELECT 1 FROM users WHERE phone = ?").get(phone)) return fail(res, 409, "Bu raqam bilan hisob bor. \"Kirish\" ni tanlang.");
    if (sms.enabled && !checkOtp(phone, "register", b.code)) return fail(res, 400, "SMS kod noto'g'ri yoki eskirgan.");
    const salt = crypto.randomBytes(16).toString("hex");
    const r = db.prepare("INSERT INTO users (name,phone,pass_hash,salt,created) VALUES (?,?,?,?,?)").run(name, phone, hashPass(pass, salt), salt, new Date().toISOString());
    const id = Number(r.lastInsertRowid);
    return send(res, 201, { id, name, phone }, { "set-cookie": startSession(req, res, id) });
  }
  if (p === "/api/auth/login" && M === "POST") {
    if (limited(req, "login", 10)) return fail(res, 429, "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.");
    const b = await readJson(req);
    const phone = normPhone(b.phone);
    if (locked(phone, clientIp(req))) return fail(res, 429, "Parol 5 marta noto'g'ri kiritildi. 15 daqiqadan keyin qayta urinib ko'ring.");
    const u = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
    // Hash even for unknown numbers so response time does not reveal which numbers have accounts.
    const given = hashPass(String(b.password || ""), u ? u.salt : "0".repeat(32));
    const ok = u && crypto.timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(u.pass_hash, "hex"));
    if (!ok) { noteFailure(phone, clientIp(req)); return fail(res, 401, "Telefon raqami yoki parol noto'g'ri."); }
    failures.delete(phone + "|" + clientIp(req));
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires < ?").run(u.id, Date.now());
    return send(res, 200, { id: u.id, name: u.name, phone: u.phone }, { "set-cookie": startSession(req, res, u.id) });
  }
  if (p === "/api/auth/logout" && M === "POST") {
    const t = cookies(req).bron_session;
    if (t) db.prepare("DELETE FROM sessions WHERE token = ?").run(tokenHash(t));
    return send(res, 200, { ok: true }, { "set-cookie": "bron_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
  }
  if (p === "/api/auth/me" && M === "GET") {
    const u = currentUser(req);
    return send(res, 200, u || null);
  }
  if (p === "/api/my/bookings" && M === "GET") {
    const u = currentUser(req);
    if (!u) return fail(res, 401, "Avval hisobingizga kiring.");
    const rows = db.prepare("SELECT code, listing_id AS id, listing_name AS name, city, type, date_from AS 'from', date_to AS 'to', guests, room, rooms, sum, status, phone, EXISTS(SELECT 1 FROM reviews r WHERE r.booking_code = bookings.code) AS reviewed FROM bookings WHERE user_id = ? ORDER BY created DESC LIMIT 100").all(u.id);
    return send(res, 200, rows);
  }

  if (p === "/api/listings" && M === "GET") {
    // Verified guest reviews are counted separately from the listing's own (sample) rating.
    const stats = Object.fromEntries(db.prepare("SELECT listing_id, COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE hidden = 0 GROUP BY listing_id").all().map((r) => [r.listing_id, r]));
    const views = Object.fromEntries(db.prepare("SELECT listing_id, n FROM listing_views").all().map((r) => [r.listing_id, r.n]));
    const rows = db.prepare("SELECT * FROM listings WHERE active = 1").all().map(rowToListing)
      .map((x) => stats[x.id] ? { ...x, guestReviews: stats[x.id].n, guestRating: Math.round(stats[x.id].avg * 10) / 10 } : x)
      .map((x) => ({ ...x, views: views[x.id] || 0, sample: isSample(x) }));
    return send(res, 200, rows);
  }

  let m;
  m = /^\/api\/listings\/([\w-]{1,40})\/reviews$/.exec(p);
  if (m && M === "GET") {
    const rows = db.prepare("SELECT name, rating, text, created FROM reviews WHERE listing_id = ? AND hidden = 0 ORDER BY created DESC LIMIT 50").all(m[1]);
    return send(res, 200, rows);
  }
  // Only a guest whose stay is over can review, once per booking; the phone (or the logged-in owner) proves it is theirs.
  if (p === "/api/reviews" && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const row = db.prepare("SELECT * FROM bookings WHERE code = ?").get(str(b.code, 12));
    const u = currentUser(req);
    if (!row || !((u && row.user_id === u.id) || row.phone === normPhone(b.phone))) return fail(res, 404, "Bron topilmadi.");
    if (row.type === "transport") return fail(res, 400, "Transport uchun sharh qoldirilmaydi.");
    if (row.status === "bekor qilindi") return fail(res, 400, "Bekor qilingan bron uchun sharh qoldirib bo'lmaydi.");
    // Only a stay that really happened: finished by the place, or confirmed and already over.
    if (!(row.status === "yakunlandi" || (row.status === "tasdiqlandi" && row.date_to < today()))) return fail(res, 400, "Sharhni joyda bo'lib qaytganingizdan keyin qoldirishingiz mumkin.");
    const rating = parseInt(b.rating, 10);
    if (!(rating >= 1 && rating <= 10)) return fail(res, 400, "1 dan 10 gacha baho qo'ying.");
    const text = str(b.text, 1000);
    if (db.prepare("SELECT 1 FROM reviews WHERE booking_code = ?").get(row.code)) return fail(res, 409, "Bu bron uchun sharh allaqachon qoldirilgan.");
    // Show the first name and the initial of the surname only.
    const parts = row.client.split(/\s+/).filter(Boolean);
    const name = parts[0] + (parts[1] ? " " + parts[1][0] + "." : "");
    db.prepare("INSERT INTO reviews (listing_id, booking_code, name, rating, text, created) VALUES (?,?,?,?,?,?)").run(row.listing_id, row.code, name, rating, text, new Date().toISOString());
    notify(`⭐ Yangi sharh: ${row.listing_name}, ${rating}/10\n${name}: ${text}`);
    const owner = db.prepare("SELECT user_id FROM listing_owners WHERE listing_id = ?").get(row.listing_id);
    if (owner) tg.toPartner(owner.user_id, `⭐ Yangi sharh: ${row.listing_name}, ${rating}/10\n${name}: ${text}`);
    return send(res, 201, { ok: true });
  }
  if (p === "/api/availability/all" && M === "GET") {
    // Which listings of one type are full on these dates (used to hide them from search results).
    const type = str(url.searchParams.get("type"), 10), from = url.searchParams.get("from");
    const to = type === "tour" ? from : url.searchParams.get("to") || from;
    if (!isDate(from) || !isDate(to) || to < from || days(from, to) > 60) return fail(res, 400, "Sanani tekshiring.");
    const guests = Math.max(1, parseInt(url.searchParams.get("guests"), 10) || 1);
    const rooms = Math.min(10, Math.max(1, parseInt(url.searchParams.get("rooms"), 10) || 1));
    const busy = db.prepare("SELECT * FROM listings WHERE active = 1 AND type = ?").all(type).map(rowToListing)
      .filter((x) => !availability(x, from, to, guests, undefined, x.type === "hotel" ? rooms : 1).ok).map((x) => x.id);
    return send(res, 200, { busy });
  }
  if (p === "/api/rates" && M === "GET") return send(res, 200, await rates());
  if (p === "/api/availability" && M === "GET") {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND active = 1").get(str(url.searchParams.get("id"), 40));
    if (!row) return fail(res, 404, "Bu joy topilmadi.");
    const item = rowToListing(row);
    const from = url.searchParams.get("from"), to = item.type === "tour" ? from : url.searchParams.get("to") || from;
    if (!isDate(from) || !isDate(to) || to < from || days(from, to) > 60) return fail(res, 400, "Sanani tekshiring.");
    const rooms = Math.min(10, Math.max(1, parseInt(url.searchParams.get("rooms"), 10) || 1));
    return send(res, 200, availability(item, from, to, Math.max(1, parseInt(url.searchParams.get("guests"), 10) || 1), undefined, item.type === "hotel" ? rooms : 1));
  }

  if (p === "/api/transport-bookings" && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const t = TRIPS.get(str(b.tripId, 60));
    if (!t) return fail(res, 404, "Reys topilmadi.");
    const client = str(b.client, 80), phone = normPhone(b.phone), date = b.date, guests = parseInt(b.guests, 10) || 0;
    if (client.length < 3) return fail(res, 400, "Ism familiyangizni kiriting.");
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67.");
    if (!isDate(date) || date < today()) return fail(res, 400, "Bugungi yoki keyingi sanani tanlang.");
    if (date > addIso(today(), 365)) return fail(res, 400, "Bron bir yil oldindan qabul qilinadi.");
    const nowHm = new Date(Date.now() + 5 * 3600000).toISOString().slice(11, 16);
    if (date === today() && t.dep && t.dep <= nowHm) return fail(res, 400, "Bu reys bugun jo'nab ketgan. Boshqa sana yoki reysni tanlang.");
    const q = tripQuote(t, b.cls, guests);
    if (guests < 1 || guests > q.cap) return fail(res, 400, `Bir bronda ${q.cap} yo'lovchigacha.`);
    const pay = PAY.includes(b.pay) ? b.pay : "joyida";
    const code = "BRN-" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
    const row = { code, listing_id: t.id, listing_name: q.label, city: t.from, type: "transport", date_from: date, date_to: date, guests, sum: q.sum, pay, client, phone,
      note: str([t.dep && `jo'nash ${t.dep}`, b.note].filter(Boolean).join(" · "), 500), status: "yangi", created: new Date().toISOString(), user_id: currentUser(req)?.id ?? null };
    db.prepare(`INSERT INTO bookings (code,listing_id,listing_name,city,type,date_from,date_to,guests,sum,pay,client,phone,note,status,created,user_id)
                VALUES (:code,:listing_id,:listing_name,:city,:type,:date_from,:date_to,:guests,:sum,:pay,:client,:phone,:note,:status,:created,:user_id)`).run(row);
    notify(`🚆 Transport broni ${code}\n${q.label}\n${date}${t.dep ? " " + t.dep : ""}, ${guests} kishi\nSumma: ${som(q.sum)}\nMijoz: ${client}, ${phone}`);
    return send(res, 201, { code, sum: q.sum, status: "yangi", name: q.label, city: t.from, type: "transport", from: date, to: date, guests, tg: tg.bookingLink(code) });
  }

  if (p === "/api/partner-requests" && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const r = { property: str(b.property, 120), type: ["hotel", "hostel", "venue", "tour"].includes(b.type) ? b.type : "hotel", city: str(b.city, 40), units: Math.min(2000, Math.max(0, parseInt(b.units, 10) || 0)), contact: str(b.contact, 80), phone: normPhone(b.phone) };
    if (r.property.length < 2) return fail(res, 400, "Joy nomini kiriting.");
    if (r.contact.length < 2) return fail(res, 400, "Mas'ul shaxs ismini kiriting.");
    if (!validPhone(r.phone)) return fail(res, 400, "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67.");
    db.prepare("INSERT INTO partner_requests (property,type,city,units,contact,phone,created) VALUES (?,?,?,?,?,?,?)").run(r.property, r.type, r.city, r.units, r.contact, r.phone, new Date().toISOString());
    notify(`🤝 Yangi hamkor arizasi: ${r.property} (${r.type}, ${r.city}), ${r.units} ta joy\n${r.contact} ${r.phone}`);
    return send(res, 201, { ok: true });
  }

  // iCal feed of booked and closed days, for channel managers and Booking.com / Airbnb calendar sync.
  m = /^\/api\/ical\/([\w-]{1,40})\.ics$/.exec(p);
  if (m && M === "GET") {
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(m[1]);
    if (!row || url.searchParams.get("key") !== icalKey(m[1])) return fail(res, 404, "Topilmadi.");
    const ev = db.prepare("SELECT code, date_from, date_to, type FROM bookings WHERE listing_id = ? AND status != 'bekor qilindi' AND date_to >= ?").all(m[1], addIso(today(), -30));
    const bl = db.prepare("SELECT date FROM blocks WHERE listing_id = ? AND date >= ?").all(m[1], today());
    const d8 = (d) => d.replaceAll("-", "");
    const vevent = (uid, a, b, summary) => `BEGIN:VEVENT\r\nUID:${uid}@bron.uz\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z\r\nDTSTART;VALUE=DATE:${d8(a)}\r\nDTEND;VALUE=DATE:${d8(b)}\r\nSUMMARY:${summary}\r\nEND:VEVENT\r\n`;
    const body = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//bron.uz//UZ\r\n" +
      ev.map((e) => vevent(e.code, e.date_from, row.type === "hotel" || row.type === "hostel" ? e.date_to : addIso(e.date_to, 1), `Band ${e.code}`)).join("") +
      bl.map((x) => vevent(`blk-${m[1]}-${x.date}`, x.date, addIso(x.date, 1), "Yopiq")).join("") + "END:VCALENDAR\r\n";
    return send(res, 200, body, { "content-type": "text/calendar; charset=utf-8" });
  }

  if (p.startsWith("/api/partner/")) return partnerRoutes(req, res, p, M, url);

  if (p === "/api/bookings" && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND active = 1").get(str(b.listingId, 40));
    if (!row) return fail(res, 404, "Bu joy topilmadi yoki vaqtincha yopiq.");
    const item = rowToListing(row);
    const client = str(b.client, 80), phone = normPhone(b.phone), from = b.from;
    // A multi-day package ends on its last programme day.
    const to = item.type === "tour" ? (isDate(from) ? new Date(Date.parse(from) + ((item.days || 1) - 1) * 86400000).toISOString().slice(0, 10) : from) : b.to;
    const guests = parseInt(b.guests, 10) || 0;
    const pay = PAY.includes(b.pay) ? b.pay : "joyida";
    if (client.length < 3) return fail(res, 400, "Ism familiyangizni kiriting.");
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67.");
    if (!isDate(from) || from < today()) return fail(res, 400, "Bugungi yoki keyingi sanani tanlang.");
    if (!isDate(to)) return fail(res, 400, "Sanani tekshiring.");
    if (from > addIso(today(), 365)) return fail(res, 400, "Bron bir yil oldindan qabul qilinadi.");
    if ((item.type === "hotel" || item.type === "hostel") && !(to > from)) return fail(res, 400, "Ketish sanasi kelish sanasidan keyin bo'lishi kerak.");
    if (item.type === "venue" && to < from) return fail(res, 400, "Tugash sanasi boshlanish sanasidan oldin bo'lmasin.");
    if (days(from, to) > 60) return fail(res, 400, "Bir bron 60 kundan oshmasin.");
    if (guests < 1) return fail(res, 400, "Mehmonlar sonini kiriting.");
    const maxGuests = item.type === "hostel" ? capacityOf(item) : item.capacity;
    if (item.type !== "hotel" && guests > maxGuests) return fail(res, 400, `Bu joy ${maxGuests} kishigacha qabul qiladi.`);

    const room = item.type === "hotel" && ROOMS[b.room] ? b.room : "standart";
    const rooms = item.type === "hotel" ? Math.min(10, Math.max(1, parseInt(b.rooms, 10) || 1)) : 1;
    const perRoom = item.capacity + roomOf(item, room).extra;
    if (item.type === "hotel" && guests > perRoom * rooms) return fail(res, 400, rooms > 1 ? `${rooms} ta xonaga ${perRoom * rooms} kishigacha joylashadi.` : `Bu xona ${perRoom} kishigacha.`);
    if (item.type === "hotel" && rooms > guests) return fail(res, 400, "Xonalar soni mehmonlar sonidan ko'p bo'lmasin.");
    const av = availability(item, from, to, guests, undefined, rooms);
    if (!av.ok) return fail(res, 409, av.reason);
    const sum = quote(item, from, to, guests, room, rooms);
    const code = "BRN-" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
    const booking = { code, listing_id: item.id, listing_name: item.name, city: item.city, type: item.type, date_from: from, date_to: to, guests, room: item.type === "hotel" ? room : null, rooms, sum, pay, client, phone, note: str(b.note, 500), status: "yangi", created: new Date().toISOString(), user_id: currentUser(req)?.id ?? null };
    db.prepare(`INSERT INTO bookings (code,listing_id,listing_name,city,type,date_from,date_to,guests,room,rooms,sum,pay,client,phone,note,status,created,user_id)
                VALUES (:code,:listing_id,:listing_name,:city,:type,:date_from,:date_to,:guests,:room,:rooms,:sum,:pay,:client,:phone,:note,:status,:created,:user_id)`).run(booking);
    const text = `🆕 Yangi bron ${code}\n${item.name} (${item.city})\n${from}${to !== from ? " – " + to : ""}, ${guests} kishi${item.type === "hotel" ? `, ${ROOM_NAMES[room]}${rooms > 1 ? ` × ${rooms}` : ""}` : ""}\nSumma: ${som(sum)} · to'lov: ${pay}\nMijoz: ${client}, ${phone}${booking.note ? "\nIzoh: " + booking.note : ""}`;
    notify(text);
    const owner = db.prepare("SELECT user_id FROM listing_owners WHERE listing_id = ?").get(item.id);
    if (owner) tg.toPartner(owner.user_id, text);
    return send(res, 201, { code, sum, status: booking.status, name: item.name, city: item.city, type: item.type, from, to, guests, rooms, tg: tg.bookingLink(code) });
  }

  // Guests without an account keep their bookings on the device; this refreshes them (code + phone must match).
  if (p === "/api/bookings/lookup" && M === "POST") {
    if (limited(req, "lookup", 20)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req, 5000);
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30);
    const out = [];
    for (const it of items) {
      const row = db.prepare("SELECT code, listing_id AS id, listing_name AS name, city, type, date_from AS 'from', date_to AS 'to', guests, room, rooms, sum, status, phone FROM bookings WHERE code = ?").get(str(it.code, 12));
      if (row && row.phone === normPhone(it.phone)) out.push({ ...row, reviewed: !!db.prepare("SELECT 1 FROM reviews WHERE booking_code = ?").get(row.code) });
    }
    return send(res, 200, out);
  }

  // Customer cancels their own booking; phone must match.
  m = /^\/api\/bookings\/(BRN-[A-Z0-9]{6})\/cancel$/.exec(p);
  if (m && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const row = db.prepare("SELECT * FROM bookings WHERE code = ?").get(m[1]);
    const u = currentUser(req);
    const mine = row && ((u && row.user_id === u.id) || row.phone === normPhone(b.phone));
    if (!mine) return fail(res, 404, "Bron topilmadi.");
    if (row.status === "bekor qilindi") return send(res, 200, { ok: true, status: row.status });
    if (row.status === "yakunlandi") return fail(res, 409, "Yakunlangan bronni bekor qilib bo'lmaydi.");
    // Online cancellation only before the start day, and for confirmed bookings only where the place offers free cancellation.
    if (row.date_from <= today()) return fail(res, 409, "Bugun boshlanadigan yoki boshlangan bronni sayt orqali bekor qilib bo'lmaydi. Menejer bilan bog'laning.");
    const lst = db.prepare("SELECT * FROM listings WHERE id = ?").get(row.listing_id);
    if (row.status === "tasdiqlandi" && lst && !rowToListing(lst).free) return fail(res, 409, "Bu joyda bepul bekor qilish yo'q. Tasdiqlangan bronni bekor qilish uchun menejer bilan bog'laning.");
    setStatus(row, "bekor qilindi");
    notify(`❌ Mijoz bronni bekor qildi: ${m[1]} (${row.listing_name}, ${row.date_from})`);
    const owner = db.prepare("SELECT user_id FROM listing_owners WHERE listing_id = ?").get(row.listing_id);
    if (owner) tg.toPartner(owner.user_id, `❌ Mijoz bronni bekor qildi: ${m[1]} (${row.listing_name}, ${row.date_from})`);
    return send(res, 200, { ok: true });
  }

  if (p === "/api/group-requests" && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const company = str(b.company, 120), kind = str(b.kind, 60), people = parseInt(b.people, 10) || 0, phone = normPhone(b.phone);
    if (company.length < 2) return fail(res, 400, "Kompaniya nomini kiriting.");
    if (people < 10) return fail(res, 400, "Guruh so'rovi 10 kishidan boshlanadi.");
    if (people > 5000) return fail(res, 400, "Guruh so'rovi 5000 kishigacha qabul qilinadi.");
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67.");
    db.prepare("INSERT INTO group_requests (company,kind,people,phone,created) VALUES (?,?,?,?,?)").run(company, kind, people, phone, new Date().toISOString());
    notify(`🏢 Guruh so'rovi: ${company}\n${kind}, ${people} kishi\nTelefon: ${phone}`);
    return send(res, 201, { ok: true });
  }

  // Admin
  if (p === "/admin" || p === "/admin.js" || p.startsWith("/api/admin/")) {
    if (!isAdmin(req)) {
      // Wrong admin passwords are limited to 5 per 15 minutes per IP.
      if (req.headers.authorization && limited(req, "admin-fail", 5, 15 * 60000)) return fail(res, 429, "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring.");
      return askAuth(res);
    }
    if (p === "/admin.js") return serveFile(res, path.join(__dirname, "admin.js"));
    if (p === "/admin") return serveFile(res, path.join(__dirname, "admin.html"));

    if (p === "/api/admin/bookings" && M === "GET") return send(res, 200, db.prepare("SELECT * FROM bookings ORDER BY created DESC LIMIT 500").all());
    m = /^\/api\/admin\/bookings\/(BRN-[A-Z0-9]{6})$/.exec(p);
    if (m && M === "PATCH") {
      const b = await readJson(req);
      if (!STATUSES.includes(b.status)) return fail(res, 400, "Holat noto'g'ri.");
      const row = db.prepare("SELECT * FROM bookings WHERE code = ?").get(m[1]);
      if (!row) return fail(res, 404, "Bron topilmadi.");
      const err = setStatus(row, b.status);
      return err ? fail(res, 409, err) : send(res, 200, { ok: true });
    }

    if (p === "/api/admin/reviews" && M === "GET") return send(res, 200, db.prepare("SELECT r.*, l.name AS listing_name FROM reviews r LEFT JOIN listings l ON l.id = r.listing_id ORDER BY r.created DESC LIMIT 500").all());
    m = /^\/api\/admin\/reviews\/(\d+)$/.exec(p);
    if (m && M === "PATCH") {
      const b = await readJson(req);
      const r = db.prepare("UPDATE reviews SET hidden = ? WHERE id = ?").run(b.hidden ? 1 : 0, Number(m[1]));
      return r.changes ? send(res, 200, { ok: true }) : fail(res, 404, "Sharh topilmadi.");
    }
    if (p === "/api/admin/requests" && M === "GET") return send(res, 200, db.prepare("SELECT * FROM group_requests ORDER BY created DESC LIMIT 500").all());
    m = /^\/api\/admin\/requests\/(\d+)$/.exec(p);
    if (m && M === "PATCH") {
      const b = await readJson(req);
      if (!STATUSES.includes(b.status)) return fail(res, 400, "Holat noto'g'ri.");
      const r = db.prepare("UPDATE group_requests SET status = ? WHERE id = ?").run(b.status, Number(m[1]));
      if (!r.changes) return fail(res, 404, "So'rov topilmadi.");
      return send(res, 200, { ok: true });
    }

    if (p === "/api/admin/listings" && M === "GET") {
      const owners = Object.fromEntries(db.prepare("SELECT o.listing_id, u.phone FROM listing_owners o JOIN users u ON u.id = o.user_id").all().map((r) => [r.listing_id, r.phone]));
      return send(res, 200, db.prepare("SELECT * FROM listings ORDER BY type, city, name").all().map(rowToListing).map((x) => ({ ...x, owner: owners[x.id] || "" })));
    }
    if (p === "/api/admin/partner-requests" && M === "GET") return send(res, 200, db.prepare("SELECT * FROM partner_requests ORDER BY created DESC LIMIT 500").all());
    m = /^\/api\/admin\/partner-requests\/(\d+)$/.exec(p);
    if (m && M === "PATCH") {
      const b = await readJson(req);
      if (!STATUSES.includes(b.status)) return fail(res, 400, "Holat noto'g'ri.");
      const r = db.prepare("UPDATE partner_requests SET status = ? WHERE id = ?").run(b.status, Number(m[1]));
      if (!r.changes) return fail(res, 404, "Ariza topilmadi.");
      return send(res, 200, { ok: true });
    }
    m = /^\/api\/admin\/listings\/([\w-]{1,40})\/owner$/.exec(p);
    if (m && M === "POST") {
      const b = await readJson(req);
      if (!db.prepare("SELECT 1 FROM listings WHERE id = ?").get(m[1])) return fail(res, 404, "Joy topilmadi.");
      if (!normPhone(b.phone)) { db.prepare("DELETE FROM listing_owners WHERE listing_id = ?").run(m[1]); return send(res, 200, { ok: true, owner: "" }); }
      const u = db.prepare("SELECT id, phone FROM users WHERE phone = ?").get(normPhone(b.phone));
      if (!u) return fail(res, 404, "Bu raqam bilan ro'yxatdan o'tgan foydalanuvchi yo'q. Hamkor avval saytda ro'yxatdan o'tsin.");
      db.prepare("INSERT INTO listing_owners (listing_id, user_id) VALUES (?, ?) ON CONFLICT(listing_id) DO UPDATE SET user_id = excluded.user_id").run(m[1], u.id);
      return send(res, 200, { ok: true, owner: u.phone });
    }
    // Bulk import (JSON array from admin: CSV is parsed in the browser). A row with a known id updates that listing.
    if (p === "/api/admin/listings/import" && M === "POST") {
      const b = await readJson(req, 3000000);
      if (!Array.isArray(b.items) || !b.items.length) return fail(res, 400, "Ro'yxat bo'sh.");
      if (b.items.length > 2000) return fail(res, 400, "Bir martada ko'pi bilan 2000 ta joy yuklanadi.");
      const ins = db.prepare("INSERT INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph,active,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
      const upd = db.prepare("UPDATE listings SET type=?,name=?,city=?,rating=?,reviews=?,price=?,capacity=?,tags=?,hue=?,glyph=?,active=?,details=? WHERE id=?");
      const has = db.prepare("SELECT 1 FROM listings WHERE id = ?");
      let added = 0, updated = 0;
      const errors = [];
      db.exec("BEGIN");
      try {
        b.items.forEach((row, i) => {
          if (!row || typeof row !== "object") { errors.push({ row: i + 1, error: "Qator noto'g'ri." }); return; }
          const known = /^[\w-]{1,40}$/.test(String(row.id || "")) && has.get(String(row.id));
          const x = validListing(row, known ? String(row.id) : "L" + crypto.randomBytes(4).toString("hex"));
          if (typeof x === "string") { errors.push({ row: i + 1, error: x }); return; }
          const v = [x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.tags), x.hue, x.glyph, x.active ? 1 : 0, JSON.stringify(x.details)];
          if (known) { upd.run(...v, x.id); updated++; } else { ins.run(x.id, ...v); added++; }
        });
        db.exec("COMMIT");
      } catch (e) { db.exec("ROLLBACK"); throw e; }
      return send(res, 200, { added, updated, errors: errors.slice(0, 50), failed: errors.length });
    }
    if (p === "/api/admin/listings" && M === "POST") {
      const x = validListing(await readJson(req), "L" + crypto.randomBytes(3).toString("hex"));
      if (typeof x === "string") return fail(res, 400, x);
      db.prepare("INSERT INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph,active,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(x.id, x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.tags), x.hue, x.glyph, x.active ? 1 : 0, JSON.stringify(x.details));
      return send(res, 201, x);
    }
    m = /^\/api\/admin\/listings\/([\w-]{1,40})$/.exec(p);
    if (m && M === "PUT") {
      const body = await readJson(req);
      const x = validListing(body, m[1]);
      if (typeof x === "string") return fail(res, 400, x);
      // The edit form covers only some fields: keep the stored ones it did not send (photos, layouts, itinerary…).
      const prev = db.prepare("SELECT details FROM listings WHERE id = ?").get(m[1]);
      const old = prev ? JSON.parse(prev.details || "{}") : {};
      for (const k of DETAIL_KEYS) if (!(k in body) && old[k] !== undefined) x.details[k] = old[k];
      const r = db.prepare("UPDATE listings SET type=?,name=?,city=?,rating=?,reviews=?,price=?,capacity=?,tags=?,hue=?,glyph=?,active=?,details=? WHERE id=?")
        .run(x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.tags), x.hue, x.glyph, x.active ? 1 : 0, JSON.stringify(x.details), x.id);
      return r.changes ? send(res, 200, x) : fail(res, 404, "Joy topilmadi.");
    }
    if (m && M === "DELETE") {
      // Soft delete keeps old bookings readable.
      db.prepare("UPDATE listings SET active = 0 WHERE id = ?").run(m[1]);
      return send(res, 200, { ok: true });
    }
    return fail(res, 404, "Topilmadi.");
  }

  if (p.startsWith("/api/")) return fail(res, 404, "Topilmadi.");

  // Static files
  if (M !== "GET" && M !== "HEAD") return fail(res, 405, "Ruxsat etilmagan.");
  const file = path.normalize(path.join(PUBLIC_DIR, p === "/" ? "index.html" : safeDecode(p)));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, "Ruxsat yo'q.");
  return serveFile(res, file);
}

const server = http.createServer((req, res) => {
  res.req = req;
  handle(req, res).catch((e) => {
    if (!e.status) console.error(e);
    if (!res.headersSent) fail(res, e.status || 500, e.status ? e.message : "Serverda xatolik. Keyinroq urinib ko'ring.");
  });
});

server.requestTimeout = 15000;
server.headersTimeout = 10000;

if (require.main === module) {
  server.listen(PORT, () => console.log(`bron.uz ishga tushdi: http://localhost:${PORT}  (admin: /admin)`));
  tg.start();
}
module.exports = { server, db, CITIES };
