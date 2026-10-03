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
    hue INTEGER DEFAULT 200, glyph TEXT DEFAULT '', active INTEGER DEFAULT 1
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

if (db.prepare("SELECT COUNT(*) AS n FROM listings").get().n === 0) {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8"));
  const ins = db.prepare("INSERT INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  for (const x of seed) ins.run(x.id, x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.tags), x.hue, x.glyph);
  console.log(`Bazaga ${seed.length} ta namuna joy yozildi.`);
}

const rowToListing = (r) => ({ ...r, tags: JSON.parse(r.tags || "[]"), active: !!r.active });

// ---------- rules shared with the front-end ----------
const TYPES = ["hotel", "venue", "tour"];
const PAY = ["joyida", "click", "payme", "uzum"];
const STATUSES = ["yangi", "tasdiqlandi", "bekor qilindi", "yakunlandi"];
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Xiva"];
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const today = () => new Date().toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const normPhone = (p) => String(p || "").replace(/[\s()-]/g, "");
const validPhone = (p) => /^\+998\d{9}$/.test(normPhone(p));
const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
const str = (v, max) => String(v ?? "").trim().slice(0, max);

function quote(item, from, to, guests) {
  if (item.type === "tour") return item.price * guests;
  const n = Math.max(1, days(from, to) + (item.type === "venue" ? 1 : 0));
  return item.price * n;
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
function send(res, status, body, headers = {}) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    "content-type": isJson ? "application/json; charset=utf-8" : headers["content-type"] || "text/plain; charset=utf-8",
    "x-content-type-options": "nosniff",
    "referrer-policy": "same-origin",
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
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch { reject(Object.assign(new Error("JSON noto'g'ri."), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

// Simple per-IP limit for public POSTs: 10 per minute.
const hits = new Map();
function limited(req) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 10;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.every((t) => now - t > 60000)) hits.delete(k); }, 300000).unref();

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

  // Public API
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
    const to = item.type === "tour" ? from : b.to;
    const guests = parseInt(b.guests, 10) || 0;
    const pay = PAY.includes(b.pay) ? b.pay : "joyida";
    if (client.length < 3) return fail(res, 400, "Ism familiyangizni kiriting.");
    if (!validPhone(phone)) return fail(res, 400, "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing.");
    if (!isDate(from) || from < today()) return fail(res, 400, "Bugungi yoki keyingi sanani tanlang.");
    if (!isDate(to)) return fail(res, 400, "Sanani tekshiring.");
    if (item.type === "hotel" && !(to > from)) return fail(res, 400, "Ketish sanasi kelish sanasidan keyin bo'lishi kerak.");
    if (item.type === "venue" && to < from) return fail(res, 400, "Tugash sanasi boshlanish sanasidan oldin bo'lmasin.");
    if (days(from, to) > 60) return fail(res, 400, "Bir bron 60 kundan oshmasin.");
    if (guests < 1 || guests > item.capacity) return fail(res, 400, `Bu joy ${item.capacity} kishigacha qabul qiladi.`);

    const sum = quote(item, from, to, guests);
    const code = "BRN-" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
    const booking = { code, listing_id: item.id, listing_name: item.name, city: item.city, type: item.type, date_from: from, date_to: to, guests, sum, pay, client, phone, note: str(b.note, 500), status: "yangi", created: new Date().toISOString() };
    db.prepare(`INSERT INTO bookings (code,listing_id,listing_name,city,type,date_from,date_to,guests,sum,pay,client,phone,note,status,created)
                VALUES (:code,:listing_id,:listing_name,:city,:type,:date_from,:date_to,:guests,:sum,:pay,:client,:phone,:note,:status,:created)`).run(booking);
    notify(`🆕 Yangi bron ${code}\n${item.name} (${item.city})\n${from}${to !== from ? " – " + to : ""}, ${guests} kishi\nSumma: ${som(sum)} · to'lov: ${pay}\nMijoz: ${client}, ${phone}${booking.note ? "\nIzoh: " + booking.note : ""}`);
    return send(res, 201, { code, sum, status: booking.status, name: item.name, city: item.city, type: item.type, from, to, guests });
  }

  // Customer cancels their own booking; phone must match.
  let m = /^\/api\/bookings\/(BRN-[A-Z0-9]{6})\/cancel$/.exec(p);
  if (m && M === "POST") {
    if (limited(req)) return fail(res, 429, "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring.");
    const b = await readJson(req);
    const row = db.prepare("SELECT * FROM bookings WHERE code = ?").get(m[1]);
    if (!row || row.phone !== normPhone(b.phone)) return fail(res, 404, "Bron topilmadi.");
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
  if (p === "/admin" || p.startsWith("/api/admin/")) {
    if (!isAdmin(req)) return askAuth(res);
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
      db.prepare("UPDATE group_requests SET status = ? WHERE id = ?").run(b.status, Number(m[1]));
      return send(res, 200, { ok: true });
    }

    if (p === "/api/admin/listings" && M === "GET") return send(res, 200, db.prepare("SELECT * FROM listings ORDER BY type, city, name").all().map(rowToListing));
    if (p === "/api/admin/listings" && M === "POST") {
      const x = validListing(await readJson(req), "L" + crypto.randomBytes(3).toString("hex"));
      if (typeof x === "string") return fail(res, 400, x);
      db.prepare("INSERT INTO listings (id,type,name,city,rating,reviews,price,capacity,tags,hue,glyph,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(x.id, x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.tags), x.hue, x.glyph, x.active ? 1 : 0);
      return send(res, 201, x);
    }
    m = /^\/api\/admin\/listings\/([\w-]{1,40})$/.exec(p);
    if (m && M === "PUT") {
      const x = validListing(await readJson(req), m[1]);
      if (typeof x === "string") return fail(res, 400, x);
      const r = db.prepare("UPDATE listings SET type=?,name=?,city=?,rating=?,reviews=?,price=?,capacity=?,tags=?,hue=?,glyph=?,active=? WHERE id=?")
        .run(x.type, x.name, x.city, x.rating, x.reviews, x.price, x.capacity, JSON.stringify(x.tags), x.hue, x.glyph, x.active ? 1 : 0, x.id);
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
  const file = path.normalize(path.join(PUBLIC_DIR, p === "/" ? "index.html" : decodeURIComponent(p)));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, "Ruxsat yo'q.");
  return serveFile(res, file);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    if (!e.status) console.error(e);
    if (!res.headersSent) fail(res, e.status || 500, e.status ? e.message : "Serverda xatolik. Keyinroq urinib ko'ring.");
  });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`bron.uz ishga tushdi: http://localhost:${PORT}  (admin: /admin)`));
}
module.exports = { server, db, CITIES };
