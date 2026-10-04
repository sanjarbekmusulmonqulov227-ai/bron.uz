// Builds the static pages search engines can read: one page per city and per place, the city index,
// the legal pages, sitemap.xml and robots.txt. Run after changing public/data.js:
//   SITE_URL=https://bron.uz node tools/build-pages.js
// Company details for the legal pages come from tools/company.json (copy company.example.json and fill it in).
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");
const SITE = (process.env.SITE_URL || "https://sanjarbekmusulmonqulov227-ai.github.io/bron.uz").replace(/\/$/, "");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(PUB, "data.js"), "utf8"), ctx);
vm.runInNewContext(fs.readFileSync(path.join(PUB, "sights.js"), "utf8"), ctx);
const W = ctx.window;
const companyFile = path.join(__dirname, "company.json");
const CO = fs.existsSync(companyFile) ? JSON.parse(fs.readFileSync(companyFile, "utf8")) : {};
const filled = !!(CO.name && CO.inn);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = (s) => s.toLowerCase().replace(/[ʻʼ'`’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
const TYPE = { hotel: ["Mehmonxona", "Mehmonxonalar", "1 kecha"], hostel: ["Hostel", "Hostellar", "1 o'rin, 1 kecha"], venue: ["Konferens-zal", "Konferens-zallar", "1 kun"], tour: ["Tur", "Tur paketlari", "1 kishi"] };
const LD = { hotel: "Hotel", hostel: "Hostel", venue: "EventVenue", tour: "TouristTrip" };
const AMEN = { wifi: "Wi-Fi", breakfast: "Nonushta", pool: "Basseyn", spa: "Spa", gym: "Fitnes", parking: "Avtoturargoh", restaurant: "Restoran", transfer: "Transfer", ac: "Konditsioner", family: "Oilalar uchun",
  translation: "Sinxron tarjima", screen: "LED ekran", coffee: "Kofe-breyk", stage: "Sahna", guide: "Gid", tickets: "Chiptalar kiradi", meal: "Ovqat kiradi", hotel: "Mehmonxona", train: "Poyezd chiptasi", kitchen: "Umumiy oshxona", laundry: "Kir yuvish", transport: "Transport" };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";

function page({ file, title, desc, body, ld, depth = 0, index = true }) {
  const up = "../".repeat(depth);
  const url = `${SITE}/${file}`;
  return `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  ${index ? "" : '<meta name="robots" content="noindex">\n  '}<link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="website"><meta property="og:site_name" content="bron.uz"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${SITE}/icons/icon-512.png">
  <meta name="theme-color" content="#15306f">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Yeseva+One&family=Golos+Text:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="${up}styles.css">
  <link rel="icon" href="${up}icons/icon.svg" type="image/svg+xml">
  <script src="${up}i18n.js"></script>
  ${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body class="sp">
<header class="topbar">
  <div class="wrap topbar-in">
    <a class="logo" href="${up}./" aria-label="bron.uz"><svg class="logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 20 538 180" aria-hidden="true"><path d="M24.4 141.3V46.2H13.4V37.6H50V82.9Q53.2 76.9 58.7 74Q64.2 71.1 72.3 71.1Q88.7 71.1 98.1 81.9Q107.6 92.7 107.6 111.6Q107.6 130.4 98.1 141.3Q88.7 152.1 72.3 152.1Q64.2 152.1 58.7 149.2Q53.2 146.2 50 140.2V150H13.4V141.3ZM50 115.4Q50 128.8 53.4 134.8Q56.8 140.8 64.5 140.8Q72.4 140.8 75.6 134.5Q78.8 128.1 78.8 111.6Q78.8 95 75.6 88.7Q72.4 82.4 64.5 82.4Q56.8 82.4 53.4 88.4Q50 94.4 50 107.8ZM189 72.3V95.2H180.8Q180.4 89.1 177.5 86.1Q174.6 83.1 169.1 83.1Q160.7 83.1 155.9 90.5Q151 97.8 151 110.9V141.3H165V150H114.5V141.3H125.5V81.9H113.7V73.2H151V86.8Q154.8 78.8 161 75Q167.2 71.1 176.1 71.1Q178.4 71.1 181.6 71.4Q184.8 71.7 189 72.3ZM232.9 143.9Q241 143.9 244.3 137Q247.6 130.1 247.6 111.6Q247.6 93.1 244.3 86.2Q241.1 79.3 232.9 79.3Q224.7 79.3 221.4 86.2Q218.1 93.2 218.1 111.6Q218.1 129.9 221.4 136.9Q224.7 143.9 232.9 143.9ZM232.9 152.1Q212.6 152.1 201.1 141.3Q189.5 130.5 189.5 111.6Q189.5 92.5 201.1 81.8Q212.6 71.1 232.9 71.1Q253.3 71.1 264.8 81.8Q276.2 92.5 276.2 111.6Q276.2 130.5 264.7 141.3Q253.2 152.1 232.9 152.1ZM283.2 150V141.3H294.1V81.9H283.2V73.2H319.7V84Q324.4 77.2 330.3 74.1Q336.2 71.1 345.2 71.1Q358.2 71.1 364.8 78.7Q371.4 86.3 371.4 101.1V141.3H382.4V150H336.5V141.3H345.8V100.4Q345.8 90.7 343.3 86.9Q340.8 83.1 334.7 83.1Q327 83.1 323.3 88.8Q319.7 94.4 319.7 106.8V141.3H329.1V150Z" fill="currentColor"/><path d="M18 178q180 30 360 0" fill="none" stroke="#e0a21c" stroke-width="12" stroke-linecap="round"/><path d="M401.7 135.3H415.4V150H401.7ZM431.5 133.4V107.3H445.2V111.6Q445.2 115.1 445.2 120.3Q445.1 125.5 445.1 127.3Q445.1 132.4 445.4 134.7Q445.7 137 446.3 138Q447.2 139.3 448.5 140.1Q449.9 140.8 451.6 140.8Q455.9 140.8 458.3 137.5Q460.8 134.2 460.8 128.4V107.3H474.4V150H460.8V143.8Q457.7 147.6 454.2 149.3Q450.8 151.1 446.6 151.1Q439.2 151.1 435.4 146.6Q431.5 142 431.5 133.4ZM487.4 107.3H524.6V116.9L502.1 140.2H524.6V150H486.4V140.5L508.9 117.1H487.4Z" fill="#e0a21c"/></svg></a>
    <nav class="sp-nav"><a href="${up}turistlar.html">Turistlarga</a><a href="${up}shaharlar.html">Shaharlar</a><a href="${up}./#natijalar">Bron qilish</a></nav>
    <div class="top-actions"><div class="lang-sw" role="group" aria-label="Til"><button type="button" data-lang="uz" lang="uz">UZ</button><button type="button" data-lang="ru" lang="ru">RU</button><button type="button" data-lang="en" lang="en">EN</button></div></div>
  </div>
</header>
<div class="orn" aria-hidden="true"></div>
<main class="wrap sp-main">
${body}
</main>
<footer class="footer"><div class="wrap f-bottom"><span>© 2026 bron.uz</span><span><a href="${up}oferta.html">Ommaviy oferta</a> · <a href="${up}qoidalar.html">Bron va bekor qilish qoidalari</a> · <a href="${up}maxfiylik.html">Maxfiylik siyosati</a></span></div></footer>
</body>
</html>
`;
}

const out = [], noindex = new Set();
const write = (file, html, index = true) => { if (!index) noindex.add(file); fs.mkdirSync(path.dirname(path.join(PUB, file)), { recursive: true }); fs.writeFileSync(path.join(PUB, file), html); out.push(file); };
const cities = W.BRON_CITIES, listings = W.BRON_LISTINGS, regions = W.BRON_REGIONS, T = W.BRON_TRANSPORT;
const cityOf = Object.fromEntries(cities.map((c) => [c.name, c]));
const sampleNote = `<p class="sp-note">Namuna ma'lumot: joy nomlari, narxlar va reytinglar sayt dizaynini ko'rsatish uchun. Haqiqiy joylar hamkorlar ulangach qo'shiladi.</p>`;

// ---- places ----
for (const x of listings) {
  const c = cityOf[x.city] || { region: "" };
  const t = TYPE[x.type] || TYPE.hotel;
  const facts = [x.stars ? `${x.stars} yulduz` : "", x.type === "venue" ? `${x.capacity} kishigacha` : x.type === "tour" ? (x.days > 1 ? `${x.days} kun` : "1 kun") : `${x.capacity} kishigacha`, x.area ? `${x.area} m²` : ""].filter(Boolean);
  const same = listings.filter((y) => y.city === x.city && y.id !== x.id).slice(0, 6);
  const body = `<nav class="crumbs" aria-label="Yo'l"><a href="../shaharlar.html">Shaharlar</a> › <a href="../shahar/${slug(x.city)}.html">${esc(x.city)}</a> › <span>${esc(x.name)}</span></nav>
<article class="sp-card">
  <p class="eyebrow">${esc(t[0])} · ${esc(x.city)}${c.region ? ` · ${esc(c.region)}` : ""}</p>
  <h1>${esc(x.name)}</h1>
  <p class="muted">${esc(x.district || "")}${facts.length ? " · " + facts.map(esc).join(" · ") : ""}</p>
  <p>${esc(x.desc || "")}</p>
  ${(x.amenities || []).length ? `<ul class="sp-amen">${x.amenities.map((a) => `<li>${esc(AMEN[a] || a)}</li>`).join("")}</ul>` : ""}
  ${x.route ? `<p><b>Yo'nalish:</b> ${x.route.map(esc).join(" → ")}</p>` : ""}
  <p class="sp-price"><b>${som(x.price)}</b> <span class="muted">${esc(t[2])}</span></p>
  <a class="btn btn-gold" href="../#joy=${encodeURIComponent(x.id)}">Bron qilish</a>
</article>
${sampleNote}
${same.length ? `<h2 class="sp-h2">Shu shahardagi boshqa joylar</h2><ul class="sp-list">${same.map((y) => `<li><a href="${encodeURIComponent(y.id)}.html">${esc(y.name)}</a> <span class="muted">${esc((TYPE[y.type] || TYPE.hotel)[0])} · ${som(y.price)}</span></li>`).join("")}</ul>` : ""}`;
  const ld = { "@context": "https://schema.org", "@type": LD[x.type] || "LodgingBusiness", name: x.name, description: x.desc, url: `${SITE}/joy/${x.id}.html`,
    address: { "@type": "PostalAddress", addressLocality: x.city, addressRegion: c.region || undefined, addressCountry: "UZ" } };
  if (x.type === "hotel" && x.stars) ld.starRating = { "@type": "Rating", ratingValue: x.stars };
  if (x.type === "tour") delete ld.address;
  ld.priceRange = `${som(x.price)} dan`;
  // Every place in data.js is made up, so search engines are asked not to index these pages.
  write(`joy/${x.id}.html`, page({ file: `joy/${x.id}.html`, depth: 1, index: false, title: `${x.name}, ${x.city}: ${t[0].toLowerCase()} bron qilish | bron.uz`, desc: `${x.name} (${x.city}). ${(x.desc || "").slice(0, 120)} Narx ${som(x.price)} dan.`, body, ld }), false);
}

// ---- sights (real places; texts in sights.js, details on Wikipedia) ----
const SIGHTS = W.BRON_SIGHTS || [];
const wiki = (s) => `https://en.wikipedia.org/wiki/${encodeURIComponent(s.wiki.replace(/ /g, "_"))}`;
const sightsOf = (city) => { const l = SIGHTS.filter((s) => s.city === city); return l.length ? `<h2 class="sp-h2">Albatta ko'ring</h2><ul class="sp-list">${l.map((s) => `<li><a href="${wiki(s)}" target="_blank" rel="noopener"><b>${esc(s.uz[0])}</b></a>: ${esc(s.uz[1])}</li>`).join("")}</ul>` : ""; };

// ---- cities ----
for (const c of cities) {
  const here = listings.filter((x) => x.city === c.name);
  const groups = Object.keys(TYPE).map((k) => [k, here.filter((x) => x.type === k)]).filter(([, l]) => l.length);
  const fromHere = (mode) => [...new Set((T[mode] || []).filter((t) => t.from === c.name && t.to !== c.name).map((t) => t.to))];
  const avia = fromHere("avia"), rail = fromHere("poyezd");
  const body = `<nav class="crumbs" aria-label="Yo'l"><a href="../shaharlar.html">Shaharlar</a> › <span>${esc(c.region)}</span> › <span>${esc(c.name)}</span></nav>
<section class="sp-card">
  <p class="eyebrow">${esc(c.region)}</p>
  <h1>${esc(c.name)}: mehmonxona, zal va turlar</h1>
  <p>${esc(c.note)}.</p>
  <a class="btn btn-gold" href="../#natijalar">Saytda qidirish</a>
</section>
${groups.map(([k, l]) => `<h2 class="sp-h2">${esc(TYPE[k][1])}</h2><ul class="sp-list">${l.map((x) => `<li><a href="../joy/${encodeURIComponent(x.id)}.html">${esc(x.name)}</a> <span class="muted">${som(x.price)} · ${esc(TYPE[k][2])}</span></li>`).join("")}</ul>`).join("")}
${sightsOf(c.name)}
<h2 class="sp-h2">Qanday borish mumkin</h2>
<ul class="sp-list">
  ${avia.length ? `<li><b>Avia:</b> ${avia.map(esc).join(", ")}</li>` : ""}
  ${rail.length ? `<li><b>Poyezd:</b> ${rail.map(esc).join(", ")}</li>` : ""}
  <li><b>Haydovchili mashina:</b> istalgan shahardan</li>
</ul>
${sampleNote}`;
  const file = `shahar/${slug(c.name)}.html`;
  write(file, page({ file, depth: 1, title: `${c.name}: mehmonxonalar, konferens-zallar va turlar | bron.uz`, desc: `${c.name} (${c.region}): ${here.length} ta joy, narxlar so'mda. ${c.note}.`, body,
    ld: { "@context": "https://schema.org", "@type": "City", name: c.name, containedInPlace: { "@type": "AdministrativeArea", name: c.region }, url: `${SITE}/${file}` } }));
}

// ---- city index ----
write("shaharlar.html", page({ file: "shaharlar.html", title: "O'zbekiston shaharlari: mehmonxona va zallar | bron.uz", desc: "O'zbekistonning 14 hududi va barcha yirik shaharlarida mehmonxona, hostel, konferens-zal va turlar.",
  body: `<section class="sp-card"><h1>O'zbekiston shaharlari</h1><p>14 hudud, ${cities.length} ta shahar. Shaharni tanlang.</p></section>
<div class="sp-regions">${regions.map((r) => `<section><h2 class="sp-h2">${esc(r)}</h2><ul class="sp-list">${cities.filter((c) => c.region === r).map((c) => `<li><a href="shahar/${slug(c.name)}.html">${esc(c.name)}</a> <span class="muted">${listings.filter((x) => x.city === c.name).length} ta joy</span></li>`).join("")}</ul></section>`).join("")}</div>` }));


// ---- tourist guide ----
const TIPS = [
  ["Viza", "Ko'plab davlatlar fuqarolari O'zbekistonga 30 kungacha vizasiz keladi. Boshqalar uchun elektron viza bor: e-visa.gov.uz. Safardan oldin o'z davlatingiz uchun shartlarni rasmiy saytda tekshiring."],
  ["Ro'yxatdan o'tish", "Mehmonxona va hostellar chet ellik mehmonni o'zi ro'yxatdan o'tkazadi. Xususiy uyda tursangiz, mezbon sizni 3 kun ichida ro'yxatdan o'tkazishi kerak."],
  ["Pul", "Milliy valyuta so'm (UZS). Shaharlarda Visa va Mastercard kartalari ko'p joyda o'tadi, bankomatlar bor. Pulni bank yoki rasmiy ayirboshlash shoxobchasida almashtiring."],
  ["Aloqa", "SIM kartani Beeline, Ucell, Mobiuz yoki Uzmobile do'konidan pasport bilan olasiz. Mobil internet arzon va shaharlarda tez."],
  ["Shaharlar orasida", "Afrosiyob tezyurar poyezdi Toshkentdan Samarqandga taxminan 2 soatda, Buxoroga 4 soatda yetkazadi. Chiptalarni oldindan oling. Xiva va Nukusga samolyot yoki poyezd bilan borish qulay."],
  ["Shahar ichida", "Taksini ilova orqali chaqiring (Yandex Go, MyTaxi): narx oldindan ko'rinadi. Toshkentda metro arzon va qulay."],
  ["Qachon borish kerak", "Eng qulay payt bahor (aprel–may) va kuz (sentabr–oktabr). Yozda harorat 40 °C dan oshishi mumkin, qishda tog'larda chang'i mavsumi."],
  ["Odob", "Masjid va maqbaralarga yelka va tizzani yopadigan kiyimda kiring. Odamlarni suratga olishdan oldin ruxsat so'rang. Mehmondo'stlik qadrlanadi: choyga taklif qilishsa, bu odatiy hol."],
  ["Taom", "Albatta tatib ko'ring: palov, somsa, lag'mon, shashlik va tandir non. Bozorlarda quruq meva va shirinliklar arzon."],
  ["Favqulodda raqamlar", "Yong'in 101, militsiya 102, tez yordam 103."]
];
write("turistlar.html", page({ file: "turistlar.html", title: "O'zbekistonga sayohat: turistlar uchun maslahatlar | bron.uz", desc: "Viza, pul, aloqa, transport, ob-havo va odob: O'zbekistonga sayohatdan oldin bilish kerak bo'lgan asosiy ma'lumotlar.",
  body: `<section class="sp-card"><p class="eyebrow">Turistlar uchun</p><h1>O'zbekistonga sayohat</h1><p>Safardan oldin bilish kerak bo'lgan asosiy ma'lumotlar va eng mashhur obidalar.</p><a class="btn btn-gold" href="./#natijalar">Mehmonxona qidirish</a></section>
<div class="sp-tips">${TIPS.map(([h, p]) => `<section class="sp-tip"><h2 class="sp-h2">${esc(h)}</h2><p>${esc(p)}</p></section>`).join("")}</div>
<h2 class="sp-h2">Albatta ko'ring</h2>
<ul class="sp-list">${SIGHTS.map((s) => `<li><a href="${wiki(s)}" target="_blank" rel="noopener"><b>${esc(s.uz[0])}</b></a> <span class="muted">${esc(s.city)}</span>: ${esc(s.uz[1])}</li>`).join("")}</ul>
<p class="muted small">Viza va kirish qoidalari o'zgarib turadi: aniq ma'lumotni O'zbekiston Tashqi ishlar vazirligi va e-visa.gov.uz saytidan tekshiring.</p>`,
  ld: { "@context": "https://schema.org", "@type": "TravelAction", name: "O'zbekistonga sayohat", toLocation: { "@type": "Country", name: "Uzbekistan" } } }));

// ---- legal pages ----
const co = (k, fallback) => esc(CO[k] || fallback);
const reqs = filled ? `<ul class="sp-list"><li>${co("name")}</li><li>STIR (INN): ${co("inn")}</li>${CO.address ? `<li>Manzil: ${co("address")}</li>` : ""}${CO.phone ? `<li>Telefon: ${co("phone")}</li>` : ""}${CO.email ? `<li>E-pochta: ${co("email")}</li>` : ""}</ul>`
  : `<p class="sp-warn">Xizmat ko'rsatuvchining rekvizitlari (nomi, STIR, manzili, aloqa) hali kiritilmagan. Ular kiritilgunga qadar sayt namuna rejimida ishlaydi.</p>`;
const legalNote = `<p class="muted small">Rasmiy matn o'zbek tilida. Oxirgi tahrir: ${CO.date || "2026-yil oktabr"}.</p>`;
const legal = {
  "oferta.html": ["Ommaviy oferta", "bron.uz orqali mehmonxona, hostel, zal, tur va transport bron qilish shartlari.", `
<h2>1. Umumiy qoidalar</h2>
<p>Ushbu hujjat bron.uz xizmatining (keyingi o'rinlarda: Xizmat) foydalanuvchilarga qaratilgan ommaviy ofertasidir. Saytda bron so'rovini yuborish yoki hisob yaratish ushbu oferta shartlarini to'liq qabul qilishni (aksept) bildiradi.</p>
<p>Xizmat mehmonxona, hostel, konferens-zal, tur va transport (keyingi o'rinlarda: Hamkor) bilan mijozni bog'laydigan vositachi platformadir. Joylashtirish, tadbir yoki sayohat xizmatini Hamkor ko'rsatadi va uning sifati uchun Hamkor javob beradi.</p>
<h2>2. Bron qilish tartibi</h2>
<p>Mijoz saytda joy, sana va mehmonlar sonini tanlab, ism va telefon raqamini kiritadi. Bron raqami berilgandan keyin bron "yangi" holatida bo'ladi. Hamkor yoki Xizmat menejeri joy bo'shligini tasdiqlagach, bron "tasdiqlandi" holatiga o'tadi va mijozga xabar beriladi.</p>
<p>Saytda ko'rsatilgan narx tanlangan sana, xona turi, xonalar va mehmonlar soni bo'yicha hisoblanadi. Mahalliy turistik yig'im, qo'shimcha xizmatlar va boshqa to'lovlar alohida ko'rsatilgan bo'lsa, ular narxga qo'shiladi.</p>
<h2>3. To'lov</h2>
<p>To'lov joyida (naqd yoki karta) yoki saytda ko'rsatilgan to'lov tizimlari orqali amalga oshiriladi. Onlayn to'lov ulanmagan bo'lsa, to'lov Hamkorga joyida qilinadi. Xizmat mijozdan bron uchun komissiya olmaydi.</p>
<h2>4. Bekor qilish va o'zgartirish</h2>
<p>Bronni bekor qilish va o'zgartirish <a href="qoidalar.html">Bron va bekor qilish qoidalari</a> bo'yicha amalga oshiriladi. Joy kartochkasida "Bepul bekor qilish" belgisi bo'lsa, bronni kelishdan oldin to'lovsiz bekor qilish mumkin.</p>
<h2>5. Tomonlarning majburiyatlari</h2>
<p>Mijoz to'g'ri ma'lumot (ism, telefon, sana) kiritadi va joy qoidalariga rioya qiladi. Hamkor tasdiqlangan bron bo'yicha joyni taqdim etadi. Xizmat bron ma'lumotini Hamkorga yetkazadi va holat o'zgarishi haqida mijozga xabar beradi.</p>
<h2>6. Sharhlar</h2>
<p>Sharhni faqat bron qilib, joyda bo'lgan mijoz qoldira oladi. Haqoratli, reklama yoki shaxsiy ma'lumot bo'lgan sharhlar yashiriladi.</p>
<h2>7. Nizolarni hal qilish</h2>
<p>Nizolar muzokaralar yo'li bilan, kelishilmasa O'zbekiston Respublikasi qonunchiligiga muvofiq sudda hal qilinadi. Iste'molchilarning huquqlari O'zbekiston Respublikasining "Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi Qonuni bilan himoya qilinadi.</p>
<h2>8. Xizmat ko'rsatuvchi</h2>
${reqs}`],
  "qoidalar.html": ["Bron va bekor qilish qoidalari", "bron.uz da bronni tasdiqlash, o'zgartirish va bekor qilish tartibi.", `
<h2>Bron holatlari</h2>
<ul class="sp-list"><li><b>Yangi</b>: so'rov qabul qilindi, menejer joy bo'shligini tekshirmoqda.</li><li><b>Tasdiqlandi</b>: joy siz uchun band qilindi.</li><li><b>Bekor qilindi</b>: bron bekor qilingan.</li><li><b>Yakunlandi</b>: xizmat ko'rsatildi, endi sharh qoldirishingiz mumkin.</li></ul>
<h2>Bekor qilish</h2>
<p>"Bronlarim" bo'limida yoki menejerga qo'ng'iroq qilib bronni bekor qilish mumkin. "Bepul bekor qilish" belgisi bor joylarda bronni kelish kunidan oldin to'lovsiz bekor qilasiz. Bunday belgi bo'lmasa, bekor qilish shartlarini (masalan, birinchi kecha narxi ushlab qolinishini) menejer bronni tasdiqlashda aytadi.</p>
<p>Oldindan to'langan summa bekor qilish shartlariga ko'ra 10 ish kuni ichida to'lov qilingan usul orqali qaytariladi.</p>
<h2>Kelmay qolish</h2>
<p>Mijoz bekor qilmasdan kelmasa, Hamkor birinchi kecha (zal uchun birinchi kun) narxini talab qilishi mumkin.</p>
<h2>O'zgartirish</h2>
<p>Sana, xona turi yoki mehmonlar sonini o'zgartirish uchun eski bronni bekor qilib, yangisini yuboring yoki menejer bilan bog'laning. Yangi narx o'zgartirish kunidagi narx bo'yicha hisoblanadi.</p>
<h2>Transport</h2>
<p>Avia va poyezd chiptalari tashuvchi qoidalari bo'yicha qaytariladi. Haydovchili mashina buyurtmasini jo'nashdan 24 soat oldin bepul bekor qilish mumkin.</p>`],
  "maxfiylik.html": ["Maxfiylik siyosati", "bron.uz shaxsiy ma'lumotlarni qanday yig'adi, saqlaydi va himoya qiladi.", `
<h2>Qanday ma'lumot yig'iladi</h2>
<p>Bron va hisob uchun: ism familiya, telefon raqami, bron sanalari, mehmonlar soni va izoh. Parol faqat shifrlangan (xesh) ko'rinishda saqlanadi. Sayt sozlamalari (til, sevimlilar, yaqinda ko'rilganlar) faqat sizning qurilmangizda saqlanadi.</p>
<h2>Nima uchun ishlatiladi</h2>
<p>Bronni Hamkorga yetkazish, siz bilan bog'lanish, bron holati haqida xabar berish (SMS yoki Telegram orqali, agar siz ulangan bo'lsangiz) va firibgarlikka qarshi himoya uchun. Ma'lumotlar reklama uchun uchinchi shaxslarga sotilmaydi.</p>
<h2>Kimga beriladi</h2>
<p>Faqat siz bron qilgan joyning Hamkoriga (bronni bajarish uchun), SMS yuborish xizmatiga (tasdiqlash kodi uchun) va qonunda belgilangan hollarda vakolatli davlat organlariga.</p>
<h2>Saqlash va himoya</h2>
<p>O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi Qonuniga muvofiq O'zbekiston fuqarolarining shaxsiy ma'lumotlari O'zbekiston hududida joylashgan serverda saqlanadi. Ma'lumotlar bron yakunlangandan keyin buxgalteriya va qonun talab qiladigan muddat davomida saqlanadi, so'ng o'chiriladi.</p>
<h2>Sizning huquqlaringiz</h2>
<p>Ma'lumotlaringizni ko'rish, tuzatish yoki hisobingizni va ma'lumotlaringizni o'chirishni so'rashingiz mumkin. Buning uchun quyidagi aloqa orqali murojaat qiling.</p>
<h2>Aloqa</h2>
${reqs}`]
};
for (const [file, [title, desc, html]] of Object.entries(legal)) write(file, page({ file, title: `${title} | bron.uz`, desc, body: `<article class="sp-card sp-legal"><h1>${esc(title)}</h1>${legalNote}${html}</article>` }));

// ---- sitemap & robots ----
const urls = ["", "turistlar.html", "shaharlar.html", ...out.filter((f) => f !== "shaharlar.html" && f !== "turistlar.html" && !noindex.has(f))];
fs.writeFileSync(path.join(PUB, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(`${SITE}/${u}`)}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(PUB, "robots.txt"), `User-agent: *\nDisallow: /api/\nDisallow: /admin\nDisallow: /partner.html\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`${out.length} ta sahifa, sitemap.xml va robots.txt yozildi (${SITE}).${filled ? "" : " Rekvizitlar yo'q: tools/company.json ni to'ldiring."}`);
