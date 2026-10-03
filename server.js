// bron.uz server: static site + JSON API + admin panel. No npm dependencies (Node.js 22.13+).
// Run: ADMIN_PASSWORD=... node server.js
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
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
    id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK (type IN ('hotel','venue','tour')),
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

// Older databases lack the details column.
if (!db.prepare("PRAGMA table_info(listings)").all().some((c) => c.name === "details")) db.exec("ALTER TABLE listings ADD COLUMN details TEXT DEFAULT '{}'");

// Extra listing fields kept as JSON: district, stars, old price, free cancellation, amenities, description, art style.
const DETAIL_KEYS = ["district", "stars", "old", "free", "amenities", "desc", "art", "photo", "photos", "format", "kind", "area", "layouts", "days", "nights", "route", "itinerary"];
const pickDetails = (x) => Object.fromEntries(DETAIL_KEYS.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));

if (db.prepare("SELECT COUNT(*) AS n FROM listings").get().n === 0) {
  // The site's own sample data (public/data.js) seeds an empty database.
  const sandbox = { window: {} };
  require("node:vm").runInNewContext(fs.readFileSync(path.join(PUBLIC_DIR, "data.js"), "utf8"), sandbox);
  const seed = sandbox.window.BRON_LISTINGS || [];
  const ins = db.prepare("INSERT INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const x of seed) ins.run(x.id, x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.amenities || []), x.hue, "", JSON.stringify(pickDetails(x)));
  console.log(`Bazaga ${seed.length} ta namuna joy yozildi.`);
}

const rowToListing = (r) => {
  const { details, ...rest } = r;
  const d = JSON.parse(details || "{}");
  return { ...rest, ...d, tags: JSON.parse(r.tags || "[]"), amenities: d.amenities || JSON.parse(r.tags || "[]"), active: !!r.active };
};

// ---------- rules shared with the front-end ----------
const TYPES = ["hotel", "venue", "tour"];
const PAY = ["joyida", "click", "payme", "uzum"];
const STATUSES = ["yangi", "tasdiqlandi", "bekor qilindi", "yakunlandi"];
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Xiva"];
// Real calendar dates only ("2026-11-31" is rejected rather than rolled over to December).
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
// "Today" in Tashkent (UTC+5, no daylight saving), so late-night bookings can't pick yesterday.
const today = () => new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const normPhone = (p) => String(p || "").replace(/[\s()-]/g, "");
const validPhone = (p) => /^\+998\d{9}$/.test(normPhone(p));
const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
const str = (v, max) => String(v ?? "").trim().slice(0, max);

// Same room multipliers as public/app.js.
const ROOMS = { standart: { mult: 1, extra: 0 }, deluxe: { mult: 1.35, extra: 0 }, lyuks: { mult: 1.8, extra: 2 } };
const roomOf = (item, room) => (item.type === "hotel" && ROOMS[room]) || ROOMS.standart;
function quote(item, from, to, guests, room) {
  const p = Math.round(item.price * roomOf(item, room).mult / 1000) * 1000;
  if (item.type === "tour") return p * guests;
  const n = Math.max(1, days(from, to) + (item.type === "venue" ? 1 : 0));
  return p * n;
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
  "connect-src 'self' https://commons.wikimedia.org https://upload.wikimedia.org https://fonts.googleapis.com https://fonts.gstatic.com",
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

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 20000) { reject(Object.assign(new Error("So'rov juda katta."), { status: 413 })); req.destroy(); return; }
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
function limited(req, bucket = "post", max = 10, windowMs = 60000) {
  const key = bucket + "|" + clientIp(req);
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

// Password guessing: 5 wrong passwords for one phone number lock it for 15 minutes.
const failures = new Map();
const locked = (phone) => { const f = failures.get(phone); return !!f && f.n >= 5 && Date.now() - f.t < 15 * 60000; };
const noteFailure = (phone) => { const f = failures.get(phone); const fresh = !f || Date.now() - f.t > 15 * 60000; failures.set(phone, { n: fresh ? 1 : f.n + 1, t: Date.now() }); };
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.every((t) => now - t > 15 * 60000)) hits.delete(k);
  for (const [k, f] of failures) if (now - f.t > 15 * 60000) failures.delete(k);
}, 300000).unref();

