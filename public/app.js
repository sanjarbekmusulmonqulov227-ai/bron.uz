// bron.uz front-end: illustrated listings, search and filters, detail and booking dialogs, favourites.
// With server.js running, listings and bookings go through /api. Opened as a static site
// (GitHub Pages, a plain file or a preview) it uses the sample data in data.js and localStorage.
(function () {
  "use strict";

  // Without the server every place is the sample data from data.js.
  let LISTINGS = (window.BRON_LISTINGS || []).map((x) => ({ ...x, sample: true }));
  const CITIES = window.BRON_CITIES || [];
  const REGIONS = window.BRON_REGIONS || [];
  const REGION_OF = Object.fromEntries(CITIES.map((c) => [c.name, c.region]));
  // The city filter holds a city name, or "@" + a region name for every city in that region.
  const inPlace = (city, f) => !f || (f[0] === "@" ? REGION_OF[city] === f.slice(1) : city === f);
  // <option>s grouped by region (places outside the list go last).
  function placeOptions(names, sel) {
    const groups = REGIONS.map((r) => [r, names.filter((n) => REGION_OF[n] === r)]).filter(([, l]) => l.length);
    const rest = names.filter((n) => !REGIONS.includes(REGION_OF[n]));
    const opt = (n) => `<option value="${esc(n)}"${n === sel ? " selected" : ""}>${esc(n)}</option>`;
    return groups.map(([r, l]) => `<optgroup label="${esc(r)}">${l.map(opt).join("")}</optgroup>`).join("") + (rest.length ? `<optgroup label="Boshqa">${rest.map(opt).join("")}</optgroup>` : "");
  }

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
    accessible: ["Nogironlar uchun qulay", "M12 4a1.5 1.5 0 1 0 0-.01M10 7v6h5l3 5M10 10h5M8 10a6 6 0 1 0 7 8"],
    nosmoke: ["Chekilmaydigan xonalar", "M2 15h14v3H2zM18 15h4v3h-4M3 3l18 18"],
    pets: ["Uy hayvonlari mumkin", "M8 9a1.5 2 0 1 0 0-.01M16 9a1.5 2 0 1 0 0-.01M5 13a1.5 2 0 1 0 0-.01M19 13a1.5 2 0 1 0 0-.01M12 14c-3 0-5 3-5 5s2 2 5 2 5 0 5-2-2-5-5-5z"],
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
    hostel: ["wifi", "breakfast", "kitchen", "laundry", "ac", "transfer", "accessible", "nosmoke"],
    hotel: ["wifi", "breakfast", "pool", "spa", "parking", "transfer", "family", "accessible", "nosmoke", "pets"],
    venue: ["translation", "screen", "coffee", "parking", "wifi"],
    tour: ["hotel", "train", "guide", "transport", "meal", "tickets"]
  };

  const STORE_KEY = "bronuz.bookings";
  const FAV_KEY = "bronuz.favs";
  const T = (s) => (window.BRON_I18N ? window.BRON_I18N.t(s) : s);
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const state = { type: "hotel", city: "", from: "", to: "", guests: 2, sort: "rec", maxPct: 100, stars: new Set(), amen: new Set(), free: false, deals: false, favOnly: false, current: null, room: "standart", limit: 9, vFormat: "", vLimit: 6, pk: "multi", trMode: "avia", mapType: "", region: "", allCities: false, kids: 0, rooms: 1, bRooms: 1 };
  let API = false;
  let CFG = { sms: false, telegram: "", reviews: false };

  // ---------- helpers ----------
  const som = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  // Other currencies are shown next to so'm as an approximate guide (Central Bank rate); bookings stay in so'm.
  let CUR = store("bron.cur", "UZS"), RATES = null;
  const alt = (n) => {
    if (CUR === "UZS" || !RATES || !RATES[CUR] || !n) return "";
    try { return "≈ " + new Intl.NumberFormat("en-US", { style: "currency", currency: CUR, minimumFractionDigits: 0, maximumFractionDigits: n / RATES[CUR] < 10 ? 1 : 0 }).format(n / RATES[CUR]); } catch (e) { return ""; }
  };
  const altTag = (n) => { const a = alt(n); return a ? `<small class="alt-cur" translate="no">${a}</small>` : ""; };
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
  // Uzbek numbers need all 9 digits; foreign guests book with their own international number.
  const validPhone = (p) => /^\+998\d{9}$/.test(normPhone(p)) || /^\+(?!998)[1-9]\d{7,14}$/.test(normPhone(p));
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

  // Cities without hand-picked photos take the photos of their Wikipedia article (Commons files only), cached for two weeks.
  const WIKI_KEY = "bron.wikiph.v1";
  function wikiPhotos(done) {
    const need = CITIES.filter((c) => c.wiki && !(PHOTOS[c.name] || []).length);
    if (!need.length || !window.fetch) return;
    let cache = store(WIKI_KEY, {});
    if (!cache.t || Date.now() - cache.t > 14 * 864e5) cache = { t: Date.now(), d: {} };
    const apply = () => need.forEach((c) => { const l = cache.d[c.name]; if (l && l.length) PHOTOS[c.name] = l.map((file) => ({ file, title: c.name })); });
    apply();
    const todo = need.filter((c) => !cache.d[c.name]);
    if (!todo.length) return done();
    const BAD = /(map|flag|coat|seal|emblem|logo|locat|karta|gerb|xarita|bayroq|\.svg|\.png|\.gif|\.tif)/i;
    Promise.all(todo.map((c) => fetch(`https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(c.wiki.replace(/ /g, "_"))}`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((j) => {
        cache.d[c.name] = (j.items || []).filter((it) => it.type === "image" && /^File:.+\.jpe?g$/i.test(it.title || "") && !BAD.test(it.title)
          && (it.srcset || []).some((x) => /\/commons\//.test(x.src))).map((it) => it.title.slice(5)).slice(0, 5);
      })
      .catch(() => { /* offline or blocked: keep the drawing */ })))
      .then(() => { keep(WIKI_KEY, cache); apply(); done(); });
  }

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
  function quote(item, from, to, guests, roomId, rooms = 1) {
    const t = TYPES[item.type];
    if (item.type === "transport") { const q = tripQuote(item.trip, roomId, guests); return { label: q.mode === "avto" ? `${q.name}, butun mashina` : `${som(q.unit)} × ${guests} ${t.noun}`, sum: q.sum }; }
    const p = unitPrice(item, roomId);
    if (item.type === "tour") return { label: `${som(p)} × ${guests} ${t.noun}`, sum: p * guests };
    const n = Math.max(1, daysBetween(from, to) + (item.type === "venue" ? 1 : 0));
    if (item.type === "hostel") return { label: `${som(p)} × ${n} ${t.noun} × ${guests} o'rin`, sum: p * n * guests };
    if (item.type === "hotel" && rooms > 1) return { label: `${som(p)} × ${n} ${t.noun} × ${rooms} xona`, sum: p * n * rooms };
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
  // The "Transport" search tab is a shortcut to the transport section below.
  function fillQuickPlaces() {
    const mode = $("#qMode").value, pl = placesFor(mode);
    const from = pl.includes($("#qFrom").value) ? $("#qFrom").value : pl.includes("Toshkent") ? "Toshkent" : pl[0];
    let to = pl.includes($("#qTo").value) && $("#qTo").value !== from ? $("#qTo").value : "";
    if (!to) to = ((TRANSPORT[mode] || []).find((t) => t.from === from && t.to !== from) || {}).to || pl.find((c) => c !== from) || from;
    const opts = (sel, skip) => placeOptions(pl.filter((c) => c !== skip || mode === "avto"), sel);
    $("#qFrom").innerHTML = opts(from);
    $("#qTo").innerHTML = opts(to, from);
  }
  function showQuickTransport(on) {
    $("#fieldsTr").hidden = !on;
    $("#fieldsMain").hidden = on;
    $$(".tab").forEach((b) => { const sel = on ? b.dataset.type === "transport" : b.dataset.type === state.type; b.classList.toggle("is-on", sel); b.setAttribute("aria-selected", String(sel)); });
    const cur = $(".tabs .tab.is-on"), strip = cur && cur.parentNode;
    if (strip && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = Math.max(0, cur.offsetLeft - strip.offsetLeft - 16);
    if (on) { if (!$("#qDate").value) $("#qDate").value = $("#trDate").value || $("#fFrom").value; $("#qDate").min = todayIso(); fillQuickPlaces(); }
  }
  function searchQuickTransport() {
    const msg = $("#searchMsg"); msg.className = "form-msg"; msg.textContent = "";
    if (!$("#qDate").value || $("#qDate").value < todayIso()) { msg.textContent = "Bugungi yoki keyingi sanani tanlang."; msg.classList.add("err"); return; }
    state.trMode = $("#qMode").value;
    fillTrPlaces(false);
    $("#trFrom").value = $("#qFrom").value;
    fillTrPlaces(true);
    if ([...$("#trTo").options].some((o) => o.value === $("#qTo").value)) $("#trTo").value = $("#qTo").value;
    $("#trDate").value = $("#qDate").value;
    $("#trPax").value = Math.min(45, Math.max(1, parseInt($("#qPax").value, 10) || 1));
    renderTransport();
    $("#transport").scrollIntoView({ block: "start" });
  }

  function setType(type) {
    if (type === "transport") return showQuickTransport(true);
    showQuickTransport(false);
    state.type = type;
    $$(".tab").forEach((b) => { const on = b.dataset.type === type; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
    const t = TYPES[type];
    $("#fFromLabel").textContent = t.from;
    $("#fToLabel").textContent = t.to;
    $("#fGuestsLabel").textContent = t.guests;
    $("#fGuestsBtn").hidden = type !== "hotel";
    $("#fGuests").hidden = type === "hotel";
    if (type !== "hotel") { state.kids = 0; state.rooms = 1; }
    if (type === "hotel" && +$("#fGuests").value > 40) $("#fGuests").value = 2;
    $("#fToWrap").hidden = type === "tour";
    $("#fieldsMain").classList.toggle("no-to", type === "tour");
    if (type === "venue" && +$("#fGuests").value < 10) $("#fGuests").value = 50;
    if (type !== "venue" && +$("#fGuests").value > 40) $("#fGuests").value = 2;
    state.stars.clear(); state.amen.clear(); state.maxPct = 100;
    if (state.favOnly && !LISTINGS.some((x) => x.type === type && favs.has(x.id))) { state.favOnly = false; $("#fFav").checked = false; }
    buildFilters();
    readSearch();
    if (type === "hotel") guestsText();
    render();
  }

  function buildFilters() {
    $("#starsGroup").hidden = state.type !== "hotel";
    $("#fStars").innerHTML = [5, 4, 3, 2].map((n) => `<button type="button" class="chip" data-star="${n}" aria-pressed="${state.stars.has(n)}">${n} ★</button>`).join("");
    const has = new Set(LISTINGS.filter((x) => x.type === state.type).flatMap((x) => x.amenities || []));
    $("#fAmen").innerHTML = AMEN_FILTER[state.type].filter((k) => has.has(k) || state.amen.has(k)).map((k) => `<label class="check"><input type="checkbox" data-amen="${k}"${state.amen.has(k) ? " checked" : ""}> <span>${AMEN[k][0]}</span></label>`).join("");
    const prices = LISTINGS.filter((x) => x.type === state.type).map((x) => x.price);
    $("#fPrice").min = prices.length ? Math.max(1, Math.ceil(Math.min(...prices) / maxPriceFor(state.type) * 100)) : 1;
    state.maxPct = Math.max(state.maxPct, +$("#fPrice").min);
    $("#fPrice").value = state.maxPct;
    $("#priceUnit").textContent = `${TYPES[state.type].unit} uchun`;
    syncNearSort();
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
    if (busy.key && busy.key !== [state.type, state.from, state.type === "tour" ? state.from : state.to, state.guests, state.rooms].join("|")) { busy.key = ""; busy.ids = new Set(); }
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

  // Sold-out places for the searched dates (server mode): hidden from results, counted in the header.
  const busy = { key: "", ids: new Set(), n: 0 };
  async function loadBusy() {
    if (!API || !state.from || state.type === "transport") return;
    const to = state.type === "tour" ? state.from : state.to;
    const key = [state.type, state.from, to, state.guests, state.rooms].join("|");
    if (key === busy.key) return;
    try {
      const r = await fetch(`/api/availability/all?type=${state.type}&from=${state.from}&to=${to}&guests=${state.guests}&rooms=${state.rooms}`);
      if (!r.ok) return;
      const a = await r.json();
      busy.key = key; busy.ids = new Set(a.busy || []);
      render();
    } catch (e) { /* offline */ }
  }
  // Distance to the city centre, only for places with real coordinates (sample pins are approximate).
  function distKm(x) {
    const c = GEO[x.city];
    if (!c || !Number.isFinite(x.lat) || !Number.isFinite(x.lng)) return null;
    const R = 6371, r = Math.PI / 180, dLat = (x.lat - c[0]) * r, dLng = (x.lng - c[1]) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(c[0] * r) * Math.cos(x.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  const distText = (x) => { const d = distKm(x); return d == null ? "" : d < 1 ? `markazdan ${Math.round(d * 1000 / 50) * 50} m` : `markazdan ${d.toFixed(1).replace(".", ",")} km`; };
  function syncNearSort() {
    const any = LISTINGS.some((x) => x.type === state.type && distKm(x) != null);
    let o = $("#fSort option[value=near]");
    if (any && !o) { o = document.createElement("option"); o.value = "near"; o.textContent = "Markazga yaqinlari"; $("#fSort").append(o); }
    if (!any && o) { if ($("#fSort").value === "near") $("#fSort").value = "rec"; o.remove(); state.sort = $("#fSort").value; }
  }
  function results() {
    const cap = priceCap();
    const need = state.guests;
    let list = LISTINGS.filter((x) => x.type === state.type
      && inPlace(x.city, state.city)
      && x.capacity + (x.type === "hotel" ? 2 : 0) >= (x.type === "hotel" ? Math.ceil(need / state.rooms) : need)
      && x.price <= cap
      && (!state.stars.size || state.stars.has(x.stars))
      && [...state.amen].every((a) => (x.amenities || []).includes(a))
      && (!state.free || x.free)
      && (!state.deals || x.old)
      && (!state.favOnly || favs.has(x.id))
      && !busy.ids.has(x.id));
    const by = { near: (a, b) => (distKm(a) ?? 1e9) - (distKm(b) ?? 1e9), cheap: (a, b) => a.price - b.price, exp: (a, b) => b.price - a.price, rate: (a, b) => b.rating - a.rating, rec: (a, b) => b.rating * Math.log(b.reviews + 2) - a.rating * Math.log(a.reviews + 2) };
    return list.sort(by[state.sort]);
  }

  // Price for the searched dates, as on big booking sites ("3 nights, total …").
  function totalLine(x) {
    if (!state.from || (nightly(x) && !(state.to > state.from))) return "";
    const rooms = x.type === "hotel" ? state.rooms : 1;
    const q = quote(x, state.from, state.to || state.from, x.type === "hostel" ? state.guests : 1, "standart", rooms);
    const n = Math.max(1, daysBetween(state.from, state.to || state.from));
    const head = x.type === "hotel" && rooms > 1 ? `${n} kecha · ${rooms} xona` : x.type === "hostel" && state.guests > 1 ? `${n} kecha · ${state.guests} o'rin` : `${n} kecha`;
    return `<span class="tot">${head} · jami ${som(q.sum)}</span>`;
  }
  function card(x) {
    const t = TYPES[x.type];
    const cap = x.type === "hotel" ? `${x.capacity} kishigacha` : x.type === "hostel" ? `${x.beds || x.capacity} o'rinli` : x.type === "venue" ? `${x.capacity} o'rin` : `Guruh ${x.capacity} kishigacha`;
    const off = x.old ? Math.round((1 - x.price / x.old) * 100) : 0;
    const am = (x.amenities || []).slice(0, 4);
    return `
    <article class="item">
      <div style="position:relative">
        <button class="thumb" type="button" data-open="${esc(x.id)}" aria-label="${esc(x.name)}: batafsil">${art(x.art, x.hue, x.id)}${imgTag(photosFor(x)[0], 640)}<span class="kind">${t.kind} · ${esc(x.city)}</span>${off ? `<span class="badge">−${off}%</span>` : ""}${x.sample ? `<span class="sample-tag">Namuna</span>` : ""}${photosFor(x)[0] ? `<span class="place">${esc(photosFor(x)[0].title)}</span>` : ""}</button>
        <button class="fav" type="button" data-fav="${esc(x.id)}" aria-pressed="${favs.has(x.id)}" aria-label="${favs.has(x.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}">${heart}</button>
      </div>
      <div class="item-body">
        <div class="item-top">
          <div>${x.stars ? `<div class="stars" aria-label="${x.stars} yulduz">${starStr(x.stars)}</div>` : ""}<h3><button type="button" data-open="${esc(x.id)}">${esc(x.name)}</button></h3></div>
          <div class="rating"><b>${Number(x.rating).toFixed(1)}</b><small>${x.reviews} sharh</small></div>
        </div>
        <p class="meta">${esc(x.district || x.city)}${distText(x) ? " · " + distText(x) : ""} · ${cap}</p>
        <div class="amen">${am.map((k) => AMEN[k] ? `<span>${icon(k)}${AMEN[k][0]}</span>` : "").join("")}</div>
        ${x.free ? `<p class="free">✓ Bepul bekor qilish</p>` : ""}
        <label class="cmp-chk"><input type="checkbox" data-cmp="${esc(x.id)}"${cmp.has(x.id) ? " checked" : ""}> <span>Solishtirish</span></label>
      </div>
      <div class="item-foot">
        <p class="price">${x.old ? `<s>${som(x.old)}</s>` : ""}<b>${som(x.price)}</b><small>${t.unit}${x.type === "hotel" ? " dan" : ""}</small>${altTag(x.price)}${totalLine(x)}</p>
        <button class="btn btn-gold" type="button" data-book="${esc(x.id)}">Bron qilish</button>
      </div>
    </article>`;
  }

  function render() {
    const t = TYPES[state.type];
    const list = results();
    $("#resEyebrow").textContent = t.title;
    $("#resTitle").textContent = state.city ? state.city.replace(/^@/, "") : "Barcha shaharlar";
    const hid = LISTINGS.filter((x) => x.type === state.type && busy.ids.has(x.id) && inPlace(x.city, state.city)).length;
    $("#resCount").textContent = `${list.length} ta variant` + (hid ? ` · ${hid} ta joy bu sanalarda band` : "");
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
          <p class="price">${x.old ? `<s>${som(x.old)}</s>` : ""}<b>${som(x.price)}</b><small>1 kun</small>${altTag(x.price)}</p>
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
          <p class="price">${x.old ? `<s>${som(x.old)}</s>` : ""}<b>${som(x.price)}</b><small>1 kishi uchun</small>${altTag(x.price)}</p>
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
    const regionOpts = REGIONS.map((r) => `<option value="@${esc(r)}"${"@" + r === cur ? " selected" : ""}>${esc(r)}: hammasi</option>`).join("");
    $("#fCity").innerHTML = `<option value="">Barcha shaharlar</option><optgroup label="Butun hudud">${regionOpts}</optgroup>` + placeOptions(CITIES.map((c) => c.name), cur);
    const count = (f) => LISTINGS.filter((x) => inPlace(x.city, f)).length;
    $("#regChips").innerHTML = [["", "Mashhur"]].concat(REGIONS.map((r) => [r, r])).map(([r, label]) => `<button type="button" class="chip" data-region="${esc(r)}" aria-pressed="${state.region === r}">${esc(label)}${r ? ` <small>${count("@" + r)}</small>` : ""}</button>`).join("");
    // "Mashhur": the original eight cities and regional centres; a region chip shows every city in it.
    let list = state.region ? CITIES.filter((c) => c.region === state.region) : CITIES.filter((c) => c.size !== 1);
    const all = !state.region && state.allCities;
    if (all) list = CITIES;
    $("#cities").innerHTML = list.map((c) => {
      const n = count(c.name);
      return `<button class="city${state.city === c.name ? " is-on" : ""}" type="button" data-city="${esc(c.name)}" aria-pressed="${state.city === c.name}"><span class="arch">${art(c.art, c.hue, "city" + c.name)}${imgTag((PHOTOS[c.name] || [])[0], 640)}<span class="c-txt"><span class="c-count">${n} ta joy</span><b>${esc(c.name)}</b><small>${esc(c.note)}</small></span></span></button>`;
    }).join("");
    $("#allCities").hidden = !!state.region || all;
    $("#allCities").textContent = `Barcha ${CITIES.length} ta shahar`;
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
    loadReviews(x);
    countView(x);
    detailSights(x);
    detailRules(x);
    detailWeather(x);
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
    $("#dPrice").innerHTML = `${x.old && state.room === "standart" ? `<s>${som(x.old)}</s>` : ""}<b>${som(unitPrice(x, state.room))}</b><small>${TYPES[x.type].unit}</small>${altTag(unitPrice(x, state.room))}`;
  }

  function openBooking(id, roomId) {
    const item = LISTINGS.find((x) => x.id === id) || tripItem(TRIPS.get(id));
    if (!item) return;
    state.current = item;
    state.room = item.type === "transport" ? roomId || "" : roomId || (item.type === "hotel" ? (ROOMS.find((r) => item.capacity + r.extra >= Math.ceil(state.guests / (sameTypeOf(item) ? state.rooms : 1))) || ROOMS[ROOMS.length - 1]).id : "standart");
    const t = TYPES[item.type];
    $("#dlgTitle").textContent = item.name;
    $("#dlgCity").textContent = item.type === "transport" ? `${{ avia: "Aviareys", poyezd: "Poyezd", avto: "Haydovchili avtomobil" }[item.trip.mode]}${item.trip.dep ? " · jo'nash " + item.trip.dep : ""}` : `${t.kind} · ${item.city}`;
    $("#bFromLabel").textContent = t.from;
    $("#bToLabel").textContent = t.to;
    $("#bGuestsLabel").textContent = t.guests;
    $("#bToWrap").hidden = item.type === "tour" || item.type === "transport";
    const trainClasses = item.type === "transport" && item.trip.mode === "poyezd";
    $("#bRoomWrap").hidden = item.type !== "hotel" && !trainClasses;
    $("#bRoomsWrap").hidden = item.type !== "hotel";
    state.bRooms = item.type === "hotel" && sameTypeOf(item) ? state.rooms : 1;
    $("#bRooms").value = state.bRooms;
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
  const sameTypeOf = (item) => state.type === item.type;
  function syncBookDates() {
    const item = state.current, f = $("#bFrom").value;
    const max = iso(addDays(new Date(), 365));
    $("#bFrom").max = max; $("#bTo").max = iso(addDays(new Date(), 425));
    $("#bTo").min = f ? (item && nightly(item) ? iso(addDays(day(f), 1)) : f) : todayIso();
  }
  const capOf = (item) => item.type === "hotel" ? (item.capacity + roomOf(item, state.room).extra) * state.bRooms : item.capacity;
  const bookRooms = () => Math.min(10, Math.max(1, parseInt($("#bRooms").value, 10) || 1));

  function updateTotal() {
    const item = state.current;
    if (!item) return;
    state.room = $("#bRoom").value || (item.type === "transport" ? "" : "standart");
    state.bRooms = item.type === "hotel" ? bookRooms() : 1;
    $("#bGuests").max = capOf(item);
    const from = $("#bFrom").value, to = $("#bTo").value;
    const guests = Math.max(1, parseInt($("#bGuests").value, 10) || 1);
    const span = to ? daysBetween(from, to) : 0;
    const badDates = !from || from < todayIso() || span > 60 || (nightly(item) && !(to > from)) || (item.type === "venue" && to && to < from);
    if (badDates) { $("#totalCalc").textContent = "Sanalarni tekshiring"; $("#totalSum").textContent = "—"; $("#totalAlt").textContent = ""; $("#bAvail").textContent = ""; return; }
    $("#bPolicy").textContent = item.type === "transport" ? "Chipta narxi namuna jadval asosida. Aniq narxni menejer tasdiqlaydi."
      : item.free ? "✓ Kelish kunidan oldin saytning o'zida bepul bekor qilish mumkin." : "Bekor qilish shartlarini menejer bron tasdiqlanganda aytadi.";
    $("#bSample").hidden = !item.sample;
    const q = quote(item, from, to || from, guests, state.room, state.bRooms);
    $("#totalCalc").textContent = q.label;
    $("#totalSum").textContent = som(q.sum);
    $("#totalAlt").textContent = alt(q.sum);
    $("#curNote").hidden = !alt(q.sum);
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
        const r = await fetch(`/api/availability?id=${encodeURIComponent(item.id)}&from=${from}&to=${to}&guests=${guests}&rooms=${state.bRooms}`);
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
    if (!validPhone(phone)) { $("#bPhone").setAttribute("aria-invalid", "true"); $("#bPhone").focus(); msg.textContent = "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67."; return; }
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
          : await api("/api/bookings", { listingId: item.id, from, to, guests, client: name, phone, pay, note, room, rooms: state.bRooms });
        booking = { code: r.code, id: item.id, name: r.name, city: r.city, type: r.type, from: r.from, to: r.to, guests: r.guests, sum: r.sum, status: r.status, phone: normPhone(phone), tg: r.tg || "" };
      } catch (err) { msg.textContent = err.message; return; }
      finally { btn.disabled = false; }
    } else {
      const code = "BRN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      booking = { code, id: item.id, name: item.name, city: item.city, type: item.type, from, to, guests, sum: quote(item, from, to, guests, item.type === "transport" ? state.room : room, state.bRooms).sum, phone: normPhone(phone) };
    }
    if (user) booking.owner = user.phone;
    booking.pay = pay;
    booking.created = new Date().toISOString();
    if (item.type === "hotel") booking.room = roomOf(item, state.room).name + (state.bRooms > 1 ? ` × ${state.bRooms}` : "");
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
    $("#doneTg").hidden = !b.tg;
    if (b.tg) $("#doneTg").href = b.tg;
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
  // ---------- verified reviews (server mode) ----------
  const REVIEWED_KEY = "bronuz.reviewed";
  let reviewed = new Set(store(REVIEWED_KEY, []));
  const canReview = (b) => API && b.type !== "transport" && (b.status === "yakunlandi" || (b.status === "tasdiqlandi" && (b.to || b.from) < todayIso())) && !b.reviewed && !reviewed.has(b.code);
  // Online cancellation: before the start day only, and a confirmed booking only where cancellation is free.
  const canCancel = (b) => { if (!isActive(b) || (b.from || "") <= todayIso()) return false; const l = LISTINGS.find((x) => x.id === b.id); return !(b.status === "tasdiqlandi" && l && !l.free); };
  // Guest bookings (no account) are refreshed from the server by code + phone.
  async function refreshGuestBookings() {
    const mine = memoryBookings.filter((b) => b.phone && /^BRN-/.test(b.code || ""));
    if (!API || !mine.length) return;
    try {
      const rows = await api("/api/bookings/lookup", { items: mine.map((b) => ({ code: b.code, phone: b.phone })) });
      const by = new Map(rows.map((r) => [r.code, r]));
      saveBookings(memoryBookings.map((b) => by.has(b.code) ? { ...b, status: by.get(b.code).status, reviewed: by.get(b.code).reviewed } : b));
      renderMine();
    } catch (e) { /* offline */ }
  }
  let reviewFor = null, reviewRate = 0;
  function openReview(code) {
    const b = myBookings().find((x) => x.code === code);
    if (!b) return;
    reviewFor = b; reviewRate = 0;
    $("#rvTitle").textContent = b.name;
    $("#rvText").value = ""; $("#rvMsg").textContent = "";
    $$("#rvRate [data-rate]").forEach((x) => x.setAttribute("aria-checked", "false"));
    openDlg($("#reviewDlg"));
  }
  async function submitReview(e) {
    e.preventDefault();
    const msg = $("#rvMsg"); msg.className = "form-msg err";
    if (!reviewRate) { msg.textContent = "1 dan 10 gacha baho qo'ying."; return; }
    try {
      await api("/api/reviews", { code: reviewFor.code, phone: reviewFor.phone, rating: reviewRate, text: $("#rvText").value.trim() });
    } catch (err) { if (!/allaqachon/.test(err.message)) { msg.textContent = err.message; return; } }
    reviewed.add(reviewFor.code); keep(REVIEWED_KEY, [...reviewed]);
    closeDlg($("#reviewDlg"));
    renderMine();
    toast("Rahmat! Sharhingiz qabul qilindi.");
  }
  async function loadReviews(item) {
    const box = $("#dReviews");
    box.hidden = true; box.innerHTML = "";
    if (!API || !item || item.type === "transport") return;
    try {
      const r = await fetch(`/api/listings/${encodeURIComponent(item.id)}/reviews`);
      const list = r.ok ? await r.json() : [];
      if (state.current !== item) return;
      const avg = list.length ? Math.round(list.reduce((n, x) => n + x.rating, 0) / list.length * 10) / 10 : 0;
      box.innerHTML = `<h4>Tasdiqlangan mehmonlar sharhlari</h4>` + (list.length
        ? `<p class="rv-sum"><b>${String(avg).replace(".", ",")}</b> <span>${list.length} ta sharh, faqat shu yerda yashagan mehmonlardan</span></p>` + list.slice(0, 6).map((x) => `<blockquote class="rv"><p><b>${esc(x.name)}</b> <span class="rv-score">${x.rating}/10</span> <small>${fmtDate(x.created.slice(0, 10))}</small></p>${x.text ? `<p>${esc(x.text)}</p>` : ""}</blockquote>`).join("")
        : `<p class="muted small">Hali tasdiqlangan sharh yo'q. Bron qilib, yashab ketgan mehmonlar sharh qoldira oladi.</p>`);
      box.hidden = false;
    } catch (e) { /* offline */ }
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
        <div class="grow"><b>${esc(b.name)}</b><span class="muted">${esc(b.city)} · ${dates} · ${b.guests} kishi${b.room ? " · " + esc((ROOMS.find((r) => r.id === b.room) || { name: b.room }).name) + (b.rooms > 1 && !/×/.test(b.room) ? ` × ${b.rooms}` : "") : ""}${b.pay ? " · " + esc(PAY_LABEL[b.pay] || b.pay) : ""}</span></div>
        <span class="sum">${som(b.sum)}</span>
        <span class="st st-${STATUS_CLASS[b.status || "yangi"] || "new"}">${esc(STATUS_LABEL[b.status || "yangi"] || b.status)}</span>
        ${canReview(b) ? `<span class="b-acts"><button class="btn btn-gold" type="button" data-review="${esc(b.code)}">Sharh qoldirish</button></span>`
          : isActive(b) ? `<span class="b-acts"><button class="btn btn-line" type="button" data-ics="${esc(b.code)}" aria-label="Kalendarga qo'shish">📅</button>${canCancel(b) ? `<button class="btn btn-line" type="button" data-cancel="${esc(b.code)}">Bekor qilish</button>` : `<small class="muted">Bekor qilish: menejer orqali</small>`}</span>` : ""}
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
    if (!validPhone($("#mPhone").value)) { msg.textContent = "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67."; return; }
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
    const opts = (sel) => placeOptions(pl, sel);
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
      : `<div class="tr-time"><div><b>${t.dep}</b><small>${esc(t.fromCode || t.from)}</small></div><div class="tr-line"><span>${hm(t.dur)}</span>${t.via ? `<small class="tr-via">${esc(t.via)} orqali</small>` : ""}</div><div><b>${t.arr}${t.arr < t.dep ? "<sup>+1</sup>" : ""}</b><small>${esc(t.toCode || t.to)}</small></div></div>`;
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
    list.sort((a, b) => !!a.via - !!b.via || (a.dep || "").localeCompare(b.dep || "") || a.price - b.price);
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
      // Pins stay exactly on their city. Cities whose labels would overlap at this zoom join one pin
      // (biggest city's name, "+N" for the rest); clicking it zooms to those cities.
      const groups = [], small = map.getSize().x < 560, gx = small ? 78 : 120, gy = small ? 24 : 32;
      Object.entries(by).sort((a, b) => b[1].length - a[1].length).forEach(([city, xs]) => {
        const c = GEO[city]; if (!c) return;
        const pt = map.latLngToContainerPoint([c[0], c[1]]);
        const g = groups.find((q) => Math.abs(q.x - pt.x) < gx && Math.abs(q.y - pt.y) < gy);
        if (g) { g.n += xs.length; g.cities.push(city); g.pts.push([c[0], c[1]]); }
        else groups.push({ x: pt.x, y: pt.y, n: xs.length, cities: [city], pts: [[c[0], c[1]]], at: [c[0], c[1]] });
      });
      groups.forEach((g) => {
        const more = g.cities.length - 1;
        const icon = L.divIcon({ className: "pin-wrap", html: `<span class="cpin${small ? " sm" : ""}"><b>${g.n}</b>${esc(g.cities[0])}${more ? `<i>+${more}</i>` : ""}</span>`, iconSize: null });
        cityPins.push(L.marker(g.at, { icon, title: g.cities.join(", ") }).addTo(map)
          .on("click", () => (more ? map.fitBounds(g.pts, { padding: [60, 60], maxZoom: 12 }) : map.setView(g.at, 12))));
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
  // Real hotels, hostels and guest houses from OpenStreetMap, looked up for the visible area when zoomed in.
  // They are not bron.uz partners: the popup gives their own contacts and a Google Maps link with real reviews.
  let osmLayer = null, osmTimer = 0;
  const OSM_TYPE = { hotel: "Mehmonxona", hostel: "Hostel", guest_house: "Mehmon uyi", motel: "Motel", apartment: "Apartament" };
  const osmCache = new Map();
  function osmPopup(e) {
    const t = e.tags || {}, lat = e.lat || (e.center && e.center.lat), lon = e.lon || (e.center && e.center.lon);
    const name = t["name:" + LANG] || t.name || t["name:en"] || OSM_TYPE[t.tourism] || "Mehmonxona";
    const addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
    const phone = t.phone || t["contact:phone"] || "", site = t.website || t["contact:website"] || "";
    const safeSite = /^https?:\/\//i.test(site) ? site : "";
    return `<div class="mp osm-pop"><div class="mp-b"><small>${esc(OSM_TYPE[t.tourism] || "Mehmonxona")}${t.stars ? ` · ${"★".repeat(Math.min(5, parseInt(t.stars, 10) || 0))}` : ""}</small><b>${esc(name)}</b>
      ${addr ? `<span class="mp-r">${esc(addr)}</span>` : ""}${phone ? `<span class="mp-r"><a href="tel:${esc(phone.replace(/[^+\d]/g, ""))}">${esc(phone)}</a></span>` : ""}
      <div class="mp-a">${safeSite ? `<a class="btn btn-line" href="${esc(safeSite)}" target="_blank" rel="noopener nofollow">Sayti</a>` : ""}<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + lat + "," + lon)}" target="_blank" rel="noopener">Sharhlar (Google)</a></div>
      <p class="osm-note">bron.uz hamkori emas: narx va bron uchun o'zlari bilan bog'laning. Ma'lumot: OpenStreetMap.</p></div></div>`;
  }
  function loadOsm() {
    if (!map) return;
    if (osmLayer) { osmLayer.remove(); osmLayer = null; }
    const msg = $("#osmMsg");
    if (!$("#osmOn").checked) { msg.textContent = ""; return; }
    if (map.getZoom() < 10) { msg.textContent = "Ko'rish uchun shaharni yaqinlashtiring."; return; }
    const b = map.getBounds(), r = (v) => Math.round(v * 50) / 50;
    const key = [r(b.getSouth()), r(b.getWest()), r(b.getNorth()), r(b.getEast())].join(",");
    const draw = (els) => {
      osmLayer = L.layerGroup(els.filter((e) => e.lat || e.center).map((e) => L.circleMarker([e.lat || e.center.lat, e.lon || e.center.lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#6b7280", fillOpacity: .95 }).bindPopup(() => osmPopup(e), { maxWidth: 280, className: "mp-pop" }))).addTo(map);
      msg.textContent = els.length ? `Bu hududda ${els.length} ta haqiqiy joy (OpenStreetMap).` : "Bu hududda OpenStreetMap'da joy topilmadi.";
    };
    if (osmCache.has(key)) return draw(osmCache.get(key));
    msg.textContent = "Yuklanmoqda...";
    const q = `[out:json][timeout:20];nwr["tourism"~"^(hotel|hostel|guest_house|motel|apartment)$"](${key});out center tags 200;`;
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "content-type": "application/x-www-form-urlencoded" } })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((j) => { const els = j.elements || []; osmCache.set(key, els); if ($("#osmOn").checked) draw(els); })
      .catch(() => { msg.textContent = "OpenStreetMap ma'lumotini yuklab bo'lmadi. Keyinroq urinib ko'ring."; });
  }
  const osmSoon = () => { clearTimeout(osmTimer); osmTimer = setTimeout(loadOsm, 600); };

  function showRoute(x) {
    if (routeLine) { routeLine.remove(); routeLine = null; }
    const pts = x && x.days > 1 ? (x.route || []).map((c) => GEO[c]).filter(Boolean).map((c) => [c[0], c[1]]) : [];
    if (pts.length > 1) routeLine = L.polyline(pts, { color: "#e0a21c", weight: 4, dashArray: "8 8" }).addTo(map);
  }
  async function initMap() {
    if (map) return;
    try { await loadLeaflet(); } catch (e) { $("#map").innerHTML = `<p class="map-load">Xaritani yuklab bo'lmadi. Internetni tekshiring.</p>`; return; }
    $("#map").innerHTML = "";
    map = L.map("map", { scrollWheelZoom: false, zoomControl: true, maxBoundsViscosity: 1 });
    // The map stays on Uzbekistan: it opens on the country and cannot be dragged far outside it.
    const UZ = [[37.1, 55.9], [45.6, 73.2]];
    map.fitBounds(UZ, { padding: [10, 10] });
    map.setMinZoom(Math.max(4, map.getZoom()));
    map.setMaxBounds(L.latLngBounds(UZ).pad(0.15));
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    map.on("moveend", () => { renderMapSide(); osmSoon(); });
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
    if (!validPhone(body.phone)) { msg.textContent = "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67."; return; }
    if (!API) { msg.textContent = "Sayt hozir namuna rejimida ishlayapti, ariza serverga yuborilmadi. Server ishga tushgach arizalar admin panelga keladi."; return; }
    try { await api("/api/partner-requests", body); }
    catch (err) { msg.textContent = err.message; return; }
    msg.className = "form-msg ok";
    msg.textContent = "Rahmat! Arizangiz qabul qilindi. Menejer siz bilan bog'lanib, joyingizni kabinetingizga biriktiradi.";
    $("#partnerForm").reset();
  }

  // ---------- wiring ----------
  // ---------- sights (photos and links from Wikipedia, loaded in the browser) ----------
  const SIGHTS = window.BRON_SIGHTS || [];
  const SIGHT_KEY = "bron.sights.v1";
  const LANG = (window.BRON_I18N && window.BRON_I18N.lang) || "uz";
  const sightText = (s) => s[LANG] || s.uz;
  const wikiUrl = (s) => `https://en.wikipedia.org/wiki/${encodeURIComponent(s.wiki.replace(/ /g, "_"))}`;
  let sightPh = {}, sightCity = "";
  function sightPhotos() {
    let c = store(SIGHT_KEY, {});
    if (!c.t || Date.now() - c.t > 14 * 864e5) c = { t: Date.now(), d: {} };
    sightPh = c.d;
    const todo = SIGHTS.filter((s) => !(s.wiki in sightPh));
    if (!todo.length || !window.fetch) return;
    Promise.all(todo.map((s) => fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(s.wiki.replace(/ /g, "_"))}`)
      .then((r) => r.ok ? r.json() : {})
      .then((j) => { const src = (j.thumbnail && j.thumbnail.source) || ""; sightPh[s.wiki] = src ? src.replace(/\/\d+px-/, "/640px-") : ""; })
      .catch(() => { /* blocked or offline: the card keeps its drawing */ })))
      .then(() => { c.d = sightPh; keep(SIGHT_KEY, c); renderSights(); });
  }
  function renderSights() {
    const box = $("#sights");
    if (!box || !SIGHTS.length) return;
    const cities = [...new Set(SIGHTS.map((s) => s.city))];
    $("#sightChips").innerHTML = [["", "Hammasi"]].concat(cities.map((c) => [c, c])).map(([c, l]) => `<button type="button" class="chip" data-sight-city="${esc(c)}" aria-pressed="${sightCity === c}">${esc(l)}</button>`).join("");
    const city = (n) => CITIES.find((c) => c.name === n) || {};
    box.innerHTML = SIGHTS.filter((s) => !sightCity || s.city === sightCity).map((s) => {
      const [name, text] = sightText(s), ph = sightPh[s.wiki], c = city(s.city);
      return `<article class="sight"><div class="s-ph">${art(c.art || "dome", c.hue || 200, "s" + s.wiki)}${ph ? `<img data-ph class="ph" loading="lazy" alt="${esc(name)}" src="${esc(ph)}">` : ""}<span class="kind">${esc(s.city)}</span></div>
        <div class="s-b"><h3>${esc(name)}</h3><p>${esc(text)}</p>
        <div class="s-a"><button type="button" class="btn btn-line" data-city="${esc(s.city)}">Yaqin joylar</button><a class="linkish" href="${wikiUrl(s)}" target="_blank" rel="noopener">Vikipediya</a></div></div></article>`;
    }).join("");
  }
  function detailSights(x) {
    const el = $("#dSights"), list = SIGHTS.filter((s) => s.city === x.city);
    el.hidden = !list.length;
    el.innerHTML = list.length ? `<h4 class="d-sub">Shaharda ko'rish mumkin</h4><ul class="d-sl">${list.map((s) => `<li><a href="${wikiUrl(s)}" target="_blank" rel="noopener"><b>${esc(sightText(s)[0])}</b></a><span>${esc(sightText(s)[1])}</span></li>`).join("")}</ul>` : "";
  }

  // ---------- visit and view counters (server only) ----------
  // ---------- compare (up to 3 places of one type) ----------
  const cmp = new Set();
  function toggleCmp(el) {
    const id = el.dataset.cmp, on = el.checked, x = LISTINGS.find((y) => y.id === id);
    if (!x) return;
    const first = LISTINGS.find((y) => y.id === [...cmp][0]);
    if (on && first && first.type !== x.type) { cmp.clear(); toast("Bir turdagi joylarni solishtirish mumkin: ro'yxat yangilandi."); }
    if (on && cmp.size >= 3) { el.checked = false; toast("Ko'pi bilan 3 ta joyni solishtirish mumkin."); return; }
    on ? cmp.add(id) : cmp.delete(id);
    // Keep focus on the checkbox: only the bar changes (other cards' boxes stay as they are).
    $$("[data-cmp]").forEach((c) => { c.checked = cmp.has(c.dataset.cmp); });
    renderCmpBar();
  }
  function renderCmpBar() {
    $("#cmpBar").hidden = !cmp.size;
    $("#cmpCount").textContent = `Solishtirish (${cmp.size})`;
    $("#cmpGo").disabled = cmp.size < 2;
  }
  function openCompare() {
    const xs = [...cmp].map((id) => LISTINGS.find((y) => y.id === id)).filter(Boolean);
    if (xs.length < 2) return;
    const am = [...new Set(xs.flatMap((x) => x.amenities || []))].filter((k) => AMEN[k]);
    const row = (h, f) => `<tr><th scope="row">${h}</th>${xs.map((x) => `<td>${f(x)}</td>`).join("")}</tr>`;
    const best = (f, low) => { const v = xs.map(f); const m = low ? Math.min(...v) : Math.max(...v); return (x) => f(x) === m && v.filter((y) => y === m).length < v.length; };
    const cheap = best((x) => x.price, true), top = best((x) => Number(x.rating));
    $("#cmpTable").innerHTML = `<thead><tr><td></td>${xs.map((x) => `<th scope="col"><button type="button" class="linkish" data-open="${esc(x.id)}">${esc(x.name)}</button><small>${esc(x.city)}</small></th>`).join("")}</tr></thead><tbody>
      ${row("Narx", (x) => `<b${cheap(x) ? ' class="win"' : ""}>${som(x.price)}</b><small>${TYPES[x.type].unit}</small>${altTag(x.price)}`)}
      ${state.from ? row("Tanlangan sanalar", (x) => totalLine(x) || "—") : ""}
      ${row("Reyting", (x) => `<b${top(x) ? ' class="win"' : ""}>${Number(x.rating).toFixed(1)}</b> <small>${x.reviews} sharh</small>`)}
      ${xs.some((x) => x.stars) ? row("Yulduz", (x) => x.stars ? starStr(x.stars) : "—") : ""}
      ${row("Joylashuv", (x) => esc(x.district || x.city) + (distText(x) ? `<small>${distText(x)}</small>` : ""))}
      ${row("Sig'im", (x) => x.type === "hostel" ? `${x.beds || x.capacity} o'rin` : `${x.capacity} kishi`)}
      ${row("Bepul bekor qilish", (x) => x.free ? '<span class="yes">✓</span>' : '<span class="no">—</span>')}
      ${am.map((k) => row(AMEN[k][0], (x) => (x.amenities || []).includes(k) ? '<span class="yes">✓</span>' : '<span class="no">—</span>')).join("")}
      <tr><th></th>${xs.map((x) => `<td><button class="btn btn-gold" type="button" data-book="${esc(x.id)}">Bron qilish</button></td>`).join("")}</tr></tbody>`;
    openDlg($("#cmpDlg"));
  }

  // ---------- weather for the trip dates (Open-Meteo, free, no key; up to 16 days ahead) ----------
  const WMO = (c) => c === 0 ? ["☀️", "Ochiq"] : c <= 2 ? ["🌤️", "Qisman bulutli"] : c === 3 ? ["☁️", "Bulutli"] : c <= 48 ? ["🌫️", "Tuman"] : c <= 67 || (c >= 80 && c <= 82) ? ["🌧️", "Yomg'ir"] : c <= 77 || c === 85 || c === 86 ? ["🌨️", "Qor"] : ["⛈️", "Momaqaldiroq"];
  const wxCache = new Map();
  async function detailWeather(x) {
    const box = $("#dWeather");
    box.hidden = true; box.innerHTML = "";
    const c = GEO[x.city];
    const from = state.from && state.from >= todayIso() ? state.from : todayIso();
    const lim = iso(addDays(new Date(), 15));
    if (!c || from > lim) return;
    let to = state.to && state.to > from ? state.to : iso(addDays(day(from), 2));
    if (to > lim) to = lim;
    if (daysBetween(from, to) > 6) to = iso(addDays(day(from), 6));
    const lat = Number.isFinite(x.lat) ? x.lat : c[0], lng = Number.isFinite(x.lng) ? x.lng : c[1];
    const key = `${x.city}|${from}|${to}`;
    try {
      let d = wxCache.get(key);
      if (!d) {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTashkent&start_date=${from}&end_date=${to}`);
        if (!r.ok) return;
        d = (await r.json()).daily; wxCache.set(key, d);
      }
      if (!d || !d.time || state.current !== x) return;
      box.innerHTML = `<h4 class="d-sub">Ob-havo: ${esc(x.city)}</h4><div class="wx">${d.time.map((t, i) => { const [ic, w] = WMO(d.weather_code[i]); return `<div class="wx-d" title="${w}"><small>${fmtDate(t).slice(0, 5)}</small><span aria-hidden="true">${ic}</span><b>${Math.round(d.temperature_2m_max[i])}°</b><small>${Math.round(d.temperature_2m_min[i])}°${d.precipitation_probability_max && d.precipitation_probability_max[i] >= 30 ? ` · 💧${d.precipitation_probability_max[i]}%` : ""}</small><span class="sr">${w}</span></div>`; }).join("")}</div><p class="muted small">Prognoz: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a></p>`;
      box.hidden = false;
    } catch (e) { /* offline or blocked */ }
  }

  // ---------- house rules ----------
  function detailRules(x) {
    const rows = [];
    if (nightly(x)) rows.push(["Kirish va chiqish", x.checkin || x.checkout ? `Kirish ${x.checkin || "14:00"} dan, chiqish ${x.checkout || "12:00"} gacha` : "Odatda kirish 14:00 dan, chiqish 12:00 gacha; aniq vaqtni menejer tasdiqlaydi"]);
    rows.push(["Bekor qilish shartlari", x.free ? "Kelish kunidan oldin saytda bepul bekor qilinadi" : "Shartlarni menejer bron tasdiqlanganda aytadi"]);
    rows.push(["To'lov", "Joyida naqd yoki karta; Click, Payme, Uzum havolasini menejer yuboradi"]);
    if (nightly(x)) rows.push(["Hujjat", "Kirishda pasport yoki ID-karta; xorijliklar mehmonxona orqali ro'yxatga olinadi"]);
    if (x.rules) rows.push(["Joy qoidalari", esc(x.rules)]);
    $("#dRules").innerHTML = `<h4 class="d-sub">Qoidalar va shartlar</h4><dl class="d-rules">${rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl>`;
  }

  // ---------- currency ----------
  function applyRates(d) {
    if (!d || !d.rates || !d.rates.USD) return false;
    RATES = d.rates;
    const sel = $("#curSel");
    sel.innerHTML = ["UZS", ...Object.keys(RATES)].map((c) => `<option value="${c}"${c === CUR ? " selected" : ""}>${c}</option>`).join("");
    if (!RATES[CUR]) CUR = "UZS";
    sel.value = CUR; sel.hidden = false;
    sel.title = d.date ? `O'zbekiston Markaziy banki kursi, ${d.date}` : "O'zbekiston Markaziy banki kursi";
    return true;
  }
  async function loadRates() {
    const cached = store("bron.rates", null);
    if (cached && Date.now() - cached.at < 6 * 3600e3 && applyRates(cached)) return rerenderPrices();
    const pick = (list) => { const r = {}; for (const x of list) if (["USD", "EUR", "RUB", "GBP", "KZT", "CNY", "TRY"].includes(x.Ccy)) r[x.Ccy] = Number(x.Rate) / (Number(x.Nominal) || 1); return { date: list[0] && list[0].Date, rates: r }; };
    let d = null;
    try { if (API) { const r = await fetch("/api/rates"); if (r.ok) d = await r.json(); } } catch (e) { /* no server */ }
    if (!d || !d.rates) try { const r = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/"); if (r.ok) d = pick(await r.json()); } catch (e) { /* blocked: so'm only */ }
    if (d && applyRates(d)) { keep("bron.rates", { ...d, at: Date.now() }); rerenderPrices(); }
  }
  function rerenderPrices() { render(); renderVenues(); renderPackages(); if (state.current && $("#detailDlg").open) updateDetailPrice(); if ($("#bookDlg").open) updateTotal(); }

  const fmtN = (n) => Number(n || 0).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  const EYE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5C6.5 5 2.7 9.4 1.5 12c1.2 2.6 5 7 10.5 7s9.3-4.4 10.5-7C21.3 9.4 17.5 5 12 5zm0 11a4 4 0 110-8 4 4 0 010 8z"/></svg>`;
  // Small numbers on a young site would only put visitors off; the admin panel always shows them.
  function showStats(s) {
    if (!s || s.visitors < 200) return;
    const el = $("#heroStats");
    el.innerHTML = `<span><b>${fmtN(s.visitors)}</b> <i>foydalanuvchi</i></span><span><b>${fmtN(s.visits)}</b> <i>tashrif</i></span><span><b>${fmtN(s.views)}</b> <i>ko'rish</i></span><span><b>${fmtN(s.users)}</b> <i>ro'yxatdan o'tgan</i></span>`;
    el.hidden = false;
  }
  function countVisit() {
    let vid = "";
    try { vid = localStorage.getItem("bronuz.vid") || ""; if (!vid) { vid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem("bronuz.vid", vid); } } catch (e) { /* private mode: counted by address */ }
    api("/api/visit", { vid }).then(showStats).catch(() => {});
  }
  function countView(x) {
    const el = $("#dViews");
    el.hidden = true;
    if (!API) return;
    api(`/api/listings/${encodeURIComponent(x.id)}/view`, {}).then((r) => {
      x.views = r.views;
      if (state.current !== x) return;
      el.innerHTML = `${EYE}<span><b>${fmtN(r.views)}</b> <i>marta ko'rilgan</i></span>`;
      el.hidden = false;
    }).catch(() => {});
  }

  function heroCount() {
    const cities = new Set(LISTINGS.map((x) => x.city)).size;
    $(".hero .eyebrow").textContent = `${cities} shahar · ${LISTINGS.length} joy · narxlar so'mda`;
  }

  // ---------- guests & rooms picker (hotels) ----------
  function guestsText() {
    const adults = Math.max(1, state.guests - state.kids);
    $("#gpAdults").textContent = adults; $("#gpKids").textContent = state.kids; $("#gpRooms").textContent = state.rooms;
    $("#fGuestsTxt").textContent = `${state.guests} kishi · ${state.rooms} xona`;
    $$("#guestsPop [data-gp]").forEach((b) => {
      const k = b.dataset.gp, d = +b.dataset.d, v = { adults, kids: state.kids, rooms: state.rooms }[k];
      b.disabled = d < 0 ? v <= (k === "kids" ? 0 : 1) || (k === "adults" && v <= state.rooms) : (k === "rooms" ? v >= Math.min(10, adults) : k === "kids" ? v >= 10 : v >= 40);
    });
  }
  function initGuestsPicker() {
    const pop = $("#guestsPop"), btn = $("#fGuestsBtn");
    document.body.appendChild(pop);
    const place = () => {
      if (matchMedia("(max-width: 640px)").matches) { pop.style.left = pop.style.top = ""; return; }
      const r = btn.getBoundingClientRect();
      pop.style.left = `${Math.max(8, Math.min(r.right - pop.offsetWidth, document.documentElement.clientWidth - pop.offsetWidth - 8))}px`;
      const h = pop.offsetHeight;
      pop.style.top = `${r.bottom + 8 + h > innerHeight && r.top - 8 - h > 0 ? r.top - 8 - h : Math.min(r.bottom + 8, Math.max(8, innerHeight - h - 8))}px`;
    };
    const show = (on) => { pop.hidden = !on; btn.setAttribute("aria-expanded", String(on)); if (on) { guestsText(); place(); const b = pop.querySelector("button:not([disabled])"); if (b) b.focus({ preventScroll: true }); } };
    window.addEventListener("scroll", () => { if (!pop.hidden) place(); }, { passive: true });
    btn.addEventListener("click", () => show(pop.hidden));
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("[data-gp]");
      if (b) {
        let adults = Math.max(1, state.guests - state.kids);
        const d = +b.dataset.d;
        if (b.dataset.gp === "adults") adults = Math.min(40, Math.max(state.rooms, adults + d));
        if (b.dataset.gp === "kids") state.kids = Math.min(10, Math.max(0, state.kids + d));
        if (b.dataset.gp === "rooms") state.rooms = Math.min(10, adults, Math.max(1, state.rooms + d));
        $("#fGuests").value = adults + state.kids;
        readSearch(); guestsText(); render();
        return;
      }
      if (e.target.closest("#gpDone")) { show(false); btn.focus(); }
    });
    pop.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); show(false); btn.focus(); } });
    document.addEventListener("pointerdown", (e) => { if (!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) show(false); });
    guestsText();
  }

  // ---------- date pickers ----------
  const spanText = (type, f, t) => { const n = daysBetween(f, t) + (type === "venue" ? 1 : 0); return `${fmtDate(f)} – ${fmtDate(t)} · ${n} ${TYPES[type].noun}`; };
  function initDatePickers() {
    if (!window.BRON_PICKER) return;
    const hint = (type, end) => nightly({ type }) ? (end ? "Ketish sanasini tanlang" : "Kelish sanasini tanlang") : (end ? "Oxirgi kunni tanlang" : "Birinchi kunni tanlang");
    BRON_PICKER.range({ from: $("#fFrom"), to: $("#fTo"), single: () => state.type === "tour", minSpan: () => nightly({ type: state.type }) ? 1 : 0,
      span: (f, t) => spanText(state.type, f, t), fromHint: () => hint(state.type, false), toHint: () => hint(state.type, true) });
    const it = () => state.current || { type: "hotel" };
    BRON_PICKER.range({ from: $("#bFrom"), to: $("#bTo"), single: () => it().type === "tour" || it().type === "transport", minSpan: () => nightly(it()) ? 1 : 0,
      span: (f, t) => spanText(it().type, f, t), fromHint: () => hint(it().type, false), toHint: () => hint(it().type, true) });
    $("#fTo").addEventListener("change", readSearch);
  }

  function initExtras() {
    document.addEventListener("change", (e) => { const c = e.target.closest("[data-cmp]"); if (c) toggleCmp(c); });
    $("#curSel").addEventListener("change", (e) => { CUR = e.target.value; keep("bron.cur", CUR); rerenderPrices(); });
    $("#dShare").addEventListener("click", async () => {
      const x = state.current; if (!x) return;
      const url = location.href.split("#")[0] + "#joy=" + x.id;
      try {
        if (navigator.share) await navigator.share({ title: x.name, text: `${x.name}, ${x.city} · bron.uz`, url });
        else { await navigator.clipboard.writeText(url); toast("Havola nusxalandi."); }
      } catch (e) { /* cancelled */ }
    });
  }
  function init() {
    initExtras();
    initDatePickers();
    const start = addDays(new Date(), 7);
    $("#fFrom").value = iso(start);
    $("#fTo").value = iso(addDays(start, 2));
    $("#fFrom").min = $("#fTo").min = $("#bFrom").min = $("#bTo").min = todayIso();

    heroArt();
    heroPhoto();
    initGuestsPicker();
    initAuth();
    initApp();
    renderCities();
    renderSights(); sightPhotos();
    renderDeals();
    renderVenues();
    renderPackages();
    renderCats();
    heroCount();
    $("#favCount").textContent = favs.size;

    $$(".tab").forEach((b) => b.addEventListener("click", () => setType(b.dataset.type)));
    $$("[data-nav]").forEach((a) => a.addEventListener("click", () => setType(a.dataset.nav)));
    $("#qMode").addEventListener("change", fillQuickPlaces);
    $("#qFrom").addEventListener("change", fillQuickPlaces);
    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!$("#fieldsTr").hidden) return searchQuickTransport();
      readSearch();
      if (!validateSearch()) return;
      render(); loadBusy(); $("#natijalar").scrollIntoView({ block: "start" });
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
    $("#osmOn").addEventListener("change", () => { initMap().then(() => { if ($("#osmOn").checked && map.getZoom() < 10) $("#osmMsg").textContent = "Ko'rish uchun shaharni yaqinlashtiring (yoki shahar belgisini bosing)."; else loadOsm(); }); });
    $("#mapTypes").addEventListener("click", (e) => { const b = e.target.closest("[data-mt]"); if (!b) return; state.mapType = b.dataset.mt; renderMapMarkers(); });
    $("#mapSide").addEventListener("click", (e) => { const b = e.target.closest("[data-mapgo]"); if (b) showOnMap(b.dataset.mapgo, true); });
    $("#dMap").addEventListener("click", () => { const id = state.current.id; closeDlg($("#detailDlg")); showOnMap(id); });
    // partners
    $("#pfCity").innerHTML = placeOptions(CITIES.map((c) => c.name), "Toshkent");
    $("#regChips").addEventListener("click", (e) => { const b = e.target.closest("[data-region]"); if (!b) return; state.region = b.dataset.region; state.allCities = false; renderCities(); });
    $("#allCities").addEventListener("click", () => { state.allCities = true; renderCities(); });
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
      if (t.closest("#cmpGo")) { openCompare(); return; }
      if (t.closest("#cmpClear")) { cmp.clear(); renderCmpBar(); render(); return; }
      const open = t.closest("[data-open]"); if (open) { openDetail(open.dataset.open); return; }
      const book = t.closest("[data-book]"); if (book) { openBooking(book.dataset.book, book.dataset.cls); return; }
      const sc = t.closest("[data-sight-city]"); if (sc) { sightCity = sc.dataset.sightCity; renderSights(); return; }
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
    ["#bFrom", "#bTo", "#bGuests", "#bRoom", "#bRooms"].forEach((s) => $(s).addEventListener("input", updateTotal));
    $("#bookForm").addEventListener("submit", submitBooking);
    $("#doneCopy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(lastDone.code); } catch (e) { /* no clipboard */ } toast(T("Bron raqami nusxalandi") + ": " + lastDone.code); });
    $("#doneIcs").addEventListener("click", () => lastDone && downloadIcs(lastDone));
    $("#donePrint").addEventListener("click", () => window.print());
    $("#myList").addEventListener("click", (e) => { const b = e.target.closest("[data-ics]"); if (!b) return; const bk = myBookings().find((x) => x.code === b.dataset.ics); if (bk) downloadIcs(bk); });
    $("#miceForm").addEventListener("submit", submitMice);
    $("#reviewForm").addEventListener("submit", submitReview);
    $("#rvRate").addEventListener("click", (e) => { const b = e.target.closest("[data-rate]"); if (!b) return; reviewRate = +b.dataset.rate; $$("#rvRate [data-rate]").forEach((x) => x.setAttribute("aria-checked", String(x === b))); });
    $("#myList").addEventListener("click", (e) => { const b = e.target.closest("[data-review]"); if (b) openReview(b.dataset.review); });

    buildFilters();
    readSearch();
    render();
    renderMine();
    renderRecent();
    openFromHash();
    loadListings().finally(loadRates);
    wikiPhotos(() => { renderCities(); render(); renderDeals(); renderRecent(); renderVenues(); });
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
  async function register(name, phone, pass, code) {
    if (API) return authRequest("/api/auth/register", { name, phone, password: pass, code });
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

  // Modes: login, register, reset (new password by SMS code; only when the server sends SMS).
  function setAuthMode(mode) {
    authMode = mode;
    $$("#authDlg .seg-b").forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
    const reg = mode === "register", reset = mode === "reset";
    $("#aNameWrap").hidden = !reg;
    $("#aPass2Wrap").hidden = !reg && !reset;
    $("#aCodeWrap").hidden = !(API && CFG.sms && (reg || reset));
    $("#aAgreeWrap").hidden = !reg;
    $("#aForgot").hidden = !(API && CFG.sms && mode === "login");
    $("#authTitle").textContent = reg ? "Ro'yxatdan o'tish" : reset ? "Parolni tiklash" : "Kirish";
    $("#authSubmit").textContent = reg ? "Hisob yaratish" : reset ? "Yangi parolni saqlash" : "Kirish";
    $("#aPassLabel").textContent = reset ? "Yangi parol" : "Parol";
    $("#aPass").autocomplete = reg || reset ? "new-password" : "current-password";
    $("#authMsg").textContent = "";
  }
  async function sendCode() {
    const msg = $("#authMsg"), phone = normPhone($("#aPhone").value.trim());
    msg.className = "form-msg err";
    if (!validPhone(phone)) { msg.textContent = "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67."; $("#aPhone").focus(); return; }
    const btn = $("#aSendCode"); btn.disabled = true;
    try {
      await api("/api/auth/otp", { phone, purpose: authMode === "reset" ? "reset" : "register" });
      msg.className = "form-msg ok"; msg.textContent = "Kod SMS orqali yuborildi. U 5 daqiqa amal qiladi.";
      $("#aCode").focus();
      let left = 60;
      const tick = () => { btn.textContent = left > 0 ? `Qayta yuborish (${left})` : "Qayta yuborish"; if (left-- > 0) setTimeout(tick, 1000); else btn.disabled = false; };
      tick();
    } catch (err) { msg.textContent = err.message; btn.disabled = false; }
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
    if (!validPhone(phone)) { msg.textContent = "Telefon raqamini xalqaro ko'rinishda yozing, masalan +998 90 123 45 67."; return; }
    if (pass.length < 8) { msg.textContent = "Parol kamida 8 belgidan iborat bo'lsin."; return; }
    if ((authMode === "register" || authMode === "reset") && pass !== $("#aPass2").value) { msg.textContent = "Parollar bir xil emas."; return; }
    const code = $("#aCode").value.trim();
    if (!$("#aCodeWrap").hidden && !/^\d{6}$/.test(code)) { msg.textContent = "SMS orqali kelgan 6 xonali kodni kiriting."; $("#aCode").focus(); return; }
    if (authMode === "register" && !$("#aAgree").checked) { msg.textContent = "Ro'yxatdan o'tish uchun oferta va maxfiylik siyosatiga rozilik bering."; return; }
    const btn = $("#authSubmit"); btn.disabled = true;
    try {
      if (authMode === "reset") await api("/api/auth/reset", { phone, code, password: pass });
      const u = authMode === "register" ? await register(name, phone, pass, code) : await login(phone, pass);
      claimGuestBookings(u);
      await setUser({ name: u.name, phone: u.phone });
      closeDlg($("#authDlg"));
      $("#authForm").reset();
      toast(authMode === "register" ? `Xush kelibsiz, ${u.name.split(" ")[0]}! Hisob yaratildi.` : authMode === "reset" ? "Parol yangilandi." : `Xush kelibsiz, ${u.name.split(" ")[0]}!`);
    } catch (err) { msg.textContent = err.message; }
    finally { btn.disabled = false; }
  }
  function initAuth() {
    $("#authBtn").addEventListener("click", () => openAuth());
    $("#tabProfile").addEventListener("click", () => openAuth());
    $$("#authDlg .seg-b").forEach((b) => b.addEventListener("click", () => setAuthMode(b.dataset.mode)));
    $("#authForm").addEventListener("submit", submitAuth);
    $("#aSendCode").addEventListener("click", sendCode);
    $("#aForgot").addEventListener("click", () => { setAuthMode("reset"); $("#aPhone").focus(); });
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
      const guestsDone = refreshGuestBookings();
      fetch("/api/config").then((r) => r.ok ? r.json() : null).then((c) => { if (c) CFG = c; }).catch(() => {});
      countVisit();
      // A review link from the bot (#sharh=BRN-…) opens the review form once the bookings are known.
      Promise.all([restoreUser(), guestsDone]).then(() => {
        const rv = /^#sharh=(BRN-[A-Z0-9]{6})$/.exec(location.hash);
        if (!rv) return;
        const b = myBookings().find((x) => x.code === rv[1]);
        if (b && canReview(b)) openReview(b.code);
        else { $("#bronlarim").scrollIntoView({ block: "start" }); toast("Sharh qoldirish uchun bron qilgan hisobingizga kiring yoki bron qilgan qurilmangizdan oching."); }
      });
      $("#sampleNote").hidden = !rows.some((x) => x.sample);
      buildFilters(); render(); renderDeals(); renderCities(); heroCount(); renderVenues(); renderPackages(); renderCats(); renderMapMarkers(); renderRecent();
      // A shared link to a place that exists only in the database can open now.
      if (/^#joy=/.test(location.hash) && !$("#detailDlg").open) openFromHash();
    } catch (e) { /* static hosting: keep sample data */ }
  }

  init();
})();
