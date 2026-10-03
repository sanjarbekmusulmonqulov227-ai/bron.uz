// bron.uz front-end: illustrated listings, search and filters, detail and booking dialogs, favourites.
// With server.js running, listings and bookings go through /api. Opened as a static site
// (GitHub Pages, a plain file or a preview) it uses the sample data in data.js and localStorage.
(function () {
  "use strict";

  let LISTINGS = (window.BRON_LISTINGS || []).slice();
  const CITIES = window.BRON_CITIES || [];

  const TYPES = {
    hotel: { title: "Mehmonxonalar", kind: "Mehmonxona", unit: "1 kecha", from: "Kelish", to: "Ketish", guests: "Mehmonlar", noun: "kecha" },
    venue: { title: "Konferens-zallar", kind: "Zal", unit: "1 kun", from: "Boshlanish", to: "Tugash", guests: "Qatnashchilar", noun: "kun" },
    tour:  { title: "Turlar va ekskursiyalar", kind: "Tur", unit: "1 kishi", from: "Sana", to: "Qaytish", guests: "Kishilar", noun: "kishi" }
  };

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
    transport: ["Transport", "M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11M5 17h14M5 11h14M8 17v3M16 17v3"]
  };
  const AMEN_FILTER = {
    hotel: ["wifi", "breakfast", "pool", "spa", "parking", "transfer", "family"],
    venue: ["translation", "screen", "coffee", "parking", "wifi"],
    tour: ["guide", "transport", "meal", "tickets"]
  };

  const STORE_KEY = "bronuz.bookings";
  const FAV_KEY = "bronuz.favs";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const state = { type: "hotel", city: "", from: "", to: "", guests: 2, sort: "rec", maxPct: 100, stars: new Set(), amen: new Set(), free: false, deals: false, favOnly: false, current: null, room: "standart" };
  let API = false;

  // ---------- helpers ----------
  const som = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  const short = (n) => n >= 1e6 ? (Math.round(n / 1e5) / 10).toString().replace(".", ",") + " mln" : Math.round(n / 1000) + " ming";
  const iso = (d) => d.toISOString().slice(0, 10);
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
    const own = x.photo ? [{ url: x.photo, title: x.name }] : [];
    const list = PHOTOS[x.city] || [];
    const k = list.length ? hashOf(x.id) % list.length : 0;
    return own.concat(list.slice(k), list.slice(0, k));
  }
  const srcOf = (p, w) => p.url || photoUrl(p.file, w);
  const imgTag = (p, w) => p ? `<img class="ph" data-ph loading="lazy" decoding="async" alt="" src="${esc(srcOf(p, w))}">` : "";
  document.addEventListener("load", (e) => { if (e.target.matches && e.target.matches("img[data-ph]")) e.target.classList.add("ready"); }, true);
  document.addEventListener("error", (e) => { if (e.target.matches && e.target.matches("img[data-ph]")) e.target.remove(); }, true);

  function heroPhoto() {
    const p = (PHOTOS["Samarqand"] || [])[1];
    if (!p) return;
    const im = new Image();
    im.onload = () => { const el = $("#heroPhoto"); el.style.backgroundImage = `url("${im.src}")`; el.classList.add("ready"); $("#phonePhoto").style.backgroundImage = `url("${im.src}")`; };
    im.src = photoUrl(p.file, 1600);
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
    const p = unitPrice(item, roomId);
    if (item.type === "tour") return { label: `${som(p)} × ${guests} ${t.noun}`, sum: p * guests };
    const n = Math.max(1, daysBetween(from, to) + (item.type === "venue" ? 1 : 0));
    return { label: `${som(p)} × ${n} ${t.noun}`, sum: p * n };
  }
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
    buildFilters();
    readSearch();
    render();
  }

  function buildFilters() {
    $("#starsGroup").hidden = state.type !== "hotel";
    $("#fStars").innerHTML = [5, 4, 3, 2].map((n) => `<button type="button" class="chip" data-star="${n}" aria-pressed="${state.stars.has(n)}">${n} ★</button>`).join("");
    $("#fAmen").innerHTML = AMEN_FILTER[state.type].map((k) => `<label class="check"><input type="checkbox" data-amen="${k}"${state.amen.has(k) ? " checked" : ""}> <span>${AMEN[k][0]}</span></label>`).join("");
    $("#fPrice").value = state.maxPct;
    $("#priceUnit").textContent = `${TYPES[state.type].unit} uchun`;
    updatePriceOut();
  }
  function updatePriceOut() { const cap = priceCap(); $("#priceOut").textContent = cap === Infinity ? "Istalgan" : `${short(cap)} gacha`; }

  function readSearch() {
    state.city = $("#fCity").value;
    state.from = $("#fFrom").value;
    state.to = $("#fTo").value;
    state.guests = Math.max(1, parseInt($("#fGuests").value, 10) || 1);
    state.sort = $("#fSort").value;
  }

  function validateSearch() {
    const msg = $("#searchMsg");
    msg.className = "form-msg"; msg.textContent = "";
    const t = TYPES[state.type];
    const fail = (s) => { msg.textContent = s; msg.classList.add("err"); return false; };
    if (!state.from) return fail("Sanani tanlang.");
    if (state.from < iso(new Date())) return fail("O'tgan sanani tanlab bo'lmaydi. Bugungi yoki keyingi kunni tanlang.");
    if (state.type !== "tour" && state.to < state.from) return fail(`"${t.to}" sanasi "${t.from}" sanasidan keyin bo'lishi kerak.`);
    if (state.type === "hotel" && state.to === state.from) return fail("Mehmonxona uchun kamida 1 kecha tanlang.");
    return true;
  }

  function results() {
    const cap = priceCap();
    const need = state.type === "hotel" ? Math.min(state.guests, 6) : state.guests;
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
    const cap = x.type === "hotel" ? `${x.capacity} kishigacha` : x.type === "venue" ? `${x.capacity} o'rin` : `Guruh ${x.capacity} kishigacha`;
    const off = x.old ? Math.round((1 - x.price / x.old) * 100) : 0;
    const am = (x.amenities || []).slice(0, 4);
    return `
    <article class="item">
      <div style="position:relative">
        <button class="thumb" type="button" data-open="${esc(x.id)}" aria-label="${esc(x.name)}: batafsil">${art(x.art, x.hue, x.id)}${imgTag(photosFor(x)[0], 640)}<span class="kind">${t.kind} · ${esc(x.city)}</span>${off ? `<span class="badge">−${off}%</span>` : ""}${photosFor(x)[0] ? `<span class="place">${esc(photosFor(x)[0].title)}</span>` : ""}</button>
        <button class="fav" type="button" data-fav="${esc(x.id)}" aria-pressed="${favs.has(x.id)}" aria-label="Sevimlilarga qo'shish">${heart}</button>
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
    $$(".city").forEach((c) => c.classList.toggle("is-on", c.dataset.city === state.city));
    $("#grid").innerHTML = list.length ? list.map(card).join("")
      : `<div class="empty"><b>Bu shartlar bo'yicha joy topilmadi</b><span>Filtrlarni yumshating yoki boshqa shaharni tanlang.</span><button class="btn btn-line" type="button" data-reset>Filtrlarni tozalash</button></div>`;
  }

  function renderCities() {
    $("#fCity").insertAdjacentHTML("beforeend", CITIES.map((c) => `<option>${esc(c.name)}</option>`).join(""));
    $("#cities").innerHTML = CITIES.map((c) => {
      const n = LISTINGS.filter((x) => x.city === c.name).length;
      return `<button class="city" type="button" data-city="${esc(c.name)}">${art(c.art, c.hue, "city" + c.name)}${imgTag((PHOTOS[c.name] || [])[0], 640)}<span class="c-count">${n} ta joy</span><span class="c-txt"><b>${esc(c.name)}</b><small>${esc(c.note)}</small></span></button>`;
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

  // ---------- favourites ----------
  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    keep(FAV_KEY, [...favs]);
    $("#favCount").textContent = favs.size;
    $$(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => b.setAttribute("aria-pressed", String(favs.has(id))));
    if (state.favOnly) render();
  }

  // ---------- dialogs ----------
  const openDlg = (d) => { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); };
  const closeDlg = (d) => { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); };

  function openDetail(id) {
    const x = LISTINGS.find((y) => y.id === id);
    if (!x) return;
    state.current = x;
    state.room = "standart";
    const t = TYPES[x.type];
    const ps = photosFor(x);
    $("#dArt").className = "gallery";
    $("#dArt").innerHTML = art(x.art, x.hue, x.id + "big") + (ps.length ? `<div class="g-track" id="gTrack">${ps.map((p) => `<div class="g-slide"><img data-ph class="ph" alt="${esc(p.title)}" src="${esc(srcOf(p, 1200))}"><span class="g-cap">${esc(p.title)}${p.file ? `<a href="${filePage(p.file)}" target="_blank" rel="noopener">© Wikimedia Commons</a>` : ""}</span></div>`).join("")}</div>${ps.length > 1 ? `<button class="g-nav g-prev" type="button" data-g="-1" aria-label="Oldingi surat">‹</button><button class="g-nav g-next" type="button" data-g="1" aria-label="Keyingi surat">›</button>` : ""}` : "");
    $("#dKind").textContent = `${t.kind} · ${x.city}`;
    $("#dTitle").textContent = x.name;
    $("#dMeta").textContent = `${x.stars ? starStr(x.stars) + " · " : ""}${x.district || x.city} · ${Number(x.rating).toFixed(1)} ${ratingWord(x.rating)} (${x.reviews} sharh)`;
    $("#dDesc").textContent = x.desc || "";
    $("#dAmen").innerHTML = (x.amenities || []).map((k) => AMEN[k] ? `<span>${icon(k)}${AMEN[k][0]}</span>` : "").join("") + (x.free ? `<span>${icon("tickets")}Bepul bekor qilish</span>` : "");
    $("#dRooms").innerHTML = x.type === "hotel" ? `<div class="rooms" role="radiogroup" aria-label="Xona turi">${ROOMS.map((r, i) => `<label class="room"><input type="radio" name="room" value="${r.id}"${i === 0 ? " checked" : ""}><span><b>${r.name}</b> · ${x.capacity + r.extra} kishigacha</span><b>${som(unitPrice(x, r.id))}</b><small>${r.note}</small></label>`).join("")}</div>` : "";
    updateDetailPrice();
    openDlg($("#detailDlg"));
  }
  function updateDetailPrice() {
    const x = state.current;
    $("#dPrice").innerHTML = `${x.old && state.room === "standart" ? `<s>${som(x.old)}</s>` : ""}<b>${som(unitPrice(x, state.room))}</b><small>${TYPES[x.type].unit}</small>`;
  }

  function openBooking(id, roomId) {
    const item = LISTINGS.find((x) => x.id === id);
    if (!item) return;
    state.current = item;
    state.room = roomId || "standart";
    const t = TYPES[item.type];
    $("#dlgTitle").textContent = item.name;
    $("#dlgCity").textContent = `${t.kind} · ${item.city}`;
    $("#bFromLabel").textContent = t.from;
    $("#bToLabel").textContent = t.to;
    $("#bGuestsLabel").textContent = t.guests;
    $("#bToWrap").hidden = item.type === "tour";
    $("#bRoomWrap").hidden = item.type !== "hotel";
    $("#bRoom").innerHTML = ROOMS.map((r) => `<option value="${r.id}"${r.id === state.room ? " selected" : ""}>${r.name} · ${som(unitPrice(item, r.id))}</option>`).join("");
    $("#bFrom").value = state.from;
    $("#bTo").value = state.to;
    $("#bGuests").value = Math.min(state.guests, capOf(item));
    $("#bGuests").max = capOf(item);
    $("#bookMsg").textContent = ""; $("#bookMsg").className = "form-msg";
    updateTotal();
    openDlg($("#bookDlg"));
    if (user) { if (!$("#bName").value) $("#bName").value = user.name; if (!$("#bPhone").value) $("#bPhone").value = user.phone; }
    setTimeout(() => (user ? $("#bFrom") : $("#bName")).focus(), 30);
  }
  const capOf = (item) => item.capacity + (item.type === "hotel" ? roomOf(item, state.room).extra : 0);

  function updateTotal() {
    const item = state.current;
    if (!item) return;
    state.room = $("#bRoom").value || "standart";
    $("#bGuests").max = capOf(item);
    const from = $("#bFrom").value, to = $("#bTo").value;
    const guests = Math.max(1, parseInt($("#bGuests").value, 10) || 1);
    const q = quote(item, from, to || from, guests, state.room);
    $("#totalCalc").textContent = q.label;
    $("#totalSum").textContent = som(q.sum);
  }

  async function submitBooking(e) {
    e.preventDefault();
    const item = state.current;
    const msg = $("#bookMsg");
    msg.className = "form-msg err";
    const name = $("#bName").value.trim();
    const phone = $("#bPhone").value.trim();
    const from = $("#bFrom").value;
    const to = item.type === "tour" ? from : $("#bTo").value;
    const guests = parseInt($("#bGuests").value, 10) || 0;
    const room = item.type === "hotel" ? state.room : undefined;
    ["#bName", "#bPhone"].forEach((s) => $(s).removeAttribute("aria-invalid"));

    if (name.length < 3) { $("#bName").setAttribute("aria-invalid", "true"); msg.textContent = "Ism familiyangizni kiriting."; return; }
    if (!validPhone(phone)) { $("#bPhone").setAttribute("aria-invalid", "true"); msg.textContent = "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing."; return; }
    if (!from || from < iso(new Date())) { msg.textContent = "Bugungi yoki keyingi sanani tanlang."; return; }
    if (item.type === "hotel" && !(to > from)) { msg.textContent = "Ketish sanasi kelish sanasidan keyin bo'lishi kerak."; return; }
    if (item.type === "venue" && to < from) { msg.textContent = "Tugash sanasi boshlanish sanasidan oldin bo'lmasin."; return; }
    if (guests < 1 || guests > capOf(item)) { msg.textContent = `Bu tanlov ${capOf(item)} kishigacha qabul qiladi.`; return; }

    const pay = $("#bPay").value, note = $("#bNote").value.trim();
    let booking;
    if (API) {
      const btn = $("#bookForm button[type=submit]");
      btn.disabled = true;
      try {
        const r = await api("/api/bookings", { listingId: item.id, from, to, guests, client: name, phone, pay, note, room });
        booking = { code: r.code, id: item.id, name: r.name, city: r.city, type: r.type, from: r.from, to: r.to, guests: r.guests, sum: r.sum, phone: normPhone(phone) };
      } catch (err) { msg.textContent = err.message; return; }
      finally { btn.disabled = false; }
    } else {
      const code = "BRN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      booking = { code, id: item.id, name: item.name, city: item.city, type: item.type, from, to, guests, sum: quote(item, from, to, guests, room).sum, phone: normPhone(phone) };
    }
    if (user) booking.owner = user.phone;
    saveBookings([booking, ...memoryBookings]);
    if (API && user) serverBookings = [booking, ...serverBookings];
    closeDlg($("#bookDlg"));
    $("#bookForm").reset();
    renderMine();
    toast(`Bron qabul qilindi. Raqamingiz: ${booking.code}`);
  }

  // ---------- my bookings ----------
  function myBookings() {
    if (API && user) return serverBookings;
    return memoryBookings.filter((b) => user ? b.owner === user.phone : !b.owner);
  }
  function renderMine() {
    const list = myBookings();
    $("#myCount").textContent = list.length;
    if (!list.length) {
      $("#myList").innerHTML = `<p class="mine-empty">Hali bron yo'q. Yuqoridan joy tanlab "Bron qilish" tugmasini bosing, bron shu yerda paydo bo'ladi.</p>`;
      return;
    }
    $("#myList").innerHTML = list.map((b) => {
      const dates = b.type === "tour" || b.from === b.to ? fmtDate(b.from) : `${fmtDate(b.from)} – ${fmtDate(b.to)}`;
      return `
      <div class="booking">
        <span class="code">${esc(b.code)}</span>
        <div class="grow"><b>${esc(b.name)}</b><span class="muted">${esc(b.city)} · ${dates} · ${b.guests} kishi</span></div>
        <span class="sum">${som(b.sum)}</span>
        <button class="btn btn-line" type="button" data-cancel="${esc(b.code)}">Bekor qilish</button>
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
    if (!validPhone($("#mPhone").value)) { msg.textContent = "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing."; return; }
    if (API) {
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

  // ---------- wiring ----------
  function init() {
    const start = addDays(new Date(), 7);
    $("#fFrom").value = iso(start);
    $("#fTo").value = iso(addDays(start, 2));
    $("#fFrom").min = $("#fTo").min = $("#bFrom").min = $("#bTo").min = iso(new Date());

    heroArt();
    heroPhoto();
    initAuth();
    initApp();
    renderCities();
    renderDeals();
    $(".hero .eyebrow").textContent = `${CITIES.length} shahar · ${LISTINGS.length} joy · narxlar so'mda`;
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
    $("#fFrom").addEventListener("change", () => { if ($("#fTo").value <= $("#fFrom").value) $("#fTo").value = iso(addDays(new Date($("#fFrom").value), 1)); readSearch(); });
    $("#fGuests").addEventListener("change", () => { readSearch(); render(); });

    $("#fPrice").addEventListener("input", (e) => { state.maxPct = +e.target.value; updatePriceOut(); render(); });
    $("#fStars").addEventListener("click", (e) => { const b = e.target.closest("[data-star]"); if (!b) return; const n = +b.dataset.star; state.stars.has(n) ? state.stars.delete(n) : state.stars.add(n); b.setAttribute("aria-pressed", String(state.stars.has(n))); render(); });
    $("#fAmen").addEventListener("change", (e) => { const k = e.target.dataset.amen; if (!k) return; e.target.checked ? state.amen.add(k) : state.amen.delete(k); render(); });
    $("#fFree").addEventListener("change", (e) => { state.free = e.target.checked; render(); });
    $("#fDeals").addEventListener("change", (e) => { state.deals = e.target.checked; render(); });
    $("#fFav").addEventListener("change", (e) => { state.favOnly = e.target.checked; render(); });
    $("#fReset").addEventListener("click", resetFilters);
    $("#filterToggle").addEventListener("click", (e) => { const f = $("#filters"); const open = !f.classList.contains("open"); f.classList.toggle("open", open); e.currentTarget.setAttribute("aria-expanded", String(open)); });
    $("#favBtn").addEventListener("click", () => { state.favOnly = true; $("#fFav").checked = true; render(); $("#natijalar").scrollIntoView({ block: "start" }); });

    document.addEventListener("click", (e) => {
      const t = e.target;
      const fav = t.closest("[data-fav]"); if (fav) { toggleFav(fav.dataset.fav); return; }
      const open = t.closest("[data-open]"); if (open) { openDetail(open.dataset.open); return; }
      const book = t.closest("[data-book]"); if (book) { openBooking(book.dataset.book); return; }
      const city = t.closest("[data-city]");
      if (city) { const c = city.dataset.city === state.city ? "" : city.dataset.city; $("#fCity").value = c; readSearch(); render(); $("#natijalar").scrollIntoView({ block: "start" }); return; }
      if (t.closest("[data-reset]")) { resetFilters(); return; }
      const g = t.closest("[data-g]"); if (g) { const tr = $("#gTrack"); if (tr) tr.scrollBy({ left: tr.clientWidth * +g.dataset.g, behavior: "smooth" }); return; }
      const close = t.closest("[data-close]"); if (close) closeDlg(close.closest("dialog"));
    });
    $$("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) closeDlg(d); }));

    $("#dRooms").addEventListener("change", (e) => { if (e.target.name === "room") { state.room = e.target.value; updateDetailPrice(); } });
    $("#dBook").addEventListener("click", () => { const id = state.current.id, room = state.room; closeDlg($("#detailDlg")); openBooking(id, room); });

    $("#myList").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-cancel]");
      if (!b) return;
      const bk = memoryBookings.find((x) => x.code === b.dataset.cancel);
      if (API && bk) {
        try { await api(`/api/bookings/${encodeURIComponent(bk.code)}/cancel`, { phone: bk.phone }); }
        catch (err) { toast(err.message); return; }
      }
      saveBookings(memoryBookings.filter((x) => x.code !== b.dataset.cancel));
      renderMine();
      toast("Bron bekor qilindi.");
    });

    ["#bFrom", "#bTo", "#bGuests", "#bRoom"].forEach((s) => $(s).addEventListener("input", updateTotal));
    $("#bookForm").addEventListener("submit", submitBooking);
    $("#miceForm").addEventListener("submit", submitMice);

    buildFilters();
    readSearch();
    render();
    renderMine();
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
      try { const r = await fetch("/api/auth/me", { credentials: "same-origin" }); if (r.ok) return setUser(await r.json()); } catch (e) { /* offline */ }
      return setUser(null);
    }
    const phone = store(SESSION_KEY, null);
    const u = phone && store(USERS_KEY, {})[phone];
    setUser(u ? { name: u.name, phone } : null);
  }

  function setAuthMode(mode) {
    authMode = mode;
    $$(".seg-b").forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
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
    $("#pBookings").textContent = myBookings().length;
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
    $$(".seg-b").forEach((b) => b.addEventListener("click", () => setAuthMode(b.dataset.mode)));
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
      render(); renderDeals();
    } catch (e) { /* static hosting: keep sample data */ }
  }

  init();
})();