// ---------- customer accounts ----------
const SESSION_DAYS = 30;
const hashPass = (pass, salt) => crypto.scryptSync(pass, salt, 64).toString("hex");
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

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webp": "image/webp" };
function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Sahifa topilmadi.");
    send(res, 200, data, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
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
      amenities: Array.isArray(b.amenities) ? b.amenities.map((t) => str(t, 20)).slice(0, 12) : undefined,
      desc: str(b.desc, 600), art: str(b.art, 20) || undefined,
      photo: /^https:\/\/\S+$/.test(str(b.photo, 500)) ? str(b.photo, 500) : undefined,
      // Venue and tour-package extras (kept as-is from the sample data, cleaned up here).
      photos: Array.isArray(b.photos) ? b.photos.filter((x) => x && typeof x.file === "string").slice(0, 6).map((x) => ({ file: str(x.file, 200), title: str(x.title, 100) })) : undefined,
      format: ["conf", "meet", "gala", "open", "expo"].includes(b.format) ? b.format : undefined,
      kind: str(b.kind, 40) || undefined,
      area: parseInt(b.area, 10) > 0 ? parseInt(b.area, 10) : undefined,
      layouts: b.layouts && typeof b.layouts === "object" ? Object.fromEntries(["teatr", "sinf", "banket", "furshet"].map((k) => [k, Math.max(0, parseInt(b.layouts[k], 10) || 0)])) : undefined,
      days: parseInt(b.days, 10) > 0 ? Math.min(30, parseInt(b.days, 10)) : undefined,
      nights: parseInt(b.nights, 10) >= 0 && b.nights !== undefined ? Math.min(30, parseInt(b.nights, 10)) : undefined,
      route: Array.isArray(b.route) ? b.route.map((x) => str(x, 40)).filter(Boolean).slice(0, 8) : undefined,
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
  if (p === "/api/auth/register" && M === "POST") {
    if (limited(req, "register", 5)) return fail(res, 429, "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.");
    const b = await readJson(req);
    const name = str(b.name, 80), phone = normPhone(b.phone), pass = String(b.password || "");
    if (name.length < 3) return fail(res, 400, "Ism familiyangizni kiriting.");
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing.");
    if (pass.length < 8 || pass.length > 200) return fail(res, 400, "Parol kamida 8 belgidan iborat bo'lsin.");
    if (db.prepare("SELECT 1 FROM users WHERE phone = ?").get(phone)) return fail(res, 409, "Bu raqam bilan hisob bor. \"Kirish\" ni tanlang.");
    const salt = crypto.randomBytes(16).toString("hex");
    const r = db.prepare("INSERT INTO users (name,phone,pass_hash,salt,created) VALUES (?,?,?,?,?)").run(name, phone, hashPass(pass, salt), salt, new Date().toISOString());
    const id = Number(r.lastInsertRowid);
    return send(res, 201, { id, name, phone }, { "set-cookie": startSession(req, res, id) });
  }
  if (p === "/api/auth/login" && M === "POST") {
    if (limited(req, "login", 10)) return fail(res, 429, "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.");
    const b = await readJson(req);
    const phone = normPhone(b.phone);
    if (locked(phone)) return fail(res, 429, "Parol 5 marta noto'g'ri kiritildi. 15 daqiqadan keyin qayta urinib ko'ring.");
    const u = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
    // Hash even for unknown numbers so response time does not reveal which numbers have accounts.
    const given = hashPass(String(b.password || ""), u ? u.salt : "0".repeat(32));
    const ok = u && crypto.timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(u.pass_hash, "hex"));
    if (!ok) { noteFailure(phone); return fail(res, 401, "Telefon raqami yoki parol noto'g'ri."); }
    failures.delete(phone);
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
    const rows = db.prepare("SELECT code, listing_id AS id, listing_name AS name, city, type, date_from AS 'from', date_to AS 'to', guests, sum, status, phone FROM bookings WHERE user_id = ? ORDER BY created DESC LIMIT 100").all(u.id);
    return send(res, 200, rows);
  }

  if (p === "/api/listings" && M === "GET") {
    const rows = db.prepare("SELECT * FROM listings WHERE active = 1").all().map(rowToListing);
    return send(res, 200, rows);
  }

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
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing.");
    if (!isDate(from) || from < today()) return fail(res, 400, "Bugungi yoki keyingi sanani tanlang.");
    if (!isDate(to)) return fail(res, 400, "Sanani tekshiring.");
    if (item.type === "hotel" && !(to > from)) return fail(res, 400, "Ketish sanasi kelish sanasidan keyin bo'lishi kerak.");
    if (item.type === "venue" && to < from) return fail(res, 400, "Tugash sanasi boshlanish sanasidan oldin bo'lmasin.");
    if (days(from, to) > 60) return fail(res, 400, "Bir bron 60 kundan oshmasin.");
    if (guests < 1) return fail(res, 400, "Mehmonlar sonini kiriting.");
    if (item.type !== "hotel" && guests > item.capacity) return fail(res, 400, `Bu joy ${item.capacity} kishigacha qabul qiladi.`);

    const room = item.type === "hotel" && ROOMS[b.room] ? b.room : "standart";
    if (guests > item.capacity + roomOf(item, room).extra) return fail(res, 400, `Bu xona ${item.capacity + roomOf(item, room).extra} kishigacha.`);
    const sum = quote(item, from, to, guests, room);
    const code = "BRN-" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
    const booking = { code, listing_id: item.id, listing_name: item.name, city: item.city, type: item.type, date_from: from, date_to: to, guests, sum, pay, client, phone, note: str(b.note, 500), status: "yangi", created: new Date().toISOString(), user_id: currentUser(req)?.id ?? null };
    db.prepare(`INSERT INTO bookings (code,listing_id,listing_name,city,type,date_from,date_to,guests,sum,pay,client,phone,note,status,created,user_id)
                VALUES (:code,:listing_id,:listing_name,:city,:type,:date_from,:date_to,:guests,:sum,:pay,:client,:phone,:note,:status,:created,:user_id)`).run(booking);
    notify(`🆕 Yangi bron ${code}\n${item.name} (${item.city})\n${from}${to !== from ? " – " + to : ""}, ${guests} kishi\nSumma: ${som(sum)} · to'lov: ${pay}\nMijoz: ${client}, ${phone}${booking.note ? "\nIzoh: " + booking.note : ""}`);
    return send(res, 201, { code, sum, status: booking.status, name: item.name, city: item.city, type: item.type, from, to, guests });
  }

  // Customer cancels their own booking; phone must match.
  let m = /^\/api\/bookings\/(BRN-[A-Z0-9]{6})\/cancel$/.exec(p);
  if (m && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const row = db.prepare("SELECT * FROM bookings WHERE code = ?").get(m[1]);
    const u = currentUser(req);
    const mine = row && ((u && row.user_id === u.id) || row.phone === normPhone(b.phone));
    if (!mine) return fail(res, 404, "Bron topilmadi.");
    if (row.status === "bekor qilindi") return send(res, 200, { ok: true, status: row.status });
    if (row.status === "yakunlandi") return fail(res, 409, "Yakunlangan bronni bekor qilib bo'lmaydi.");
    db.prepare("UPDATE bookings SET status = 'bekor qilindi' WHERE code = ?").run(m[1]);
    notify(`❌ Mijoz bronni bekor qildi: ${m[1]} (${row.listing_name}, ${row.date_from})`);
    return send(res, 200, { ok: true });
  }

  if (p === "/api/group-requests" && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const company = str(b.company, 120), kind = str(b.kind, 60), people = parseInt(b.people, 10) || 0, phone = normPhone(b.phone);
    if (company.length < 2) return fail(res, 400, "Kompaniya nomini kiriting.");
    if (people < 10) return fail(res, 400, "Guruh so'rovi 10 kishidan boshlanadi.");
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing.");
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
      const r = db.prepare("UPDATE bookings SET status = ? WHERE code = ?").run(b.status, m[1]);
      return r.changes ? send(res, 200, { ok: true }) : fail(res, 404, "Bron topilmadi.");
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

    if (p === "/api/admin/listings" && M === "GET") return send(res, 200, db.prepare("SELECT * FROM listings ORDER BY type, city, name").all().map(rowToListing));
    if (p === "/api/admin/listings" && M === "POST") {
      const x = validListing(await readJson(req), "L" + crypto.randomBytes(3).toString("hex"));
      if (typeof x === "string") return fail(res, 400, x);
      db.prepare("INSERT INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph,active,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(x.id, x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.tags), x.hue, x.glyph, x.active ? 1 : 0, JSON.stringify(x.details));
      return send(res, 201, x);
    }
    m = /^\/api\/admin\/listings\/([\w-]{1,40})$/.exec(p);
    if (m && M === "PUT") {
      const x = validListing(await readJson(req), m[1]);
      if (typeof x === "string") return fail(res, 400, x);
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
}
module.exports = { server, db, CITIES };
