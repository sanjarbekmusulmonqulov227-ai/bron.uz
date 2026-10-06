// Collects the daily tourism data the site shows on kunlik.html and the home page:
//   - tourism news headlines (uz/ru/en) from Uzbek news sites' RSS feeds and Google News search,
//   - Central Bank (cbu.uz) exchange rates with the change since the previous day,
//   - daily Wikipedia page views for the main destinations (a public measure of interest),
//   - official yearly inbound tourism figures from the Statistics Agency (siat.stat.uz).
// Writes public/data/daily.json. A source that fails keeps its previous data from that file,
// so one broken feed never empties the page. Only headlines and links are stored, no article text.
//   node tools/fetch-daily.js          (GitHub Actions runs it every day, see .github/workflows/sayt.yml)
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "public", "data", "daily.json");
const UA = "bron.uz-daily/1.0 (+https://github.com/sanjarbekmusulmonqulov227-ai/bron.uz)";
const DAY = 864e5;
const NEWS_DAYS = 10, NEWS_MAX = 40;

const log = (...a) => console.log(...a);
async function get(url, type = "text") {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: type === "json" ? "application/json" : "application/rss+xml, application/xml, text/xml, */*" }, signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return type === "json" ? await r.json() : await r.text();
  } finally { clearTimeout(timer); }
}

// ---------- news ----------
const FEEDS = {
  uz: [
    ["Kun.uz", "https://kun.uz/news/rss"],
    ["Daryo", "https://daryo.uz/feed"],
    ["Gazeta.uz", "https://www.gazeta.uz/oz/rss/"],
    ["UzA", "https://uza.uz/uz/rss"],
    ["Google News", "https://news.google.com/rss/search?q=" + encodeURIComponent("turizm OR sayyoh OR turist O'zbekiston when:7d") + "&hl=uz&gl=UZ&ceid=UZ:uz", true]
  ],
  ru: [
    ["Kun.uz", "https://kun.uz/ru/news/rss"],
    ["Gazeta.uz", "https://www.gazeta.uz/ru/rss/"],
    ["Daryo", "https://daryo.uz/ru/feed"],
    ["Podrobno.uz", "https://podrobno.uz/rss/"],
    ["Google News", "https://news.google.com/rss/search?q=" + encodeURIComponent("туризм Узбекистан when:7d") + "&hl=ru&gl=UZ&ceid=UZ:ru", true]
  ],
  en: [
    ["Kun.uz", "https://kun.uz/en/news/rss"],
    ["Daryo", "https://daryo.uz/en/feed"],
    ["Gazeta.uz", "https://www.gazeta.uz/en/rss/"],
    ["UzDaily", "https://uzdaily.uz/en/rss"],
    ["Google News", "https://news.google.com/rss/search?q=" + encodeURIComponent("Uzbekistan tourism when:7d") + "&hl=en-US&gl=US&ceid=US:en", true]
  ]
};
// Headline words that mark a tourism story (general feeds are filtered by these; Google News searches are already on topic).
const TOPIC = {
  uz: /turizm|turist|sayyoh|sayoh|mehmonxona|aviareys|aviakompaniya|airways|aeroport|vizasiz|viza|ziyorat|muzey|festival|afrosiyob|tezyurar|ekotur|dam olish|kurort|sanator|туризм|турист|сайёҳ|меҳмонхона|авиарейс|аэропорт|визасиз|зиёрат/i,
  ru: /туризм|турист|туров|гостиниц|отел[ьяеи]|авиарейс|авиакомпан|аэропорт|безвиз|виз[аыу]|паломни|путешеств|фестивал|музе[йя]|санатор|курорт|афросиёб|скоростн|airways/i,
  en: /touris|tourist|travel|hotel|flight|airline|airways|airport|visa|visitor|pilgrim|festival|museum|heritage|resort|afrosiyob/i
};
// Headlines that match a topic word but are about something else.
const NOT = /futbol|футбол|football|boks|бокс|chempionat|чемпионат|championship/i;

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”" };
const decode = (s) => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m);
const strip = (s) => decode(s).replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m) => decode(m)).replace(/\s+/g, " ").trim();
const tag = (block, name) => { const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(block); return m ? m[1] : ""; };
const tags = (block, name) => [...block.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "gi"))].map((m) => m[1]);

