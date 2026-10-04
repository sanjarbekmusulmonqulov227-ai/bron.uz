// bron.uz front-end: illustrated listings, search and filters, detail and booking dialogs, favourites.
// With server.js running, listings and bookings go through /api. Opened as a static site
// (GitHub Pages, a plain file or a preview) it uses the sample data in data.js and localStorage.
(function () {
  "use strict";

  let LISTINGS = (window.BRON_LISTINGS || []).slice();
  const CITIES = window.BRON_CITIES || [];

  const TYPES = {
    hotel: { title: "Mehmonxonalar", kind: "Mehmonxona", unit: "1 kecha", from: "Kelish", to: "Ketish", guests: "Mehmonlar", noun: "kecha" },
    hostel: { title: "Hostellar", kind: "Hostel", unit: "1 o'rin, 1 kecha", from: "Kelish", to: "Ketish", guests: "O'rinlar", noun: "kecha" },
    transport: { title: "Transport", kind: "Transport", unit: "1 yo'lovchi", from: "Sana", to: "", guests: "Yo'lovchilar", noun: "yo'lovchi" },
    venue: { title: "Konferens-zallar", kind: "Zal", unit: "1 kun", from: "Boshlanish", to: "Tugash", guests: "Qatnashchilar", noun: "kun" },
    tour:  { title: "Tur paketlari va ekskursiyalar", kind: "Tur", unit: "1 kishi", from: "Sana", to: "Qaytish", guests: "Kishilar", noun: "kishi" }
  };

  // Hotels and hostels are sold by the night.
  const nightly = (x) => x.type === "hotel" || x.type === "hostel";
  const ROOMS = [
    { id: "standart", name: "Standart xona", mult: 1, extra: 0, note: "Ikki kishilik yoki ikkita alohida karavot" },
    { id: "deluxe", name: "Deluxe", mult: 1.35, extra: 0, note: "Kengroq xona, manzarali deraza, kofe-mashina" },
    { id: "lyuks", name: "Oilaviy lyuks", mult: 1.8, extra: 2, note: "Ikki xonali, mehmonxona qismi va qo'shimcha karavot" }
  ];

  // Amenity icons: 24x24 stroke paths.
  const AMEN = {
    wifi: ["Wi-Fi", "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"],
    breakfast: ["Nonushta", "M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3"],
    pool: ["Basseyn", "M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 15V5a2 2 0 0 1 4 0M16 15V5a2 2 0 0 0-4 0M8 9h8"],
    spa: ["Spa", "M12 21c-5 0-8-4-8-9 4 0 8 3 8 9zM12 21c5 0 8-4 8-9-4 0-8 3-8 9zM12 12c0-4 2-7 0-9-2 2 0 5 0 9"],
    gym: ["Fitnes", "M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"],
    parking: ["Avtoturargoh", "M5 3h14v18H5zM10 17V7h3a3 3 0 0 1 0 6h-3"],
    restaurant: ["Restoran", "M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21V3c-2 1-3 4-3 7h3"],
    transfer: ["Transfer", "M3 16V11l2-5h14l2 5v5M3 16h18M7 16v3M17 16v3M6 12h.01M18 12h.01"],
    ac: ["Konditsioner", "M12 2v20M4.9 6l14.2 12M4.9 18L19.1 6M9 3l3 2 3-2M9 21l3-2 3 2"],
    family: ["Oilalar uchun", "M8 7a3 3 0 1 0 0-.01M17 9a2 2 0 1 0 0-.01M3 21v-3a5 5 0 0 1 10 0v3M14 21v-2a3 3 0 0 1 6 0v2"],
    translation: ["Sinxron tarjima", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"],
    screen: ["LED ekran", "M3 4h18v12H3zM8 20h8M12 16v4"],
    coffee: ["Kofe-breyk", "M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2"],
    stage: ["Sahna", "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3"],
    guide: ["Gid", "M5 21V4M5 4h11l-2 4 2 4H5"],
    tickets: ["Chiptalar kiradi", "M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3zM14 4v16"],
    meal: ["Ovqat kiradi", "M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21V3c-2 1-3 4-3 7h3"],
    hotel: ["Mehmonxona", "M3 19V8M3 14h18v5M21 19v-5a3 3 0 0 0-3-3h-7v3M7 11.5a1.5 1.5 0 1 0 0-.01"],
    train: ["Poyezd chiptasi", "M7 3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 10h16M8 21l2-4M16 21l-2-4M8 13.5h.01M16 13.5h.01"],
    kitchen: ["Umumiy oshxona", "M4 3v18M8 3v6a2 2 0 0 1-4 0M14 3h5v8h-5zM16.5 11v10"],
    laundry: ["Kir yuvish", "M5 3h14v18H5zM5 7h14M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 5h.01"],
    transport: ["Transport", "M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11M5 17h14M5 11h14M8 17v3M16 17v3"]
  };
  const AMEN_FILTER = {
    hostel: ["wifi", "breakfast", "kitchen", "laundry", "ac", "transfer"],
    hotel: ["wifi", "breakfast", "pool", "spa", "parking", "transfer", "family"],
    venue: ["translation", "screen", "coffee", "parking", "wifi"],
    tour: ["hotel", "train", "guide", "transport", "meal", "tickets"]
  };

  const STORE_KEY = "bronuz.bookings";
  const FAV_KEY = "bronuz.favs";
  const T = (s) => (window.BRON_I18N ? window.BRON_I18N.t(s) : s);
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const state = { type: "hotel", city: "", from: "", to: "", guests: 2, sort: "rec", maxPct: 100, stars: new Set(), amen: new Set(), free: false, deals: false, favOnly: false, current: null, room: "standart", limit: 9, vFormat: "", vLimit: 6, pk: "multi", trMode: "avia", mapType: "" };
  let API = false;

  // ---------- helpers ----------
  const som = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  const short = (n) => n >= 1e6 ? (Math.round(n / 1e5) / 10).toString().replace(".", ",") + " mln" : Math.round(n / 1000) + " ming";
  const pad = (n) => String(n).padStart(2, "0");
  // Dates are handled in the visitor's local calendar (Tashkent), not UTC.
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const day = (s) => new Date(s + "T00:00");
  const todayIso = () => iso(new Date());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normPhone = (p) => p.replace(/[\s()-]/g, "");
  const validPhone = (p) => /^\+998\d{9}$/.test(normPhone(p));
  const fmtDate = (s) => { const [y, m, d] = s.split("-"); return `${d}.${m}.${y}`; };
  const starStr = (n) => n ? "★".repeat(n) : "";
  const ratingWord = (r) => r >= 9.3 ? "A'lo" : r >= 8.8 ? "Juda yaxshi" : r >= 8.3 ? "Yaxshi" : "Yomon emas";
  const icon = (k) => AMEN[k] ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${AMEN[k][1]}"/></svg>` : "";
  const heart = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>`;

  function store(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } }
  function keep(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage blocked: memory only */ } }
  let memoryBookings = store(STORE_KEY, []);
  let favs = new Set(store(FAV_KEY, []));
  function saveBookings(list) { memoryBookings = list; keep(STORE_KEY, list); }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 3400);
  }

  async function api(path, body) {
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Server javob bermadi. Keyinroq urinib ko'ring.");
    return data;
  }

  // ---------- illustrations ----------
  // Each listing gets a small SVG scene in the style of its city: domes, minarets, fortress walls, mountains.
  function rng(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function art(style, hue, uid) {
    const R = rng(uid + style);
    const id = "g" + String(uid).replace(/[^a-z0-9]/gi, "");
    const sky1 = `hsl(${hue} 60% 20%)`, sky2 = `hsl(${(hue + 20) % 360} 60% 48%)`, sky3 = `hsl(${(hue + 330) % 360} 80% 78%)`;
    const sand = "hsl(36 48% 74%)", sandD = "hsl(30 38% 56%)", tile = "hsl(188 72% 42%)", tileL = "hsl(186 70% 58%)", dark = "hsl(220 45% 14%)";
    const ground = `<rect x="0" y="222" width="400" height="28" fill="hsl(${hue} 30% 16%)"/>`;
    let scene = "";
    const minaret = (x, h, w = 12) => `<rect x="${x - w / 2}" y="${222 - h}" width="${w}" height="${h}" fill="${sand}"/><rect x="${x - w / 2 - 2}" y="${222 - h}" width="${w + 4}" height="6" fill="${sandD}"/><path d="M${x - w / 2} ${222 - h}q${w / 2} -${w * 1.4} ${w} 0z" fill="${tile}"/><rect x="${x - w / 2}" y="${222 - h * .55}" width="${w}" height="4" fill="${tile}"/>`;
    const dome = (cx, cy, rx, ry) => `<rect x="${cx - rx * .75}" y="${cy}" width="${rx * 1.5}" height="${222 - cy}" fill="${sandD}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${tile}"/><path d="M${cx - rx * .55} ${cy - ry * .2}q${rx * .55} -${ry * 1.2} ${rx * .8} -${ry * .3}" stroke="${tileL}" stroke-width="3" fill="none" opacity=".7"/><rect x="${cx - 1.5}" y="${cy - ry - 12}" width="3" height="12" fill="${sand}"/>`;
    const portal = (cx, top, w) => `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="${222 - top}" fill="${sand}"/><rect x="${cx - w / 2}" y="${top}" width="${w}" height="8" fill="${tile}"/><path d="M${cx - w * .3} 222V${top + w * .55}q${w * .3} -${w * .45} ${w * .6} 0V222z" fill="${dark}"/><path d="M${cx - w * .3} ${top + w * .55}q${w * .3} -${w * .45} ${w * .6} 0" stroke="${tile}" stroke-width="4" fill="none"/>`;
    const tree = (x, s) => `<rect x="${x - 1.5}" y="${222 - s * 1.4}" width="3" height="${s * 1.4}" fill="hsl(30 30% 25%)"/><circle cx="${x}" cy="${222 - s * 1.6}" r="${s}" fill="hsl(130 35% ${28 + R() * 10}%)"/>`;
    const mountains = (base, col, snow) => {
      let p = `M0 ${base}`; let x = 0;
      while (x < 400) { const w = 60 + R() * 70, h = 50 + R() * 80; p += `L${x + w / 2} ${base - h}L${x + w} ${base}`; x += w * .8; }
      return `<path d="${p}V250H0z" fill="${col}"/>` + (snow ? "" : "");
    };
    switch (style) {
      case "dome": scene = dome(200, 120, 48, 42) + portal(200, 92, 104) + minaret(118, 150) + minaret(282, 150) + dome(70, 165, 26, 22) + dome(335, 168, 24, 20); break;
      case "minaret": scene = `<path d="M200 222L206 52h22l6 170z" fill="${sand}"/>` + [80, 120, 160].map((y) => `<rect x="${203 + (y - 52) * .02}" y="${y}" width="${28 - (y - 52) * .03}" height="5" fill="${sandD}"/>`).join("") + `<rect x="202" y="44" width="30" height="10" fill="${sandD}"/><path d="M205 44q12 -16 24 0z" fill="${tile}"/>` + dome(105, 170, 40, 32) + `<rect x="40" y="170" width="130" height="52" fill="${sand}"/><path d="M70 222v-28q15 -18 30 0v28z" fill="${dark}"/>` + dome(320, 175, 30, 24); break;
      case "fortress": scene = `<path d="M0 160h400v62H0z" fill="${sandD}"/>` + Array.from({ length: 20 }, (_, i) => `<rect x="${i * 20}" y="150" width="11" height="12" fill="${sandD}"/>`).join("") + [40, 150, 270, 370].map((x) => `<path d="M${x - 18} 222V150q18 -14 36 0v72z" fill="${sand}"/>`).join("") + `<rect x="190" y="98" width="54" height="124" rx="6" fill="${tile}"/>` + [110, 128, 146, 164, 182, 200].map((y, i) => `<rect x="190" y="${y}" width="54" height="7" fill="${i % 2 ? sand : tileL}"/>`).join("") + `<path d="M180 222v-36q16 -20 32 0v36z" fill="${dark}"/>`; break;
      case "portal": scene = `<path d="M110 222V70h70v152z" fill="${sand}"/><path d="M220 222V64h70v158z" fill="${sand}"/><rect x="110" y="70" width="70" height="10" fill="${tile}"/><rect x="220" y="64" width="70" height="10" fill="${tile}"/>` + [100, 130, 160, 190].map((y) => `<rect x="122" y="${y}" width="46" height="14" fill="${tile}" opacity=".85"/><rect x="232" y="${y - 4}" width="46" height="14" fill="${tile}" opacity=".85"/>`).join("") + tree(60, 18) + tree(340, 20) + tree(370, 14); break;
      case "tower": { let s = ""; let x = 10; while (x < 390) { const w = 26 + R() * 30, h = 50 + R() * 140; s += `<rect x="${x}" y="${222 - h}" width="${w}" height="${h}" fill="hsl(${hue} 30% ${22 + R() * 14}%)"/>`; for (let wy = 222 - h + 8; wy < 214; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) if (R() > .45) s += `<rect x="${wx}" y="${wy}" width="4" height="5" fill="hsl(44 90% ${70 + R() * 15}%)" opacity=".9"/>`; x += w + 4 + R() * 6; } scene = s + `<path d="M188 222V40l12 -14 12 14v182z" fill="hsl(${hue} 35% 30%)"/>`; break; }
      case "classic": scene = `<rect x="70" y="120" width="260" height="102" fill="${sand}"/><path d="M60 122L200 70l140 52z" fill="${sandD}"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="${86 + i * 31}" y="132" width="12" height="90" fill="hsl(36 40% 86%)"/>`).join("") + `<rect x="60" y="118" width="280" height="6" fill="${tile}"/>` + tree(30, 16) + tree(372, 18); break;
      case "house": scene = `<rect x="60" y="130" width="280" height="92" fill="${sand}"/><rect x="60" y="124" width="280" height="10" fill="hsl(25 40% 40%)"/>` + Array.from({ length: 6 }, (_, i) => `<rect x="${80 + i * 48}" y="140" width="8" height="82" fill="hsl(25 45% 35%)"/>`).join("") + `<rect x="60" y="140" width="280" height="8" fill="hsl(25 45% 35%)"/>` + [104, 152, 200, 248, 296].map((x) => `<path d="M${x - 14} 222v-40q14 -16 28 0v40z" fill="${tile}" opacity=".55"/>`).join("") + tree(30, 22) + tree(370, 20); break;
      case "garden": scene = tree(40, 24) + tree(95, 18) + tree(310, 22) + tree(365, 26) + `<rect x="150" y="150" width="100" height="72" fill="${sand}"/><path d="M140 152L200 110l60 42z" fill="${tile}"/>` + [165, 195, 225].map((x) => `<path d="M${x - 9} 222v-36q9 -12 18 0v36z" fill="${dark}"/>`).join("") + `<ellipse cx="200" cy="236" rx="90" ry="7" fill="${tileL}" opacity=".5"/>`; break;
      case "mountain": scene = mountains(200, `hsl(${hue} 30% 40%)`) + mountains(222, `hsl(${hue} 30% 26%)`) + `<path d="M150 120l40 -70 40 70-14 -6-12 10-14 -12-14 12z" fill="#f4f8ff"/>` + Array.from({ length: 9 }, (_, i) => { const x = 20 + i * 45 + R() * 10; return `<path d="M${x} 222l10 -34 10 34z" fill="hsl(150 35% 18%)"/>`; }).join(""); break;
      case "lake": scene = mountains(170, `hsl(${hue} 30% 38%)`) + `<rect x="0" y="170" width="400" height="56" fill="hsl(${hue} 60% 42%)"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="${20 + R() * 340}" y="${178 + i * 6}" width="${30 + R() * 50}" height="2" fill="#fff" opacity=".35"/>`).join("") + `<path d="M280 196h80l-10 20h-60z" fill="hsl(25 45% 35%)"/><path d="M300 196l20 -22 20 22z" fill="hsl(25 45% 45%)"/>`; break;
      case "stupa": scene = `<rect x="110" y="190" width="180" height="32" fill="${sandD}"/><path d="M130 190a70 62 0 0 1 140 0z" fill="${sand}"/><rect x="194" y="112" width="12" height="18" fill="${sandD}"/>` + [40, 330].map((x) => `<rect x="${x}" y="176" width="34" height="46" fill="${sandD}"/><rect x="${x + 6}" y="170" width="22" height="8" fill="${sandD}"/>`).join("") + tree(370, 14); break;
      case "hall": scene = `<rect x="40" y="110" width="320" height="112" fill="hsl(${hue} 35% 32%)"/>` + Array.from({ length: 12 }, (_, i) => `<rect x="${52 + i * 26}" y="122" width="18" height="90" fill="hsl(${hue} 60% ${55 + (i % 3) * 6}%)" opacity=".8"/>`).join("") + `<path d="M30 112h340l-30 -22H60z" fill="${tile}"/><rect x="170" y="176" width="60" height="46" fill="${dark}"/>`; break;
      default: scene = dome(200, 130, 50, 44);
    }
    const stars = Array.from({ length: 14 }, () => `<circle cx="${R() * 400}" cy="${R() * 90}" r="${R() * 1.2 + .3}" fill="#fff" opacity="${.3 + R() * .5}"/>`).join("");
    return `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset=".6" stop-color="${sky2}"/><stop offset="1" stop-color="${sky3}"/></linearGradient></defs><rect width="400" height="250" fill="url(#${id})"/>${stars}<circle cx="${300 + R() * 60}" cy="${60 + R() * 30}" r="22" fill="hsl(44 95% 78%)" opacity=".9"/>${scene}${ground}</svg>`;
  }

  // ---------- photos (Wikimedia Commons) ----------
  const PHOTOS = window.BRON_PHOTOS || {};
  const photoUrl = (file, w) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
  const filePage = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;
  const hashOf = (s) => { let h = 0; for (const c of String(s)) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h; };
  // A listing shows photos of its city, starting at a different one per listing; admins may set their own photo URL.
  function photosFor(x) {
    const own = (x.photo ? [{ url: x.photo, title: x.name }] : []).concat(x.photos || []);
    const list = PHOTOS[x.city] || [];
    const k = list.length ? hashOf(x.id) % list.length : 0;
    // A multi-city package shows one landmark from every city on its route, starting with the most famous one.
    const stops = (x.days > 1 ? x.route || [] : []).filter((c) => PHOTOS[c]).map((c) => PHOTOS[c][hashOf(x.id + c) % PHOTOS[c].length]);
    if (stops.length > 1 && x.route[0] === "Toshkent") stops.push(stops.shift());
    return own.concat(stops.length ? stops : [], list.slice(k), list.slice(0, k)).filter((p, i, a) => a.indexOf(p) === i);
  }
  const srcOf = (p, w) => p.url || photoUrl(p.file, w);
  const imgTag = (p, w) => p ? `<img class="ph" data-ph loading="lazy" decoding="async" alt="" src="${esc(srcOf(p, w))}">` : "";
  document.addEventListener("load", (e) => { if (e.target.matches && e.target.matches("img[data-ph]")) e.target.classList.add("ready"); }, true);
  document.addEventListener("error", (e) => {
    if (!(e.target.matches && e.target.matches("img[data-ph]"))) return;
    const host = e.target.parentNode;
    e.target.remove();
    // Without the photo its caption would label the drawing, so drop it too.
    if (host) host.querySelectorAll(":scope > .place, :scope > .g-cap").forEach((c) => c.remove());
  }, true);

  function heroPhoto() {
    const p = (PHOTOS["Samarqand"] || [])[1];
    if (!p) return;
    const im = new Image();
    im.onload = () => { const el = $("#heroPhoto"); el.style.backgroundImage = `url("${im.src}")`; el.classList.add("ready"); $("#phonePhoto").style.backgroundImage = `url("${im.src}")`; };
    im.src = photoUrl(p.file, 1600);
    const day = (PHOTOS["Samarqand"] || [])[0];
    $("#heroArch").innerHTML = art("dome", 205, "heroarch") + (day ? imgTag(day, 900) : "");
  }

  function heroArt() {
    // Wide silhouette skyline in three depths.
    const layer = (op, y, seed) => {
      const R = rng(seed); let s = ""; let x = 0;
      while (x < 1600) {
        const k = R();
        if (k < .3) { const r = 30 + R() * 30; s += `<rect x="${x}" y="${y - r * .6}" width="${r * 1.6}" height="${300 - y + r * .6}"/><ellipse cx="${x + r * .8}" cy="${y - r * .6}" rx="${r}" ry="${r * .9}"/>`; x += r * 2 + 10; }
        else if (k < .55) { const h = 120 + R() * 80; s += `<rect x="${x}" y="${y - h}" width="16" height="${h + 300}"/><path d="M${x} ${y - h}q8 -20 16 0z"/>`; x += 40; }
        else if (k < .8) { const w = 80 + R() * 40, h = 60 + R() * 50; s += `<path d="M${x} 300V${y - h}h${w}V300zM${x + w * .25} 300V${y - h * .4}q${w * .25} -${w * .4} ${w * .5} 0V300z" fill-rule="evenodd"/>`; x += w + 8; }
        else { const w = 50 + R() * 60; s += `<rect x="${x}" y="${y - 20}" width="${w}" height="320"/>`; x += w; }
      }
      return `<g fill="#fff" opacity="${op}">${s}</g>`;
    };
    $("#heroArt").innerHTML = `<svg viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice">${layer(.05, 180, "a")}${layer(.08, 230, "b")}${layer(.12, 280, "c")}</svg>`;
  }

  // ---------- pricing ----------
  function roomOf(item, roomId) { return item.type === "hotel" ? (ROOMS.find((r) => r.id === roomId) || ROOMS[0]) : ROOMS[0]; }
  function unitPrice(item, roomId) { return Math.round(item.price * roomOf(item, roomId).mult / 1000) * 1000; }
  function quote(item, from, to, guests, roomId) {
    const t = TYPES[item.type];
    if (item.type === "transport") { const q = tripQuote(item.trip, roomId, guests); return { label: q.mode === "avto" ? `${q.name}, butun mashina` : `${som(q.unit)} × ${guests} ${t.noun}`, sum: q.sum }; }
    const p = unitPrice(item, roomId);
    if (item.type === "tour") return { label: `${som(p)} × ${guests} ${t.noun}`, sum: p * guests };
    const n = Math.max(1, daysBetween(from, to) + (item.type === "venue" ? 1 : 0));
    if (item.type === "hostel") return { label: `${som(p)} × ${n} ${t.noun} × ${guests} o'rin`, sum: p * n * guests };
    return { label: `${som(p)} × ${n} ${t.noun}`, sum: p * n };
  }

  // ---------- transport (sample timetable in data.js; same prices as server.js) ----------
  const TRANSPORT = window.BRON_TRANSPORT || { avia: [], poyezd: [], avto: [], vehicles: [] };
  const TRIPS = new Map([...TRANSPORT.avia, ...TRANSPORT.poyezd, ...TRANSPORT.avto].map((t) => [t.id, t]));
  function tripQuote(t, cls, guests) {
    if (t.mode === "avto") return { mode: "avto", name: t.name, unit: t.price, sum: t.price, cap: t.seats };
    if (t.mode === "poyezd") { const c = t.classes[cls] ? cls : Object.keys(t.classes)[0]; return { mode: "poyezd", unit: t.classes[c], sum: t.classes[c] * guests, cap: 10, cls: c }; }
    return { mode: "avia", unit: t.price, sum: t.price * guests, cap: 9 };
  }
  const tripName = (t) => t.mode === "avto" ? `${t.name}: ${t.from}${t.transfer ? " shahar ichida transfer" : " → " + t.to}` : t.mode === "poyezd" ? `${t.name} ${t.no}: ${t.from} → ${t.to}` : `${t.no}: ${t.from} → ${t.to}`;
  const tripItem = (t) => t && { id: t.id, type: "transport", trip: t, name: tripName(t), city: t.from, capacity: tripQuote(t, "", 1).cap, price: tripQuote(t, "", 1).unit };
  const maxPriceFor = (type) => Math.max(...LISTINGS.filter((x) => x.type === type).map((x) => x.price), 1);
  const priceCap = () => state.maxPct >= 100 ? Infinity : Math.round(maxPriceFor(state.type) * state.maxPct / 100);

  // ---------- search & filters ----------
  function setType(type) {
    state.type = type;
    $$(".tab").forEach((b) => { const on = b.dataset.type === type; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
    const t = TYPES[type];
    $("#fFromLabel").textContent = t.from;
    $("#fToLabel").textContent = t.to;
    $("#fGuestsLabel").textContent = t.guests;
    $("#fToWrap").hidden = type === "tour";
    $(".fields").classList.toggle("no-to", type === "tour");
    if (type === "venue" && +$("#fGuests").value < 10) $("#fGuests").value = 50;
    if (type !== "venue" && +$("#fGuests").value > 40) $("#fGuests").value = 2;
    state.stars.clear(); state.amen.clear(); state.maxPct = 100;
    if (state.favOnly && !LISTINGS.some((x) => x.type === type && favs.has(x.id))) { state.favOnly = false; $("#fFav").checked = false; }
    buildFilters();
    readSearch();
    render();
  }

  function buildFilters() {
    $("#starsGroup").hidden = state.type !== "hotel";
    $("#fStars").innerHTML = [5, 4, 3, 2].map((n) => `<button type="button" class="chip" data-star="${n}" aria-pressed="${state.stars.has(n)}">${n} ★</button>`).join("");
    $("#fAmen").innerHTML = AMEN_FILTER[state.type].map((k) => `<label class="check"><input type="checkbox" data-amen="${k}"${state.amen.has(k) ? " checked" : ""}> <span>${AMEN[k][0]}</span></label>`).join("");
    const prices = LISTINGS.filter((x) => x.type === state.type).map((x) => x.price);
    $("#fPrice").min = prices.length ? Math.max(1, Math.ceil(Math.min(...prices) / maxPriceFor(state.type) * 100)) : 1;
    state.maxPct = Math.max(state.maxPct, +$("#fPrice").min);
    $("#fPrice").value = state.maxPct;
    $("#priceUnit").textContent = `${TYPES[state.type].unit} uchun`;
    updatePriceOut();
  }
  function updatePriceOut() { const cap = priceCap(); $("#priceOut").textContent = cap === Infinity ? "Istalgan" : `${short(cap)} gacha`; }

  function readSearch() {
    state.city = $("#fCity").value;
    state.from = $("#fFrom").value;
    state.to = $("#fTo").value;
    state.guests = Math.min(5000, Math.max(1, parseInt($("#fGuests").value, 10) || 1));
    if (String(state.guests) !== $("#fGuests").value) $("#fGuests").value = state.guests;
    state.sort = $("#fSort").value;
    state.limit = 9;
  }

  function validateSearch() {
    const msg = $("#searchMsg");
    msg.className = "form-msg"; msg.textContent = "";
    const t = TYPES[state.type];
    const fail = (s) => { msg.textContent = s; msg.classList.add("err"); return false; };
    if (!state.from) return fail("Sanani tanlang.");
    if (state.from < todayIso()) return fail("O'tgan sanani tanlab bo'lmaydi. Bugungi yoki keyingi kunni tanlang.");
    if (state.type !== "tour" && state.to < state.from) return fail(`"${t.to}" sanasi "${t.from}" sanasidan keyin bo'lishi kerak.`);
    if (nightly(state) && state.to === state.from) return fail("Kamida 1 kecha tanlang.");
    return true;
  }

  function results() {
    const cap = priceCap();
    const need = state.guests;
    let list = LISTINGS.filter((x) => x.type === state.type
      && (!state.city || x.city === state.city)
      && x.capacity + (x.type === "hotel" ? 2 : 0) >= need
      && x.price <= cap
      && (!state.stars.size || state.stars.has(x.stars))
      && [...state.amen].every((a) => (x.amenities || []).includes(a))
      && (!state.free || x.free)
      && (!state.deals || x.old)
      && (!state.favOnly || favs.has(x.id)));
    const by = { cheap: (a, b) => a.price - b.price, exp: (a, b) => b.price - a.price, rate: (a, b) => b.rating - a.rating, rec: (a, b) => b.rating * Math.log(b.reviews + 2) - a.rating * Math.log(a.reviews + 2) };
    return list.sort(by[state.sort]);
  }

  function card(x) {
    const t = TYPES[x.type];
    const cap = x.type === "hotel" ? `${x.capacity} kishigacha` : x.type === "hostel" ? `${x.beds || x.capacity} o'rinli` : x.type === "venue" ? `${x.capacity} o'rin` : `Guruh ${x.capacity} kishigacha`;
    const off = x.old ? Math.round((1 - x.price / x.old) * 100) : 0;
    const am = (x.amenities || []).slice(0, 4);
    return `
    <article class="item">
      <div style="position:relative">
        <button class="thumb" type="button" data-open="${esc(x.id)}" aria-label="${esc(x.name)}: batafsil">${art(x.art, x.hue, x.id)}${imgTag(photosFor(x)[0], 640)}<span class="kind">${t.kind} · ${esc(x.city)}</span>${off ? `<span class="badge">−${off}%</span>` : ""}${photosFor(x)[0] ? `<span class="place">${esc(photosFor(x)[0].title)}</span>` : ""}</button>
        <button class="fav" type="button" data-fav="${esc(x.id)}" aria-pressed="${favs.has(x.id)}" aria-label="${favs.has(x.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}">${heart}</button>
      </div>
      <div class="item-body">
        <div class="item-top">
          <div>${x.stars ? `<div class="stars" aria-label="${x.stars} yulduz">${starStr(x.stars)}</div>` : ""}<h3><button type="button" data-open="${esc(x.id)}">${esc(x.name)}</button></h3></div>
          <div class="rating"><b>${Number(x.rating).toFixed(1)}</b><small>${x.reviews} sharh</small></div>
        </div>
        <p class="meta">${esc(x.district || x.city)} · ${cap}</p>
        <div class="amen">${am.map((k) => AMEN[k] ? `<span>${icon(k)}${AMEN[k][0]}</span>` : "").join("")}</div>
        ${x.free ? `<p class="free">✓ Bepul bekor qilish</p>` : ""}
      </div>
      <div class="item-foot">
        <p class="price">${x.old ? `<s>${som(x.old)}</s>` : ""}<b>${som(x.price)}</b><small>${t.unit}${x.type === "hotel" ? " dan" : ""}</small></p>
        <button class="btn btn-gold" type="button" data-book="${esc(x.id)}">Bron qilish</button>
      </div>
    </article>`;
  }

  function render() {
    const t = TYPES[state.type];
    const list = results();
    $("#resEyebrow").textContent = t.title;
    $("#resTitle").textContent = state.city ? state.city : "Barcha shaharlar";
    $("#resCount").textContent = `${list.length} ta variant`;
    $$(".city").forEach((c) => { c.classList.toggle("is-on", c.dataset.city === state.city); c.setAttribute("aria-pressed", String(c.dataset.city === state.city)); });
    const shown = list.slice(0, state.limit);
    $("#moreBtn").hidden = list.length <= state.limit;
    $("#moreBtn").textContent = `Yana ko'rsatish (${list.length - shown.length})`;
    $("#grid").innerHTML = list.length ? shown.map(card).join("")
      : `<div class="empty"><b>Bu shartlar bo'yicha joy topilmadi</b><span>Filtrlarni yumshating yoki boshqa shaharni tanlang.</span><button class="btn btn-line" type="button" data-reset>Filtrlarni tozalash</button></div>`;
  }

  // ---------- conference halls ----------
  const FORMATS = { "": "Hammasi", conf: "Konferensiya", meet: "Seminar va muzokara", gala: "Banket va gala", open: "Ochiq maydon", expo: "Ko'rgazma" };
  const LAYOUTS = {
    teatr: ["Teatr", "M4 5h16M5 9h2M11 9h2M17 9h2M5 13h2M11 13h2M17 13h2M5 17h2M11 17h2M17 17h2"],
    sinf: ["Sinf", "M4 5h16M4 10h6M14 10h6M4 15h6M14 15h6M6 10v2M8 10v2M16 10v2M18 10v2"],
    banket: ["Banket", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"],
    furshet: ["Furshet", "M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v7M8 21h8"]
  };
  const lic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  function layoutList(x, cls) {
    const L = x.layouts || { teatr: x.capacity };
    return `<ul class="${cls}">${Object.keys(LAYOUTS).filter((k) => L[k]).map((k) => `<li>${lic(LAYOUTS[k][1])}<b>${L[k]}</b><span>${LAYOUTS[k][0]}</span></li>`).join("")}${x.area ? `<li>${lic("M4 4h16v16H4zM4 9h5V4M15 20v-5h5")}<b>${x.area}</b><span>m²</span></li>` : ""}</ul>`;
  }
  function vcard(x) {
    const p = photosFor(x)[0];
    const off = x.old ? Math.round((1 - x.price / x.old) * 100) : 0;
    return `
    <article class="vcard">
      <div class="v-photo-wrap">
        <button class="v-photo" type="button" data-open="${esc(x.id)}" aria-label="${esc(x.name)}: batafsil">${art(x.art, x.hue, "v" + x.id)}${imgTag(p, 800)}<span class="kind">${esc(x.kind || "Zal")}</span>${off ? `<span class="badge">−${off}%</span>` : ""}</button>
        <button class="fav" type="button" data-fav="${esc(x.id)}" aria-pressed="${favs.has(x.id)}" aria-label="${favs.has(x.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}">${heart}</button>
      </div>
      <div class="v-body">
        <div class="item-top">
          <div><p class="v-city">${esc(x.city)} · ${esc(x.district || "")}</p><h3><button type="button" data-open="${esc(x.id)}">${esc(x.name)}</button></h3></div>
          <div class="rating"><b>${Number(x.rating).toFixed(1)}</b><small>${x.reviews} sharh</small></div>
        </div>
        ${layoutList(x, "v-lay")}
        <div class="amen">${(x.amenities || []).slice(0, 4).map((k) => AMEN[k] ? `<span>${icon(k)}${AMEN[k][0]}</span>` : "").join("")}</div>
        <div class="v-foot">
          <p class="price">${x.old ? `<s>${som(x.old)}</s>` : ""}<b>${som(x.price)}</b><small>1 kun</small></p>
          <div class="v-acts"><button class="btn btn-line" type="button" data-open="${esc(x.id)}">Batafsil</button><button class="btn btn-gold" type="button" data-book="${esc(x.id)}">Bron qilish</button></div>
        </div>
      </div>
    </article>`;
  }
  function renderVenues() {
    const all = LISTINGS.filter((x) => x.type === "venue");
    $("#vFormats").innerHTML = Object.keys(FORMATS).filter((k) => !k || all.some((x) => x.format === k)).map((k) => `<button type="button" class="chip" data-vf="${k}" aria-pressed="${state.vFormat === k}">${FORMATS[k]}</button>`).join("");
    const list = all.filter((x) => !state.vFormat || x.format === state.vFormat).sort((a, b) => b.rating * Math.log(b.reviews + 2) - a.rating * Math.log(a.reviews + 2));
    $("#vMore").hidden = list.length <= state.vLimit;
    $("#vMore").textContent = `Barcha zallarni ko'rsatish (${list.length})`;
    $("#vgrid").innerHTML = list.slice(0, state.vLimit).map(vcard).join("") || `<p class="mine-empty">Bu formatda zal hozircha yo'q.</p>`;
  }

  // ---------- tour packages ----------
  const durOf = (x) => x.days > 1 ? `${x.days} kun · ${x.nights ?? x.days - 1} kecha` : (x.district || "1 kun").replace(/^1 kun · /, "");
  const routeHtml = (x) => (x.route || []).map((c) => `<span>${esc(c)}</span>`).join(`<i aria-hidden="true"></i>`);
  function pcard(x) {
    const p = photosFor(x)[0];
    const off = x.old ? Math.round((1 - x.price / x.old) * 100) : 0;
    return `
    <article class="pcard">
      <div class="v-photo-wrap">
        <button class="p-photo" type="button" data-open="${esc(x.id)}" aria-label="${esc(x.name)}: dastur">${art(x.art, x.hue, "p" + x.id)}${imgTag(p, 700)}<span class="dur">${esc(durOf(x))}</span>${off ? `<span class="badge">−${off}%</span>` : ""}</button>
        <button class="fav" type="button" data-fav="${esc(x.id)}" aria-pressed="${favs.has(x.id)}" aria-label="${favs.has(x.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}">${heart}</button>
      </div>
      <div class="p-body">
        <p class="p-route">${routeHtml(x)}</p>
        <h3><button type="button" data-open="${esc(x.id)}">${esc(x.name)}</button></h3>
        <p class="meta"><span class="p-rate">★ ${Number(x.rating).toFixed(1)}</span> · ${x.reviews} sharh · guruh ${x.capacity} kishigacha</p>
        <div class="p-inc">${(x.amenities || []).map((k) => AMEN[k] ? `<span title="${AMEN[k][0]}">${icon(k)}${AMEN[k][0]}</span>` : "").join("")}</div>
        <div class="v-foot">
          <p class="price">${x.old ? `<s>${som(x.old)}</s>` : ""}<b>${som(x.price)}</b><small>1 kishi uchun</small></p>
          <div class="v-acts"><button class="btn btn-line" type="button" data-open="${esc(x.id)}">Dastur</button><button class="btn btn-gold" type="button" data-book="${esc(x.id)}">Bron qilish</button></div>
        </div>
      </div>
    </article>`;
  }
  function renderPackages() {
    const multi = (x) => (x.days || 1) > 1;
    const list = LISTINGS.filter((x) => x.type === "tour" && (state.pk === "multi" ? multi(x) : !multi(x))).sort((a, b) => b.rating - a.rating);
    $$("#pKinds .seg-b").forEach((b) => { const on = b.dataset.pk === state.pk; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
    $("#pgrid").innerHTML = list.map(pcard).join("") || `<p class="mine-empty">Hozircha dastur yo'q.</p>`;
  }
  function renderCats() {
    const n = (t) => LISTINGS.filter((x) => x.type === t).length;
    $("#catHotel").textContent = `${n("hotel")} mehmonxona, ${n("hostel")} hostel`;
    $("#catVenue").textContent = `${n("venue")} ta zal`;
    $("#catTour").textContent = `${n("tour")} ta dastur`;
  }

  function renderCities() {
    const cur = $("#fCity").value;
    $("#fCity").innerHTML = `<option value="">Barcha shaharlar</option>` + CITIES.map((c) => `<option${c.name === cur ? " selected" : ""}>${esc(c.name)}</option>`).join("");
    $("#cities").innerHTML = CITIES.map((c) => {
      const n = LISTINGS.filter((x) => x.city === c.name).length;
      return `<button class="city${state.city === c.name ? " is-on" : ""}" type="button" data-city="${esc(c.name)}" aria-pressed="${state.city === c.name}"><span class="arch">${art(c.art, c.hue, "city" + c.name)}${imgTag((PHOTOS[c.name] || [])[0], 640)}<span class="c-txt"><span class="c-count">${n} ta joy</span><b>${esc(c.name)}</b><small>${esc(c.note)}</small></span></span></button>`;
    }).join("");
  }

  function renderDeals() {
    const list = LISTINGS.filter((x) => x.old).sort((a, b) => (b.old - b.price) / b.old - (a.old - a.price) / a.old).slice(0, 6);
    $("#takliflar").hidden = !list.length;
    $("#deals").innerHTML = list.map((x) => {
      const off = Math.round((1 - x.price / x.old) * 100);
      return `<button class="deal" type="button" data-open="${esc(x.id)}"><div class="d-thumb">${art(x.art, x.hue, x.id)}${imgTag(photosFor(x)[0], 320)}</div><div><span class="badge">−${off}%</span><b>${esc(x.name)}</b><span class="muted small">${esc(x.city)} · ${TYPES[x.type].kind}</span><span class="price"><s>${som(x.old)}</s><b>${som(x.price)}</b></span></div></button>`;
    }).join("");
  }

  // ---------- recently viewed ----------
  const RECENT_KEY = "bronuz.recent";
  let recent = store(RECENT_KEY, []);
  function rememberViewed(id) {
    recent = [id, ...recent.filter((x) => x !== id)].slice(0, 8);
    keep(RECENT_KEY, recent);
    renderRecent();
  }
  function renderRecent() {
    const list = recent.map((id) => LISTINGS.find((x) => x.id === id)).filter(Boolean);
    $("#yaqinda").hidden = !list.length;
    $("#recent").innerHTML = list.map((x) => `<button class="deal" type="button" data-open="${esc(x.id)}"><div class="d-thumb">${art(x.art, x.hue, "r" + x.id)}${imgTag(photosFor(x)[0], 320)}</div><div><b>${esc(x.name)}</b><span class="muted small">${esc(x.city)} · ${TYPES[x.type].kind}</span><span class="price"><b>${som(x.price)}</b></span></div></button>`).join("");
  }

  // ---------- shareable links: #joy=<id> opens a listing, Back closes it ----------
  function setHash(h) {
    if (location.hash === "#" + h) return;
    try { history.pushState({ bron: h }, "", "#" + h); } catch (e) { /* sandboxed preview */ }
  }
  function clearHash() {
    if (!/^#joy=/.test(location.hash)) return;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
  }
  function openFromHash() {
    const m = /^#joy=([\w-]{1,40})$/.exec(location.hash);
    const d = $("#detailDlg");
    if (m && LISTINGS.some((x) => x.id === m[1])) { if (!(d.open && state.current && state.current.id === m[1])) openDetail(m[1]); }
    else if (d.open) closeDlg(d);
  }

  // ---------- favourites ----------
  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    keep(FAV_KEY, [...favs]);
    $("#favCount").textContent = favs.size;
    $$(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => { b.setAttribute("aria-pressed", String(favs.has(id))); b.setAttribute("aria-label", favs.has(id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"); });
    if (state.favOnly) render();
  }

  // ---------- dialogs ----------
  const openDlg = (d) => {
    if (!d.open) d._back = document.activeElement;
    if (typeof d.showModal === "function") { if (!d.open) d.showModal(); } else d.setAttribute("open", "");
  };
  const closeDlg = (d) => { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); };

  function openDetail(id) {
    const x = LISTINGS.find((y) => y.id === id);
    if (!x) return;
    state.current = x;
    state.room = "standart";
    const t = TYPES[x.type];
    const ps = photosFor(x);
    $("#dArt").className = "gallery";
    $("#dArt").innerHTML = art(x.art, x.hue, x.id + "big") + (ps.length ? `<div class="g-track" id="gTrack">${ps.map((p) => `<div class="g-slide"><img data-ph class="ph" alt="${esc(p.title)}" src="${esc(srcOf(p, 1200))}"><span class="g-cap">${esc(p.title)}${p.file ? `<a href="${filePage(p.file)}" target="_blank" rel="noopener">© Wikimedia Commons</a>` : ""}</span></div>`).join("")}</div>${ps.length > 1 ? `<button class="g-nav g-prev" type="button" data-g="-1" aria-label="Oldingi surat">‹</button><button class="g-nav g-next" type="button" data-g="1" aria-label="Keyingi surat">›</button><span class="g-count" id="gCount" aria-live="polite">1 / ${ps.length}</span>` : ""}` : "");
    const track = $("#gTrack");
    if (track && ps.length > 1) track.addEventListener("scroll", () => { const c = $("#gCount"); if (c) c.textContent = `${Math.round(track.scrollLeft / Math.max(1, track.clientWidth)) + 1} / ${ps.length}`; }, { passive: true });
    rememberViewed(x.id);
    setHash("joy=" + x.id);
    $("#dKind").textContent = `${x.kind || (x.type === "tour" && x.days > 1 ? "Tur paketi" : t.kind)} · ${x.city}`;
    $("#dTitle").textContent = x.name;
    $("#dMeta").textContent = `${x.stars ? starStr(x.stars) + " · " : ""}${x.type === "tour" ? durOf(x) : x.district || x.city} · ${Number(x.rating).toFixed(1)} ${ratingWord(x.rating)} (${x.reviews} sharh)`;
    $("#dDesc").textContent = x.desc || "";
    $("#dAmen").innerHTML = (x.amenities || []).map((k) => AMEN[k] ? `<span>${icon(k)}${AMEN[k][0]}</span>` : "").join("") + (x.free ? `<span>${icon("tickets")}Bepul bekor qilish</span>` : "");
    $("#dExtra").innerHTML = x.type === "venue"
      ? `<h4 class="d-sub">Joylashtirish usullari</h4>${layoutList(x, "d-lay")}`
      : x.type === "tour" && (x.itinerary || []).length
        ? `${x.route ? `<p class="p-route big">${routeHtml(x)}</p>` : ""}<h4 class="d-sub">${x.days > 1 ? `Dastur: ${esc(durOf(x))}` : "Ekskursiya dasturi"}</h4><ol class="timeline">${x.itinerary.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol>`
        : "";
    $("#dRooms").innerHTML = x.type === "hotel" ? `<div class="rooms" role="radiogroup" aria-label="Xona turi">${ROOMS.map((r, i) => `<label class="room"><input type="radio" name="room" value="${r.id}"${i === 0 ? " checked" : ""}><span><b>${r.name}</b> · ${x.capacity + r.extra} kishigacha</span><b>${som(unitPrice(x, r.id))}</b><small>${r.note}</small></label>`).join("")}</div>` : "";
    updateDetailPrice();
    openDlg($("#detailDlg"));
    $("#detailDlg").scrollTop = 0;
    setTimeout(() => { const c = $("#detailDlg .x-float"); if (c) c.focus({ preventScroll: true }); }, 30);
  }
  function updateDetailPrice() {
    const x = state.current;
    $("#dPrice").innerHTML = `${x.old && state.room === "standart" ? `<s>${som(x.old)}</s>` : ""}<b>${som(unitPrice(x, state.room))}</b><small>${TYPES[x.type].unit}</small>`;
  }

  function openBooking(id, roomId) {
    const item = LISTINGS.find((x) => x.id === id) || tripItem(TRIPS.get(id));
    if (!item) return;
    state.current = item;
    state.room = item.type === "transport" ? roomId || "" : roomId || (item.type === "hotel" ? (ROOMS.find((r) => item.capacity + r.extra >= state.guests) || ROOMS[ROOMS.length - 1]).id : "standart");
    const t = TYPES[item.type];
    $("#dlgTitle").textContent = item.name;
    $("#dlgCity").textContent = item.type === "transport" ? `${{ avia: "Aviareys", poyezd: "Poyezd", avto: "Haydovchili avtomobil" }[item.trip.mode]}${item.trip.dep ? " · jo'nash " + item.trip.dep : ""}` : `${t.kind} · ${item.city}`;
    $("#bFromLabel").textContent = t.from;
    $("#bToLabel").textContent = t.to;
    $("#bGuestsLabel").textContent = t.guests;
    $("#bToWrap").hidden = item.type === "tour" || item.type === "transport";
    const trainClasses = item.type === "transport" && item.trip.mode === "poyezd";
    $("#bRoomWrap").hidden = item.type !== "hotel" && !trainClasses;
    $("#bRoomLabel").textContent = trainClasses ? "Vagon klassi" : "Xona turi";
    $("#bRoom").innerHTML = item.type !== "hotel" && !trainClasses ? "" : trainClasses
      ? Object.entries(item.trip.classes).map(([c, pr]) => `<option value="${c}"${c === state.room ? " selected" : ""}>${c[0].toUpperCase() + c.slice(1)} · ${som(pr)}</option>`).join("")
      : ROOMS.map((r) => `<option value="${r.id}"${r.id === state.room ? " selected" : ""}>${r.name} · ${som(unitPrice(item, r.id))}</option>`).join("");
    const from0 = item.type === "transport" ? $("#trDate").value || state.from : state.from;
    const sameType = state.type === item.type;
    $("#bFrom").value = from0;
    $("#bTo").value = nightly(item) ? (state.to > from0 && (sameType || nightly({ type: state.type })) ? state.to : iso(addDays(day(from0), 1)))
      : item.type === "venue" ? (sameType && state.to >= from0 ? state.to : from0) : from0;
    syncBookDates();
    const guests0 = sameType ? state.guests : item.type === "venue" ? Math.min(50, capOf(item)) : item.type === "tour" ? 2 : Math.min(state.guests, 40);
    $("#bGuests").value = Math.min(guests0, capOf(item));
    $("#bGuests").max = capOf(item);
    $("#bookMsg").textContent = ""; $("#bookMsg").className = "form-msg";
    if (item.type === "transport") $("#bGuests").value = Math.min(Math.max(1, +$("#trPax").value || 1), capOf(item));
    else if (sameType && state.guests > capOf(item)) $("#bookMsg").textContent = `Bu tanlov ${capOf(item)} kishigacha. ${state.guests} kishilik guruh uchun bir nechta xona bron qiling yoki pastdagi guruh so'rovini yuboring.`;
    updateTotal();
    openDlg($("#bookDlg"));
    if (user) { if (!$("#bName").value) $("#bName").value = user.name; if (!$("#bPhone").value) $("#bPhone").value = user.phone; }
    setTimeout(() => (user ? $("#bFrom") : $("#bName")).focus(), 30);
  }
  function syncBookDates() {
    const item = state.current, f = $("#bFrom").value;
    const max = iso(addDays(new Date(), 365));
    $("#bFrom").max = max; $("#bTo").max = iso(addDays(new Date(), 425));
    $("#bTo").min = f ? (item && nightly(item) ? iso(addDays(day(f), 1)) : f) : todayIso();
  }
  const capOf = (item) => item.capacity + (item.type === "hotel" ? roomOf(item, state.room).extra : 0);

  function updateTotal() {
    const item = state.current;
    if (!item) return;
    state.room = $("#bRoom").value || (item.type === "transport" ? "" : "standart");
    $("#bGuests").max = capOf(item);
    const from = $("#bFrom").value, to = $("#bTo").value;
    const guests = Math.max(1, parseInt($("#bGuests").value, 10) || 1);
    const span = to ? daysBetween(from, to) : 0;
    const badDates = !from || from < todayIso() || span > 60 || (nightly(item) && !(to > from)) || (item.type === "venue" && to && to < from);
    if (badDates) { $("#totalCalc").textContent = "Sanalarni tekshiring"; $("#totalSum").textContent = "—"; $("#bAvail").textContent = ""; return; }
    $("#bPolicy").textContent = item.type === "transport" ? "Chipta narxi namuna jadval asosida. Aniq narxni menejer tasdiqlaydi."
      : item.free ? "✓ Bepul bekor qilish mumkin. To'lov joyida yoki oldindan." : "Bekor qilish shartlarini menejer bron tasdiqlanganda aytadi.";
    const q = quote(item, from, to || from, guests, state.room);
    $("#totalCalc").textContent = q.label;
    $("#totalSum").textContent = som(q.sum);
    checkAvailability(item, from, to || from, guests);
  }

  // Live free-place check against the partner's calendar (server mode only).
  let availTimer = 0;
  function checkAvailability(item, from, to, guests) {
    const el = $("#bAvail");
    clearTimeout(availTimer);
    el.textContent = ""; el.className = "avail";
    if (!API || item.type === "transport") return;
    availTimer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/availability?id=${encodeURIComponent(item.id)}&from=${from}&to=${to}&guests=${guests}`);
        const a = await r.json();
        if (state.current !== item) return;
        el.textContent = a.ok ? `✓ Bo'sh: ${item.type === "venue" ? "sana ochiq" : a.free + " ta joy"}` : a.reason || a.error || "";
        el.className = "avail " + (a.ok ? "ok" : "no");
      } catch (e) { /* offline */ }
    }, 250);
  }

  async function submitBooking(e) {
    e.preventDefault();
    const item = state.current;
    const msg = $("#bookMsg");
    msg.className = "form-msg err";
    const name = $("#bName").value.trim();
    const phone = $("#bPhone").value.trim();
    const from = $("#bFrom").value;
    const to = item.type === "transport" ? from : item.type === "tour" ? iso(addDays(day(from || todayIso()), (item.days || 1) - 1)) : $("#bTo").value;
    const guests = parseInt($("#bGuests").value, 10) || 0;
    const room = item.type === "hotel" ? state.room : undefined;
    ["#bName", "#bPhone", "#bGuests"].forEach((s) => $(s).removeAttribute("aria-invalid"));

    if (name.length < 3) { $("#bName").setAttribute("aria-invalid", "true"); $("#bName").focus(); msg.textContent = "Ism familiyangizni kiriting."; return; }
    if (!validPhone(phone)) { $("#bPhone").setAttribute("aria-invalid", "true"); $("#bPhone").focus(); msg.textContent = "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing."; return; }
    if (!from || from < todayIso()) { msg.textContent = "Bugungi yoki keyingi sanani tanlang."; return; }
    if (nightly(item) && !(to > from)) { msg.textContent = "Ketish sanasi kelish sanasidan keyin bo'lishi kerak."; return; }
    if (item.type === "venue" && to < from) { msg.textContent = "Tugash sanasi boshlanish sanasidan oldin bo'lmasin."; return; }
    if (daysBetween(from, to) > 60) { msg.textContent = "Bir bron 60 kundan oshmasin."; return; }
    if (guests < 1) { $("#bGuests").setAttribute("aria-invalid", "true"); msg.textContent = "Kamida 1 kishi bo'lishi kerak."; return; }
    if (guests > capOf(item)) { msg.textContent = `Bu tanlov ${capOf(item)} kishigacha qabul qiladi.`; return; }

    const pay = $("#bPay").value, note = $("#bNote").value.trim();
    let booking;
    if (API) {
      const btn = $("#bookForm button[type=submit]");
      btn.disabled = true;
      try {
        const r = item.type === "transport"
          ? await api("/api/transport-bookings", { tripId: item.id, cls: state.room, date: from, guests, client: name, phone, pay, note })
          : await api("/api/bookings", { listingId: item.id, from, to, guests, client: name, phone, pay, note, room });
        booking = { code: r.code, id: item.id, name: r.name, city: r.city, type: r.type, from: r.from, to: r.to, guests: r.guests, sum: r.sum, status: r.status, phone: normPhone(phone) };
      } catch (err) { msg.textContent = err.message; return; }
      finally { btn.disabled = false; }
    } else {
      const code = "BRN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      booking = { code, id: item.id, name: item.name, city: item.city, type: item.type, from, to, guests, sum: quote(item, from, to, guests, item.type === "transport" ? state.room : room).sum, phone: normPhone(phone) };
    }
    if (user) booking.owner = user.phone;
    booking.pay = pay;
    booking.created = new Date().toISOString();
    if (item.type === "hotel") booking.room = roomOf(item, state.room).name;
    else if (item.type === "transport" && state.room) booking.room = state.room;
    saveBookings([booking, ...memoryBookings]);
    if (API && user) serverBookings = [booking, ...serverBookings];
    closeDlg($("#bookDlg"));
    $("#bookForm").reset();
    renderMine();
    showDone(booking, item);
  }

  // ---------- booking confirmation ----------
  let lastDone = null;
  function showDone(b, item) {
    lastDone = b;
    const dates = !b.to || b.from === b.to ? fmtDate(b.from) : `${fmtDate(b.from)} – ${fmtDate(b.to)}`;
    $("#doneTitle").textContent = b.name;
    $("#doneCode").textContent = b.code;
    const rows = [["Joy", `${TYPES[b.type] ? TYPES[b.type].kind : ""} · ${b.city}`], ["Sana", dates], [TYPES[b.type] ? TYPES[b.type].guests : "Kishilar", String(b.guests)]];
    if (b.room) rows.push([b.type === "transport" ? "Vagon klassi" : "Xona turi", b.room]);
    rows.push(["To'lov", PAY_LABEL[b.pay] || b.pay || ""], ["Jami", som(b.sum)]);
    $("#doneList").innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#doneNote").textContent = API
      ? (item && item.free ? "Menejer bronni tasdiqlab, siz bilan bog'lanadi. Bu joyda bronni bepul bekor qilish mumkin." : "Menejer bronni tasdiqlab, siz bilan bog'lanadi.")
      : "Sayt hozir namuna rejimida: bron faqat shu qurilmada saqlandi va joy egasiga yuborilmadi.";
    const text = `${T("Bron qabul qilindi")}: ${b.code} · ${b.name} · ${dates}`;
    $("#doneShare").href = `https://t.me/share/url?url=${encodeURIComponent(location.origin + location.pathname)}&text=${encodeURIComponent(text)}`;
    openDlg($("#doneDlg"));
    setTimeout(() => $("#doneCopy").focus(), 30);
  }
  function icsFor(b) {
    const d = (s) => s.replace(/-/g, "");
    const end = iso(addDays(day(b.to || b.from), 1));
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const clean = (s) => String(s).replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, " ");
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//bron.uz//UZ", "BEGIN:VEVENT", `UID:${b.code}@bron.uz`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d(b.from)}`, `DTEND;VALUE=DATE:${d(end)}`, `SUMMARY:${clean(b.name + " (" + b.code + ")")}`, `LOCATION:${clean(b.city)}`,
      `DESCRIPTION:${clean(T("Bron raqami") + ": " + b.code + ", " + som(b.sum))}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  }
  function downloadIcs(b) {
    const url = URL.createObjectURL(new Blob([icsFor(b)], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = `${b.code}.ics`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---------- my bookings ----------
  const STATUS_LABEL = { "yangi": "Kutilmoqda", "tasdiqlandi": "Tasdiqlandi", "bekor qilindi": "Bekor qilingan", "yakunlandi": "Yakunlangan" };
  const PAY_LABEL = { joyida: "Joyida to'lov", click: "Click", payme: "Payme", uzum: "Uzum Bank", naqd: "Naqd" };
  const STATUS_CLASS = { "yangi": "new", "tasdiqlandi": "ok", "bekor qilindi": "off", "yakunlandi": "done" };
  const isActive = (b) => !b.status || b.status === "yangi" || b.status === "tasdiqlandi";
  function myBookings() {
    const local = memoryBookings.filter((b) => user ? b.owner === user.phone : !b.owner);
    if (!(API && user)) return local;
    const codes = new Set(serverBookings.map((b) => b.code));
    return [...serverBookings, ...local.filter((b) => !codes.has(b.code))];
  }
  // Bookings made on this device before signing in move to the account that signs in.
  function claimGuestBookings(u) {
    if (!memoryBookings.some((b) => !b.owner)) return;
    saveBookings(memoryBookings.map((b) => b.owner ? b : { ...b, owner: u.phone }));
  }
  function renderMine() {
    const list = myBookings();
    $("#myCount").textContent = list.filter(isActive).length;
    if (!list.length) {
      $("#myList").innerHTML = `<p class="mine-empty">Hali bron yo'q. Yuqoridan joy tanlab "Bron qilish" tugmasini bosing, bron shu yerda paydo bo'ladi.</p>`;
      return;
    }
    $("#myList").innerHTML = list.map((b) => {
      const dates = !b.to || b.from === b.to ? fmtDate(b.from) : `${fmtDate(b.from)} – ${fmtDate(b.to)}`;
      return `
      <div class="booking">
        <span class="code">${esc(b.code)}</span>
        <div class="grow"><b>${esc(b.name)}</b><span class="muted">${esc(b.city)} · ${dates} · ${b.guests} kishi${b.room ? " · " + esc(b.room) : ""}${b.pay ? " · " + esc(PAY_LABEL[b.pay] || b.pay) : ""}</span></div>
        <span class="sum">${som(b.sum)}</span>
        <span class="st st-${STATUS_CLASS[b.status || "yangi"] || "new"}">${esc(STATUS_LABEL[b.status || "yangi"] || b.status)}</span>
        ${isActive(b) ? `<span class="b-acts"><button class="btn btn-line" type="button" data-ics="${esc(b.code)}" aria-label="Kalendarga qo'shish">📅</button><button class="btn btn-line" type="button" data-cancel="${esc(b.code)}">Bekor qilish</button></span>` : ""}
      </div>`;
    }).join("");
  }

  // ---------- MICE request ----------
  async function submitMice(e) {
    e.preventDefault();
    const msg = $("#miceMsg");
    msg.className = "form-msg err";
    if ($("#mCompany").value.trim().length < 2) { msg.textContent = "Kompaniya nomini kiriting."; return; }
    if ((parseInt($("#mPeople").value, 10) || 0) < 10) { msg.textContent = "Guruh so'rovi 10 kishidan boshlanadi."; return; }
    if ((parseInt($("#mPeople").value, 10) || 0) > 5000) { msg.textContent = "Guruh so'rovi 5000 kishigacha qabul qilinadi."; return; }
    if (!validPhone($("#mPhone").value)) { msg.textContent = "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing."; return; }
    if (!API) { msg.textContent = "Sayt hozir namuna rejimida ishlayapti, so'rov serverga yuborilmadi. Server ishga tushgach so'rovlar admin panelga keladi."; return; }
    {
      try { await api("/api/group-requests", { company: $("#mCompany").value, kind: $("#mKind").value, people: $("#mPeople").value, phone: $("#mPhone").value }); }
      catch (err) { msg.textContent = err.message; return; }
    }
    msg.className = "form-msg ok";
    msg.textContent = `Rahmat! ${$("#mKind").value} bo'yicha so'rovingiz qabul qilindi, menejer siz bilan bog'lanadi.`;
    $("#miceForm").reset();
  }

  function resetFilters() {
    state.stars.clear(); state.amen.clear(); state.maxPct = 100; state.free = state.deals = state.favOnly = false;
    $("#fFree").checked = $("#fDeals").checked = $("#fFav").checked = false;
    $("#fCity").value = ""; readSearch();
    buildFilters(); render();
  }

  // ---------- transport search ----------
  const MODE_LABEL = { avia: "Aviachipta", poyezd: "Poyezd", avto: "Avto" };
  const hm = (m) => `${Math.floor(m / 60)} s ${m % 60 ? (m % 60) + " daq" : ""}`.trim();
  function placesFor(mode) {
    const list = TRANSPORT[mode] || [];
    return [...new Set(list.flatMap((t) => [t.from, t.to]))].sort((a, b) => a.localeCompare(b, "uz"));
  }
  function fillTrPlaces(keep) {
    const pl = placesFor(state.trMode);
    const opts = (sel) => pl.map((c) => `<option${c === sel ? " selected" : ""}>${esc(c)}</option>`).join("");
    const from = keep && pl.includes($("#trFrom").value) ? $("#trFrom").value : pl.includes("Toshkent") ? "Toshkent" : pl[0];
    let to = keep && pl.includes($("#trTo").value) ? $("#trTo").value : "";
    if (!to || to === from) to = (TRANSPORT[state.trMode].find((t) => t.from === from && t.to !== from) || {}).to || pl[1];
    $("#trFrom").innerHTML = opts(from);
    $("#trTo").innerHTML = opts(to);
  }
  function tripRow(t) {
    const pax = Math.max(1, +$("#trPax").value || 1);
    const q = tripQuote(t, "", pax);
    const head = t.mode === "avia"
      ? `<span class="tr-badge">HY</span><div class="tr-who"><b>${esc(t.carrier)}</b><small>${esc(t.no)} · ${esc(t.bag)}</small></div>`
      : t.mode === "poyezd"
        ? `<span class="tr-badge train">${esc(t.name.slice(0, 3))}</span><div class="tr-who"><b>${esc(t.name)}</b><small>${esc(t.no)}${t.night ? " · tungi poyezd" : ""}</small></div>`
        : `<span class="tr-badge car">${esc(t.name.slice(0, 1))}</span><div class="tr-who"><b>${esc(t.name)}</b><small>${esc(t.model)}</small></div>`;
    const times = t.mode === "avto"
      ? `<div class="tr-time"><div><b>${esc(t.from)}</b><small>${t.transfer ? "shahar ichida" : t.km + " km"}</small></div><div class="tr-line"><span>${t.transfer ? "aeroport / vokzal" : "≈ " + hm(t.dur)}</span></div><div><b>${esc(t.transfer ? t.from : t.to)}</b><small>${t.seats} o'rin · ${t.bags} chamadon</small></div></div>`
      : `<div class="tr-time"><div><b>${t.dep}</b><small>${esc(t.fromCode || t.from)}</small></div><div class="tr-line"><span>${hm(t.dur)}</span></div><div><b>${t.arr}${t.arr < t.dep ? "<sup>+1</sup>" : ""}</b><small>${esc(t.toCode || t.to)}</small></div></div>`;
    const classes = t.mode === "poyezd" ? `<div class="tr-cls">${Object.entries(t.classes).map(([c, p]) => `<button type="button" class="chip" data-book="${esc(t.id)}" data-cls="${c}">${c[0].toUpperCase() + c.slice(1)} · ${short(p)}</button>`).join("")}</div>` : "";
    const price = t.mode === "avto" ? `<b>${som(q.sum)}</b><small>butun mashina</small>` : `<b>${som(q.unit)}</b><small>${t.mode === "poyezd" ? "dan, 1 yo'lovchi" : "1 yo'lovchi"}</small>`;
    return `<article class="tr-row tr-${t.mode}">
      <div class="tr-head">${head}</div>${times}${classes}
      <div class="tr-buy"><p class="price">${price}</p><button class="btn btn-gold" type="button" data-book="${esc(t.id)}">Tanlash</button></div>
    </article>`;
  }
  function renderTransport() {
    $$("#trModes .tr-mode").forEach((b) => { const on = b.dataset.mode === state.trMode; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
    const from = $("#trFrom").value, to = $("#trTo").value, pax = Math.max(1, +$("#trPax").value || 1);
    let list = (TRANSPORT[state.trMode] || []).filter((t) => t.from === from && t.to === to);
    if (state.trMode === "avto") list = list.filter((t) => t.seats >= pax);
    list.sort((a, b) => (a.dep || "").localeCompare(b.dep || "") || a.price - b.price);
    if (list.length) { $("#trList").innerHTML = list.map(tripRow).join(""); return; }
    const alt = [...new Set((TRANSPORT[state.trMode] || []).filter((t) => t.from === from && t.to !== from).map((t) => t.to))];
    $("#trList").innerHTML = `<div class="empty"><b>${esc(from)} → ${esc(to)}: ${MODE_LABEL[state.trMode].toLowerCase()} topilmadi</b><span>${alt.length ? `${esc(from)} dan bor yo'nalishlar:` : "Boshqa shaharni tanlang."}</span><div class="chips">${alt.map((c) => `<button type="button" class="chip" data-trto="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`;
  }

  // ---------- map (Leaflet + OpenStreetMap, loaded when the section comes into view) ----------
  const GEO = window.BRON_GEO || {};
  const MAP_TYPES = { "": "Hammasi", hotel: "Mehmonxona", hostel: "Hostel", venue: "Zal", tour: "Tur" };
  let map = null, markers = new Map(), routeLine = null;
  function geoOf(x) {
    if (Number.isFinite(x.lat) && Number.isFinite(x.lng)) return [x.lat, x.lng];
    const c = GEO[x.city]; if (!c) return null;
    const h = hashOf(x.id), a = (h % 360) * Math.PI / 180, r = c[2] * (0.25 + ((h >> 9) % 100) / 130);
    return [c[0] + Math.sin(a) * r, c[1] + Math.cos(a) * r * 1.25];
  }
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    return new Promise((ok, bad) => {
      const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "vendor/leaflet/leaflet.css"; document.head.appendChild(css);
      const s = document.createElement("script"); s.src = "vendor/leaflet/leaflet.js"; s.onload = ok; s.onerror = bad; document.head.appendChild(s);
    });
  }
  function popupHtml(x) {
    const t = TYPES[x.type], p = photosFor(x)[0];
    return `<div class="mp">
      <button type="button" class="mp-ph" data-open="${esc(x.id)}">${art(x.art, x.hue, "m" + x.id)}${imgTag(p, 400)}</button>
      <div class="mp-b"><small>${esc(x.kind || t.kind)} · ${esc(x.city)}</small><b>${esc(x.name)}</b>
      <span class="mp-r">★ ${Number(x.rating).toFixed(1)} · ${x.reviews} sharh</span>
      <span class="mp-p">${som(x.price)} <small>${t.unit}</small></span>
      <div class="mp-a"><button type="button" class="btn btn-line" data-open="${esc(x.id)}">Batafsil</button><button type="button" class="btn btn-gold" data-book="${esc(x.id)}">Bron</button></div></div></div>`;
  }
  const mapList = () => LISTINGS.filter((x) => (!state.mapType || x.type === state.mapType) && geoOf(x));
  function renderMapSide() {
    if (!map) return;
    const b = map.getBounds();
    const all = mapList().filter((x) => b.contains(geoOf(x))).sort((a, c) => c.rating - a.rating);
    const list = all.slice(0, 40);
    $("#mapSide").innerHTML = `<p class="ms-count">${all.length ? `Xaritada ${all.length} ta joy${all.length > list.length ? `, eng yaxshi ${list.length} tasi` : ""}` : "Bu hududda joy yo'q. Xaritani suring yoki kichraytiring."}</p>` +
      list.map((x) => `<button type="button" class="ms-item" data-mapgo="${esc(x.id)}"><span class="ms-dot t-${x.type}"></span><span><b>${esc(x.name)}</b><small>${esc(TYPES[x.type].kind)} · ${esc(x.city)} · ★ ${Number(x.rating).toFixed(1)}</small></span><span class="ms-p">${short(x.price)}</span></button>`).join("");
  }
  // Zoomed out, places are grouped per city; zoomed in, each place has its own price pin.
  let cityPins = [];
  function renderMapMarkers() {
    if (!map) return;
    markers.forEach((m) => m.remove()); markers.clear();
    cityPins.forEach((m) => m.remove()); cityPins = [];
    $("#mapTypes").innerHTML = Object.keys(MAP_TYPES).map((k) => `<button type="button" class="chip" data-mt="${k}" aria-pressed="${state.mapType === k}">${MAP_TYPES[k]}</button>`).join("");
    if (map.getZoom() < 9) {
      const by = {};
      mapList().forEach((x) => { (by[x.city] = by[x.city] || []).push(x); });
      // Cities close together (Toshkent and Chimyon) would cover each other: lift the later one.
      const placed = [];
      Object.entries(by).sort((a, b) => b[1].length - a[1].length).forEach(([city, xs]) => {
        const c = GEO[city]; if (!c) return;
        const pt = map.latLngToContainerPoint([c[0], c[1]]);
        let dy = 0;
        while (placed.some((q) => Math.abs(q.x - pt.x) < 130 && Math.abs(q.y - (pt.y + dy)) < 34)) dy -= 36;
        placed.push({ x: pt.x, y: pt.y + dy });
        const icon = L.divIcon({ className: "pin-wrap", html: `<span class="cpin"${dy ? ` style="transform:translateY(${dy}px)"` : ""}><b>${xs.length}</b>${esc(city)}</span>`, iconSize: null });
        cityPins.push(L.marker([c[0], c[1]], { icon, title: city }).addTo(map).on("click", () => map.setView([c[0], c[1]], 12)));
      });
      renderMapSide();
      return;
    }
    mapList().forEach((x) => {
      const g = geoOf(x);
      const icon = L.divIcon({ className: "pin-wrap", html: `<span class="pin t-${x.type}">${short(x.price)}</span>`, iconSize: null });
      const m = L.marker(g, { icon, title: x.name, riseOnHover: true }).addTo(map).bindPopup(() => popupHtml(x), { maxWidth: 280, minWidth: 240, className: "mp-pop" });
      m.on("popupopen", () => showRoute(x)); m.on("popupclose", () => showRoute(null));
      markers.set(x.id, m);
    });
    renderMapSide();
  }
  function showRoute(x) {
    if (routeLine) { routeLine.remove(); routeLine = null; }
    const pts = x && x.days > 1 ? (x.route || []).map((c) => GEO[c]).filter(Boolean).map((c) => [c[0], c[1]]) : [];
    if (pts.length > 1) routeLine = L.polyline(pts, { color: "#e0a21c", weight: 4, dashArray: "8 8" }).addTo(map);
  }
  async function initMap() {
    if (map) return;
    try { await loadLeaflet(); } catch (e) { $("#map").innerHTML = `<p class="map-load">Xaritani yuklab bo'lmadi. Internetni tekshiring.</p>`; return; }
    $("#map").innerHTML = "";
    map = L.map("map", { scrollWheelZoom: false, zoomControl: true });
    const pts = Object.values(GEO).map((g) => [g[0], g[1]]);
    if (pts.length) map.fitBounds(pts, { padding: [24, 24] }); else map.setView([40.6, 66.2], 6);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    map.on("moveend", renderMapSide);
    let wasNear = false;
    map.on("zoomend", () => { const near = map.getZoom() >= 9; if (near !== wasNear || !near) { wasNear = near; renderMapMarkers(); } });
    renderMapMarkers();
  }
  function showOnMap(id, stay) {
    if (!stay) $("#xarita").scrollIntoView({ block: "start" });
    initMap().then(() => {
      let m = markers.get(id);
      const x = LISTINGS.find((y) => y.id === id), g = x && geoOf(x);
      if (!g) return;
      if (state.mapType && x.type !== state.mapType) state.mapType = "";
      map.setView(g, 14, { animate: false });
      renderMapMarkers();
      m = markers.get(id);
      if (m) m.openPopup();
    });
  }

  // ---------- partner application ----------
  async function submitPartner(e) {
    e.preventDefault();
    const msg = $("#pfMsg");
    msg.className = "form-msg err";
    const body = { property: $("#pfName").value.trim(), type: $("#pfType").value, city: $("#pfCity").value, units: $("#pfUnits").value, contact: $("#pfContact").value.trim(), phone: $("#pfPhone").value };
    if (body.property.length < 2) { msg.textContent = "Joy nomini kiriting."; return; }
    const units = parseInt(body.units, 10);
    if (body.units && !(units >= 1 && units <= 2000)) { msg.textContent = "Xona yoki o'rinlar soni 1 dan 2000 gacha bo'lsin."; return; }
    if (body.contact.length < 2) { msg.textContent = "Mas'ul shaxs ismini kiriting."; return; }
    if (!validPhone(body.phone)) { msg.textContent = "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing."; return; }
    if (!API) { msg.textContent = "Sayt hozir namuna rejimida ishlayapti, ariza serverga yuborilmadi. Server ishga tushgach arizalar admin panelga keladi."; return; }
    try { await api("/api/partner-requests", body); }
    catch (err) { msg.textContent = err.message; return; }
    msg.className = "form-msg ok";
    msg.textContent = "Rahmat! Arizangiz qabul qilindi. Menejer siz bilan bog'lanib, joyingizni kabinetingizga biriktiradi.";
    $("#partnerForm").reset();
  }

  // ---------- wiring ----------
  function heroCount() {
    const cities = new Set(LISTINGS.map((x) => x.city)).size;
    $(".hero .eyebrow").textContent = `${cities} shahar · ${LISTINGS.length} joy · narxlar so'mda`;
  }

  function init() {
    const start = addDays(new Date(), 7);
    $("#fFrom").value = iso(start);
    $("#fTo").value = iso(addDays(start, 2));
    $("#fFrom").min = $("#fTo").min = $("#bFrom").min = $("#bTo").min = todayIso();

    heroArt();
    heroPhoto();
    initAuth();
    initApp();
    renderCities();
    renderDeals();
    renderVenues();
    renderPackages();
    renderCats();
    heroCount();
    $("#favCount").textContent = favs.size;

    $$(".tab").forEach((b) => b.addEventListener("click", () => setType(b.dataset.type)));
    $$("[data-nav]").forEach((a) => a.addEventListener("click", () => setType(a.dataset.nav)));
    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault(); readSearch();
      if (!validateSearch()) return;
      render(); $("#natijalar").scrollIntoView({ block: "start" });
    });
    $("#fSort").addEventListener("change", () => { readSearch(); render(); });
    $("#fCity").addEventListener("change", () => { readSearch(); render(); });
    $("#fFrom").addEventListener("change", () => { if ($("#fTo").value <= $("#fFrom").value) $("#fTo").value = iso(addDays(day($("#fFrom").value), 1)); readSearch(); });
    $("#fGuests").addEventListener("change", () => { readSearch(); render(); });

    $("#fPrice").addEventListener("input", (e) => { state.maxPct = +e.target.value; updatePriceOut(); render(); });
    $("#fStars").addEventListener("click", (e) => { const b = e.target.closest("[data-star]"); if (!b) return; const n = +b.dataset.star; state.stars.has(n) ? state.stars.delete(n) : state.stars.add(n); b.setAttribute("aria-pressed", String(state.stars.has(n))); render(); });
    $("#fAmen").addEventListener("change", (e) => { const k = e.target.dataset.amen; if (!k) return; e.target.checked ? state.amen.add(k) : state.amen.delete(k); render(); });
    $("#fFree").addEventListener("change", (e) => { state.free = e.target.checked; render(); });
    $("#fDeals").addEventListener("change", (e) => { state.deals = e.target.checked; render(); });
    $("#fFav").addEventListener("change", (e) => { state.favOnly = e.target.checked; render(); });
    $("#fReset").addEventListener("click", resetFilters);
    $("#moreBtn").addEventListener("click", () => { state.limit += 9; render(); });
    // transport
    $("#trDate").value = $("#fFrom").value; $("#trDate").min = todayIso();
    fillTrPlaces(false); renderTransport();
    $("#trModes").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (!b) return; state.trMode = b.dataset.mode; fillTrPlaces(true); renderTransport(); });
    $("#trForm").addEventListener("submit", (e) => { e.preventDefault(); renderTransport(); });
    ["#trFrom", "#trTo", "#trPax"].forEach((s) => $(s).addEventListener("change", renderTransport));
    $("#trSwap").addEventListener("click", () => { const a = $("#trFrom").value, b = $("#trTo").value; if ([...$("#trTo").options].some((o) => o.value === a)) { $("#trFrom").value = b; $("#trTo").value = a; } renderTransport(); });
    $("#trList").addEventListener("click", (e) => { const c = e.target.closest("[data-trto]"); if (c) { $("#trTo").value = c.dataset.trto; renderTransport(); } });
    // map: load Leaflet only when the section is close
    if ("IntersectionObserver" in window) new IntersectionObserver((en, o) => { if (en.some((x) => x.isIntersecting)) { o.disconnect(); initMap(); } }, { rootMargin: "300px" }).observe($("#xarita"));
    else initMap();
    $("#mapTypes").addEventListener("click", (e) => { const b = e.target.closest("[data-mt]"); if (!b) return; state.mapType = b.dataset.mt; renderMapMarkers(); });
    $("#mapSide").addEventListener("click", (e) => { const b = e.target.closest("[data-mapgo]"); if (b) showOnMap(b.dataset.mapgo, true); });
    $("#dMap").addEventListener("click", () => { const id = state.current.id; closeDlg($("#detailDlg")); showOnMap(id); });
    // partners
    $("#pfCity").innerHTML = CITIES.map((c) => `<option>${esc(c.name)}</option>`).join("");
    $("#partnerForm").addEventListener("submit", submitPartner);
    $("#vFormats").addEventListener("click", (e) => { const b = e.target.closest("[data-vf]"); if (!b) return; state.vFormat = b.dataset.vf; state.vLimit = 6; renderVenues(); });
    $("#vMore").addEventListener("click", () => { state.vLimit = 99; renderVenues(); });
    $("#pKinds").addEventListener("click", (e) => { const b = e.target.closest("[data-pk]"); if (!b) return; state.pk = b.dataset.pk; renderPackages(); });
    $("#filterToggle").addEventListener("click", (e) => { const f = $("#filters"); const open = !f.classList.contains("open"); f.classList.toggle("open", open); e.currentTarget.setAttribute("aria-expanded", String(open)); });
    $("#favBtn").addEventListener("click", () => {
      const types = LISTINGS.filter((x) => favs.has(x.id)).map((x) => x.type);
      if (!types.length) { toast("Sevimlilar hali yo'q. Kartochkadagi yurakchani bosing."); return; }
      if (!types.includes(state.type)) setType(types[0]);
      state.favOnly = true; $("#fFav").checked = true; render(); $("#natijalar").scrollIntoView({ block: "start" }); });

    document.addEventListener("click", (e) => {
      const t = e.target;
      const fav = t.closest("[data-fav]"); if (fav) { toggleFav(fav.dataset.fav); return; }
      const open = t.closest("[data-open]"); if (open) { openDetail(open.dataset.open); return; }
      const book = t.closest("[data-book]"); if (book) { openBooking(book.dataset.book, book.dataset.cls); return; }
      const city = t.closest("[data-city]");
      if (city) { const c = city.dataset.city === state.city ? "" : city.dataset.city; $("#fCity").value = c; readSearch(); render(); $("#natijalar").scrollIntoView({ block: "start" }); return; }
      if (t.closest("[data-reset]")) { resetFilters(); return; }
      const g = t.closest("[data-g]"); if (g) { const tr = $("#gTrack"); if (tr) tr.scrollBy({ left: tr.clientWidth * +g.dataset.g, behavior: "smooth" }); return; }
      const close = t.closest("[data-close]"); if (close) closeDlg(close.closest("dialog"));
    });
    $$("dialog").forEach((d) => {
      d.addEventListener("click", (e) => { if (e.target === d) closeDlg(d); });
      d.addEventListener("close", () => {
        if (d.id === "detailDlg") clearHash();
        const b = d._back; d._back = null;
        if (b && b.isConnected && !document.querySelector("dialog[open]")) b.focus({ preventScroll: true });
      });
    });
    window.addEventListener("popstate", openFromHash);
    $("#recentClear").addEventListener("click", () => { recent = []; keep(RECENT_KEY, recent); renderRecent(); });
    // Detail: start keyboard focus on the close button; arrows move the gallery.
    $("#detailDlg").addEventListener("keydown", (e) => {
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) {
        const tr = $("#gTrack"); if (tr) { e.preventDefault(); tr.scrollBy({ left: tr.clientWidth * (e.key === "ArrowRight" ? 1 : -1), behavior: "smooth" }); }
      }
    });

    $("#dRooms").addEventListener("change", (e) => { if (e.target.name === "room") { state.room = e.target.value; updateDetailPrice(); } });
    $("#dBook").addEventListener("click", () => { const id = state.current.id, room = state.room; closeDlg($("#detailDlg")); openBooking(id, room); });

    $("#myList").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-cancel]");
      if (!b) return;
      const code = b.dataset.cancel;
      const bk = myBookings().find((x) => x.code === code);
      if (!bk) return;
      if (!confirm(T("Bronni bekor qilasizmi? Bu amalni qaytarib bo'lmaydi."))) return;
      if (API) {
        b.disabled = true;
        try { await api(`/api/bookings/${encodeURIComponent(code)}/cancel`, { phone: bk.phone }); }
        catch (err) { b.disabled = false; toast(err.message); return; }
        serverBookings = serverBookings.map((x) => x.code === code ? { ...x, status: "bekor qilindi" } : x);
      }
      saveBookings(memoryBookings.map((x) => x.code === code ? { ...x, status: "bekor qilindi" } : x));
      renderMine();
      toast("Bron bekor qilindi.");
    });

    $("#bFrom").addEventListener("change", () => {
      const item = state.current, f = $("#bFrom").value, t = $("#bTo").value;
      if (item && f && nightly(item) && !(t > f)) $("#bTo").value = iso(addDays(day(f), Math.max(1, daysBetween(state.from || f, state.to || f) || 1)));
      if (item && f && item.type === "venue" && t < f) $("#bTo").value = f;
      syncBookDates(); updateTotal();
    });
    ["#bFrom", "#bTo", "#bGuests", "#bRoom"].forEach((s) => $(s).addEventListener("input", updateTotal));
    $("#bookForm").addEventListener("submit", submitBooking);
    $("#doneCopy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(lastDone.code); } catch (e) { /* no clipboard */ } toast(T("Bron raqami nusxalandi") + ": " + lastDone.code); });
    $("#doneIcs").addEventListener("click", () => lastDone && downloadIcs(lastDone));
    $("#donePrint").addEventListener("click", () => window.print());
    $("#myList").addEventListener("click", (e) => { const b = e.target.closest("[data-ics]"); if (!b) return; const bk = myBookings().find((x) => x.code === b.dataset.ics); if (bk) downloadIcs(bk); });
    $("#miceForm").addEventListener("submit", submitMice);

    buildFilters();
    readSearch();
    render();
    renderMine();
    renderRecent();
    openFromHash();
    loadListings();
  }

  // ---------- accounts ----------
  // With the server: real accounts (password hashed on the server, HttpOnly session cookie).
  // Static hosting has no server, so accounts are kept on this device only, password hashed with PBKDF2.
  const USERS_KEY = "bronuz.users", SESSION_KEY = "bronuz.session";
  let user = null, serverBookings = [], authMode = "login";
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

  async function localHash(pass, salt) {
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120000 }, key, 256);
      return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 0; for (const c of salt + pass) h = (h * 131 + c.charCodeAt(0)) >>> 0; return "w" + h.toString(16);
  }
  async function authRequest(path, body) {
    const r = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Server javob bermadi.");
    return data;
  }
  async function register(name, phone, pass) {
    if (API) return authRequest("/api/auth/register", { name, phone, password: pass });
    const users = store(USERS_KEY, {});
    if (users[phone]) throw new Error("Bu raqam bilan hisob bor. \"Kirish\" ni tanlang.");
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    users[phone] = { name, salt, hash: await localHash(pass, salt) };
    keep(USERS_KEY, users);
    keep(SESSION_KEY, phone);
    return { name, phone };
  }
  async function login(phone, pass) {
    if (API) return authRequest("/api/auth/login", { phone, password: pass });
    const u = store(USERS_KEY, {})[phone];
    if (!u || u.hash !== await localHash(pass, u.salt)) throw new Error("Telefon raqami yoki parol noto'g'ri.");
    keep(SESSION_KEY, phone);
    return { name: u.name, phone };
  }
  async function logout() {
    if (API) await authRequest("/api/auth/logout", {}).catch(() => {});
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    setUser(null);
    toast("Hisobdan chiqdingiz.");
  }
  async function setUser(u) {
    user = u;
    $("#authLabel").textContent = u ? u.name.split(" ")[0] : "Kirish";
    $("#authAvatar").hidden = !u;
    $("#authAvatar").textContent = u ? initials(u.name) : "";
    $("#tabProfileLbl").textContent = u ? "Profil" : "Kirish";
    serverBookings = [];
    if (u && API) {
      try { const r = await fetch("/api/my/bookings", { credentials: "same-origin" }); if (r.ok) serverBookings = await r.json(); } catch (e) { /* offline */ }
    }
    renderMine();
  }
  async function restoreUser() {
    if (API) {
      try { const r = await fetch("/api/auth/me", { credentials: "same-origin" }); if (r.ok) { const u = await r.json(); return setUser(u && u.id ? u : null); } } catch (e) { /* offline */ }
      return setUser(null);
    }
    const phone = store(SESSION_KEY, null);
    const u = phone && store(USERS_KEY, {})[phone];
    setUser(u ? { name: u.name, phone } : null);
  }

  function setAuthMode(mode) {
    authMode = mode;
    $$("#authDlg .seg-b").forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
    const reg = mode === "register";
    $("#aNameWrap").hidden = !reg;
    $("#aPass2Wrap").hidden = !reg;
    $("#authTitle").textContent = reg ? "Ro'yxatdan o'tish" : "Kirish";
    $("#authSubmit").textContent = reg ? "Hisob yaratish" : "Kirish";
    $("#aPass").autocomplete = reg ? "new-password" : "current-password";
    $("#authMsg").textContent = "";
  }
  function openAuth(mode) {
    if (user) return openProfile();
    setAuthMode(mode || "login");
    $("#authNote").textContent = API ? "Parolingiz shifrlangan holda saqlanadi." : "Hozircha hisob shu qurilmada saqlanadi. Server ulangach, hisoblar hamma qurilmada ishlaydi.";
    openDlg($("#authDlg"));
    setTimeout(() => (authMode === "register" ? $("#aName") : $("#aPhone")).focus(), 30);
  }
  function openProfile() {
    $("#pAvatar").textContent = initials(user.name);
    $("#pName").textContent = user.name;
    $("#pPhone").textContent = user.phone;
    $("#pBookings").textContent = myBookings().filter(isActive).length;
    $("#pFavs").textContent = favs.size;
    $("#profileNote").textContent = API ? "" : "Hisob shu qurilmada saqlangan.";
    openDlg($("#profileDlg"));
  }
  async function submitAuth(e) {
    e.preventDefault();
    const msg = $("#authMsg");
    msg.className = "form-msg err";
    const name = $("#aName").value.trim(), phone = normPhone($("#aPhone").value.trim()), pass = $("#aPass").value;
    if (authMode === "register" && name.length < 3) { msg.textContent = "Ism familiyangizni kiriting."; return; }
    if (!validPhone(phone)) { msg.textContent = "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing."; return; }
    if (pass.length < 8) { msg.textContent = "Parol kamida 8 belgidan iborat bo'lsin."; return; }
    if (authMode === "register" && pass !== $("#aPass2").value) { msg.textContent = "Parollar bir xil emas."; return; }
    const btn = $("#authSubmit"); btn.disabled = true;
    try {
      const u = authMode === "register" ? await register(name, phone, pass) : await login(phone, pass);
      claimGuestBookings(u);
      await setUser({ name: u.name, phone: u.phone });
      closeDlg($("#authDlg"));
      $("#authForm").reset();
      toast(authMode === "register" ? `Xush kelibsiz, ${u.name.split(" ")[0]}! Hisob yaratildi.` : `Xush kelibsiz, ${u.name.split(" ")[0]}!`);
    } catch (err) { msg.textContent = err.message; }
    finally { btn.disabled = false; }
  }
  function initAuth() {
    $("#authBtn").addEventListener("click", () => openAuth());
    $("#tabProfile").addEventListener("click", () => openAuth());
    $$("#authDlg .seg-b").forEach((b) => b.addEventListener("click", () => setAuthMode(b.dataset.mode)));
    $("#authForm").addEventListener("submit", submitAuth);
    $("#aEye").addEventListener("click", () => { const show = $("#aPass").type === "password"; $("#aPass").type = $("#aPass2").type = show ? "text" : "password"; $("#aEye").textContent = show ? "Yashirish" : "Ko'rsatish"; });
    $("#logoutBtn").addEventListener("click", () => { closeDlg($("#profileDlg")); logout(); });
    restoreUser();
  }

  // ---------- installable app (PWA) ----------
  let installEvt = null;
  function initApp() {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const hint = $("#installHint");
    if (standalone) { $("#installBtn").hidden = true; hint.textContent = "Ilova o'rnatilgan, rahmat!"; }
    else if (ios) hint.textContent = "iPhone'da: Ulashish → \"Bosh ekranga qo'shish\".";
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; $("#installTop").hidden = false; });
    window.addEventListener("appinstalled", () => { installEvt = null; $("#installTop").hidden = true; toast("Ilova o'rnatildi. Uni bosh ekrandan oching."); });
    const install = async () => {
      if (installEvt) { installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); if (r && r.outcome === "accepted") $("#installTop").hidden = true; installEvt = null; return; }
      hint.textContent = ios ? "iPhone'da: pastdagi Ulashish belgisi → \"Bosh ekranga qo'shish\"." : "Brauzer menyusi ⋮ → \"Ilovani o'rnatish\" yoki \"Bosh ekranga qo'shish\".";
      $("#ilova").scrollIntoView({ block: "center" });
    };
    $("#installBtn").addEventListener("click", install);
    $("#installTop").addEventListener("click", install);
    $("#tabFav").addEventListener("click", () => $("#favBtn").click());
  }

  async function loadListings() {
    if (location.protocol === "file:") return;
    try {
      const r = await fetch("/api/listings", { headers: { accept: "application/json" } });
      if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return;
      const rows = await r.json();
      if (!Array.isArray(rows) || !rows.length) return;
      LISTINGS = rows;
      API = true;
      restoreUser();
      $("#sampleNote").hidden = true;
      render(); renderDeals(); renderCities(); heroCount(); renderVenues(); renderPackages(); renderCats(); renderMapMarkers(); renderRecent();
    } catch (e) { /* static hosting: keep sample data */ }
  }

  init();
})();