function parseFeed(xml) {
  const items = [];
  for (const m of xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)) {
    const b = m[0];
    let link = strip(tag(b, "link"));
    if (!link) { const h = /<link[^>]*href="([^"]+)"/i.exec(b); if (h) link = decode(h[1]); }
    items.push({
      title: strip(tag(b, "title")),
      link: link.trim(),
      date: strip(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date")),
      cats: tags(b, "category").map(strip).join(" "),
      desc: strip(tag(b, "description") || tag(b, "summary")).slice(0, 400),
      source: strip(tag(b, "source"))
    });
  }
  return items;
}

const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
async function news(prev) {
  const out = {}, report = {};
  const cutoff = Date.now() - NEWS_DAYS * DAY;
  for (const [lang, feeds] of Object.entries(FEEDS)) {
    const list = [];
    for (const [name, url, onTopic] of feeds) {
      try {
        const items = parseFeed(await get(url));
        let n = 0;
        for (const it of items) {
          const when = Date.parse(it.date);
          if (!it.title || !/^https?:\/\//.test(it.link) || !(when > cutoff) || when > Date.now() + DAY) continue;
          let title = it.title, source = name;
          if (onTopic) {
            // Google News titles end with " - Publisher"; keep the publisher as the source.
            source = it.source || (/ - ([^-]+)$/.exec(title) || [])[1] || name;
            title = title.replace(/ - [^-]+$/, "").trim();
          } else if (!TOPIC[lang].test(`${title} ${it.cats}`)) continue;
          if (NOT.test(title)) continue;
          list.push({ t: title.slice(0, 220), u: it.link, s: source.slice(0, 40), d: new Date(when).toISOString() });
          n++;
        }
        report[`${lang} ${name}`] = `${items.length} ta, mavzuga oid ${n}`;
      } catch (e) {
        report[`${lang} ${name}`] = "xato: " + e.message;
      }
    }
    // Keep earlier headlines too, so a feed that is down today does not empty the list.
    for (const old of (prev && prev[lang]) || []) if (Date.parse(old.d) > cutoff) list.push(old);
    const seen = new Set();
    out[lang] = list.sort((a, b) => b.d.localeCompare(a.d)).filter((x) => {
      const k = norm(x.t).slice(0, 80);
      if (seen.has(k) || seen.has(x.u)) return false;
      seen.add(k); seen.add(x.u);
      return true;
    }).slice(0, NEWS_MAX);
  }
  return { data: out, report };
}

// ---------- exchange rates ----------
const CCY = ["USD", "EUR", "RUB", "GBP", "CNY", "KZT", "TRY", "AED", "KRW", "JPY"];
async function rates() {
  const list = await get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", "json");
  const pick = list.filter((x) => CCY.includes(x.Ccy)).sort((a, b) => CCY.indexOf(a.Ccy) - CCY.indexOf(b.Ccy));
  if (!pick.length) throw new Error("bo'sh ro'yxat");
  return {
    date: pick[0].Date,
    list: pick.map((x) => ({ c: x.Ccy, n: Number(x.Nominal) || 1, r: Number(x.Rate), d: Number(x.Diff) || 0, uz: x.CcyNm_UZ, ru: x.CcyNm_RU, en: x.CcyNm_EN }))
  };
}

// ---------- Wikipedia interest ----------
const PLACES = [
  ["uzbekistan", { en: "Uzbekistan", ru: "Узбекистан", uz: "Oʻzbekiston" }, { uz: "O'zbekiston", ru: "Узбекистан", en: "Uzbekistan" }],
  ["samarkand", { en: "Samarkand", ru: "Самарканд", uz: "Samarqand" }, { uz: "Samarqand", ru: "Самарканд", en: "Samarkand" }],
  ["tashkent", { en: "Tashkent", ru: "Ташкент", uz: "Toshkent" }, { uz: "Toshkent", ru: "Ташкент", en: "Tashkent" }],
  ["bukhara", { en: "Bukhara", ru: "Бухара", uz: "Buxoro" }, { uz: "Buxoro", ru: "Бухара", en: "Bukhara" }],
  ["khiva", { en: "Khiva", ru: "Хива", uz: "Xiva" }, { uz: "Xiva", ru: "Хива", en: "Khiva" }],
  ["shahrisabz", { en: "Shahrisabz", ru: "Шахрисабз", uz: "Shahrisabz" }, { uz: "Shahrisabz", ru: "Шахрисабз", en: "Shahrisabz" }]
];
const ymd = (t) => new Date(t).toISOString().slice(0, 10).replace(/-/g, "");
async function interest() {
  const end = Date.now() - DAY, start = end - 29 * DAY;
  const days = [];
  for (let t = start; ymd(t) <= ymd(end); t += DAY) days.push(new Date(t).toISOString().slice(0, 10));
  const items = [], miss = [];
  for (const [key, titles, label] of PLACES) {
    const views = days.map(() => 0);
    let got = 0;
    for (const [wiki, title] of Object.entries(titles)) {
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${wiki}.wikipedia/all-access/user/${encodeURIComponent(title.replace(/ /g, "_"))}/daily/${ymd(start)}/${ymd(end)}`;
      try {
        const j = await get(url, "json");
        for (const it of j.items || []) {
          const d = `${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}-${it.timestamp.slice(6, 8)}`;
          const i = days.indexOf(d);
          if (i >= 0) views[i] += it.views;
        }
        got++;
      } catch (e) { miss.push(`${wiki}:${title} ${e.message}`); }
    }
    if (got) items.push({ key, name: label, views });
  }
  if (!items.length) throw new Error("hech narsa olinmadi");
  // Wikimedia publishes a day only after it ends; drop trailing days that are not in yet.
  while (days.length > 1 && items.every((x) => !x.views[days.length - 1])) { days.pop(); items.forEach((x) => x.views.pop()); }
  return { data: { days, wikis: ["en", "ru", "uz"], items }, miss };
}

// ---------- official yearly statistics ----------
const DATASETS = [1038, 1012, 1066];
function metaValue(meta, re) {
  const m = (meta || []).find((x) => re.test(x.name_en || ""));
  return m ? { uz: m.value_uz, ru: m.value_ru, en: m.value_en } : null;
}
async function official() {
  const out = [];
  for (const id of DATASETS) {
    let j = null;
    try { j = await get(`https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_${id}.json`, "json"); }
    catch (e) { log(`  stat.uz ${id}: ${e.message}`); continue; }
    const rows = Array.isArray(j.data) ? j.data : [];
    const row = rows.find((r) => r.Code === "1700") || rows[0];
    if (!row) continue;
    const series = Object.keys(row).filter((k) => /^\d{4}$/.test(k) && row[k] != null && row[k] !== "").map((k) => [Number(k), Number(row[k])]).filter((x) => Number.isFinite(x[1])).sort((a, b) => a[0] - b[0]);
    const title = metaValue(j.metadata, /^(name of (the )?(indicator|dataset)|indicator name|dataset name|name)$/i) || metaValue(j.metadata, /name/i);
    const unit = metaValue(j.metadata, /unit/i);
    const modified = metaValue(j.metadata, /last modified/i);
    if (!series.length) continue;
    out.push({ id, title, unit, modified: modified && modified.en, series, url: `https://siat.stat.uz/data/${id}/` });
    log(`  stat.uz ${id}: ${series.length} yil, oxirgi ${series[series.length - 1].join(" = ")}; nomi: ${title && title.en}; birlik: ${unit && unit.en}`);
  }
  if (!out.length) throw new Error("hech narsa olinmadi");
  return out;
}

// ---------- run ----------
(async () => {
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) { /* first run */ }
  const res = { updated: new Date().toISOString(), news: prev.news || {}, rates: prev.rates || null, interest: prev.interest || null, official: prev.official || null, status: {} };

  const n = await news(prev.news).catch((e) => ({ data: prev.news || {}, report: { all: e.message } }));
  res.news = n.data;
  res.status.news = Object.fromEntries(Object.entries(res.news).map(([k, v]) => [k, v.length]));
  log("Yangiliklar:"); for (const [k, v] of Object.entries(n.report)) log(`  ${k}: ${v}`);
  log("  jami:", JSON.stringify(res.status.news));

  try { res.rates = await rates(); res.status.rates = "ok"; log(`Kurslar: ${res.rates.date}, ${res.rates.list.length} ta valyuta`); }
  catch (e) { res.status.rates = "eski: " + e.message; log("Kurslar: xato", e.message); }

  try { const w = await interest(); res.interest = w.data; res.status.interest = "ok"; log(`Vikipediya: ${w.data.items.length} ta, ${w.data.days[0]}..${w.data.days[w.data.days.length - 1]}`); if (w.miss.length) log("  olinmadi:", w.miss.join("; ")); }
  catch (e) { res.status.interest = "eski: " + e.message; log("Vikipediya: xato", e.message); }

  log("Rasmiy statistika:");
  try { res.official = await official(); res.status.official = "ok"; }
  catch (e) { res.status.official = "eski: " + e.message; log("  xato", e.message); }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(res));
  log(`Yozildi: ${path.relative(process.cwd(), OUT)} (${fs.statSync(OUT).size} bayt)`);
})();
