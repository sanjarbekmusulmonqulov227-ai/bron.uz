// "Turizm bugun": daily tourism news and statistics from data/daily.json (refreshed every day by
// tools/fetch-daily.js in GitHub Actions). Draws the short block on the home page (#knHome) and the
// full page kunlik.html (#kunlikPage). Headlines stay in the language they were published in;
// this file carries its own uz/ru/en labels, so its output is marked data-no-i18n.
(function () {
  "use strict";
  const home = document.getElementById("knHome");
  const full = document.getElementById("kunlikPage");
  if (!home && !full) return;
  const LANG = (window.BRON_I18N && window.BRON_I18N.lang) || "uz";
  const LOC = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" }[LANG];

  const S = {
    uz: {
      loading: "Yuklanmoqda…", fail: "Kunlik ma'lumot hozircha yuklanmadi. Birozdan keyin qayta urinib ko'ring.", retry: "Qayta urinish",
      updated: "Yangilangan: {0}", news: "Turizm yangiliklari", noNews: "Oxirgi kunlarda bu tilda turizm yangiligi topilmadi.",
      arrivals: "Xorijiy turistlar tashrifi, {0}-yil", vsYear: "{0}-yilga nisbatan", usd: "1 AQSh dollari", vsYesterday: "kechagiga nisbatan",
      interest: "Dunyoda qiziqish, {0}", interestSub: "Vikipediyada O'zbekiston va shaharlar maqolalari", vsWeek: "o'tgan 7 kun o'rtachasiga nisbatan",
      today: "Bugungi yangiliklar", todaySub: "so'nggi 24 soatda", views: "ko'rish", som: "so'm",
      thousand: "ming", million: "mln", people: "kishi",
      officialH: "Rasmiy statistika: yillik turistlar oqimi", officialNote: "O'zbekiston Milliy statistika qo'mitasi (siat.stat.uz) ma'lumoti, ming kishi. Oxirgi yangilanish: {0}.",
      interestH: "Sayyohlar qiziqishi: Vikipediyada kunlik ko'rishlar", interestNote: "Ingliz, rus va o'zbek Vikipediyasidagi maqolalar, oxirgi 30 kun ({0} – {1}). Bu turistlar soni emas, balki dunyoda qiziqish o'lchovi.",
      place: "Joy", yesterday: "{0}", trend: "30 kun", change: "O'zgarish",
      ratesH: "Valyuta kurslari", ratesNote: "O'zbekiston Markaziy banki rasmiy kursi, {0}.", ccy: "Valyuta", rate: "Kurs, so'm", diff: "Farq",
      calc: "Kalkulyator", amount: "Miqdor", result: "{0} so'm",
      sources: "Manbalar", sourcesTxt: "Yangiliklar sarlavhasi va havolasi manba saytidan olinadi; to'liq matnni manbada o'qing.",
      langs: { uz: "O'zbekcha", ru: "Русский", en: "English" }, more: "Barcha yangiliklar va statistika", justNow: "hozirgina",
      minAgo: "{0} daqiqa oldin", yday: "kecha", hAgo: "{0} soat oldin", dAgo: "{0} kun oldin", year: "Yil", value: "Qiymat"
    },
    ru: {
      loading: "Загрузка…", fail: "Ежедневные данные пока не загрузились. Попробуйте чуть позже.", retry: "Повторить",
      updated: "Обновлено: {0}", news: "Новости туризма", noNews: "За последние дни новостей туризма на этом языке не найдено.",
      arrivals: "Въезд иностранных туристов, {0} г.", vsYear: "к {0} г.", usd: "1 доллар США", vsYesterday: "ко вчерашнему дню",
      interest: "Интерес в мире, {0}", interestSub: "статьи Википедии об Узбекистане и городах", vsWeek: "к среднему за 7 дней",
      today: "Новости за сутки", todaySub: "за последние 24 часа", views: "просмотров", som: "сум",
      thousand: "тыс.", million: "млн", people: "чел.",
      officialH: "Официальная статистика: годовой поток туристов", officialNote: "Данные Национального комитета статистики Узбекистана (siat.stat.uz), тыс. человек. Последнее обновление: {0}.",
      interestH: "Интерес путешественников: просмотры Википедии по дням", interestNote: "Статьи в английской, русской и узбекской Википедии за последние 30 дней ({0} – {1}). Это не число туристов, а мера интереса в мире.",
      place: "Место", yesterday: "{0}", trend: "30 дней", change: "Изменение",
      ratesH: "Курсы валют", ratesNote: "Официальный курс Центрального банка Узбекистана, {0}.", ccy: "Валюта", rate: "Курс, сум", diff: "Разница",
      calc: "Калькулятор", amount: "Сумма", result: "{0} сум",
      sources: "Источники", sourcesTxt: "Заголовок и ссылка берутся с сайта источника; полный текст читайте у источника.",
      langs: { uz: "O'zbekcha", ru: "Русский", en: "English" }, more: "Все новости и статистика", justNow: "только что",
      minAgo: "{0} мин назад", yday: "вчера", hAgo: "{0} ч назад", dAgo: "{0} дн. назад", year: "Год", value: "Значение"
    },
    en: {
      loading: "Loading…", fail: "Today's data has not loaded yet. Please try again a little later.", retry: "Try again",
      updated: "Updated: {0}", news: "Tourism news", noNews: "No tourism news in this language in the last few days.",
      arrivals: "Foreign tourist arrivals, {0}", vsYear: "vs {0}", usd: "1 US dollar", vsYesterday: "vs yesterday",
      interest: "World interest, {0}", interestSub: "Wikipedia articles on Uzbekistan and its cities", vsWeek: "vs last 7-day average",
      today: "News today", todaySub: "in the last 24 hours", views: "views", som: "soum",
      thousand: "k", million: "M", people: "people",
      officialH: "Official statistics: yearly tourist flow", officialNote: "Data from the National Statistics Committee of Uzbekistan (siat.stat.uz), thousand people. Last updated: {0}.",
      interestH: "Traveller interest: daily Wikipedia views", interestNote: "English, Russian and Uzbek Wikipedia articles, last 30 days ({0} – {1}). This is not a count of tourists but a measure of interest worldwide.",
      place: "Place", yesterday: "{0}", trend: "30 days", change: "Change",
      ratesH: "Exchange rates", ratesNote: "Official rate of the Central Bank of Uzbekistan, {0}.", ccy: "Currency", rate: "Rate, soum", diff: "Change",
      calc: "Converter", amount: "Amount", result: "{0} soum",
      sources: "Sources", sourcesTxt: "Headlines and links come from the source sites; read the full story there.",
      langs: { uz: "O'zbekcha", ru: "Русский", en: "English" }, more: "All news and statistics", justNow: "just now",
      minAgo: "{0} min ago", yday: "yesterday", hAgo: "{0} h ago", dAgo: "{0} days ago", year: "Year", value: "Value"
    }
  }[LANG];
  const t = (k, ...a) => String(S[k]).replace(/\{(\d)\}/g, (m, i) => a[i]);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n, d = 0) => Number(n).toLocaleString("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, " ");
  const pct = (a, b) => b ? (a - b) / b * 100 : null;
  const UZ_MON = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  function day(iso) {
    const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
    if (LANG === "uz") return `${d.getDate()}-${UZ_MON[d.getMonth()]}`;
    return new Intl.DateTimeFormat(LOC, { day: "numeric", month: "long" }).format(d);
  }
  function stamp(iso) {
    const d = new Date(iso);
    const hm = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" }).format(d);
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d);
    return `${day(ymd)}, ${hm} (${LANG === "en" ? "Tashkent" : LANG === "ru" ? "Ташкент" : "Toshkent"})`;
  }
  function ago(iso) {
    const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
    if (m < 2) return t("justNow");
    if (m < 60) return t("minAgo", m);
    if (m < 24 * 60) return t("hAgo", Math.round(m / 60));
    if (m < 36 * 60) return t("yday");
    if (m < 7 * 24 * 60) return t("dAgo", Math.round(m / 1440));
    return day(iso);
  }
  // Thousands of people → "11,68 mln" / "792 ming".
  const people = (k) => k >= 1000 ? `${num(k / 1000, 2)} ${t("million")}` : `${num(k, 1)} ${t("thousand")}`;
  // Growth is green, decline red; exchange-rate moves are neither good nor bad, so they stay neutral.
  function delta(p, neutral) {
    if (p == null || !isFinite(p)) return "";
    const up = p >= 0;
    return `<span class="kn-d ${neutral ? "is-flat" : up ? "is-up" : "is-down"}"><span aria-hidden="true">${up ? "▲" : "▼"}</span> ${up ? "+" : "−"}${num(Math.abs(p), 1)}%</span>`;
  }

  // ---------- pieces ----------
  const newsOf = (d, lang) => ((d.news && d.news[lang]) || []);
  function newsList(items, n) {
    if (!items.length) return `<p class="muted">${t("noNews")}</p>`;
    return `<ol class="kn-news">${items.slice(0, n).map((x) => `<li><a href="${esc(x.u)}" target="_blank" rel="noopener nofollow">${esc(x.t)}</a><span class="kn-meta">${esc(x.s)} · <time datetime="${esc(x.d)}">${esc(ago(x.d))}</time></span></li>`).join("")}</ol>`;
  }
  function tiles(d) {
    const out = [];
    const tot = (d.official || []).find((x) => x.id === 1038);
    if (tot && tot.series.length) {
      const s = tot.series, [y, v] = s[s.length - 1], prev = s[s.length - 2];
      out.push(`<div class="kn-tile"><p class="kn-lbl">${t("arrivals", y)}</p><p class="kn-big">${people(v)}</p><p class="kn-sub">${prev ? `${delta(pct(v, prev[1]))} ${t("vsYear", prev[0])}` : ""}</p></div>`);
    }
    const usd = d.rates && d.rates.list.find((x) => x.c === "USD");
    if (usd) out.push(`<div class="kn-tile"><p class="kn-lbl">${t("usd")}</p><p class="kn-big">${num(usd.r, 2)} <small>${t("som")}</small></p><p class="kn-sub">${delta(pct(usd.r, usd.r - usd.d), true)} ${t("vsYesterday")}</p></div>`);
    if (d.interest && d.interest.items.length) {
      const n = d.interest.days.length, sum = (i) => d.interest.items.reduce((a, x) => a + (x.views[i] || 0), 0);
      const last = sum(n - 1), week = [2, 3, 4, 5, 6, 7, 8].filter((k) => n - k >= 0).map((k) => sum(n - k));
      const avg = week.length ? week.reduce((a, b) => a + b, 0) / week.length : 0;
      out.push(`<div class="kn-tile"><p class="kn-lbl">${t("interest", day(d.interest.days[n - 1]))}</p><p class="kn-big">${num(last)} <small>${t("views")}</small></p><p class="kn-sub">${delta(pct(last, avg))} ${t("vsWeek")}</p></div>`);
    }
    const fresh = newsOf(d, LANG).filter((x) => Date.now() - Date.parse(x.d) < 864e5).length;
    out.push(`<div class="kn-tile"><p class="kn-lbl">${t("today")}</p><p class="kn-big">${num(fresh)}</p><p class="kn-sub">${t("todaySub")}</p></div>`);
    return `<div class="kn-tiles">${out.join("")}</div>`;
  }
  function bars(ds) {
    // Narrow screens get fewer years so the labels stay readable.
    const years = full && full.clientWidth < 560 ? 6 : 12;
    const s = ds.series.filter((x) => x[0] > ds.series[ds.series.length - 1][0] - years);
    const W = years === 6 ? 360 : 640, H = years === 6 ? 200 : 240, L = 8, B = 26, T = 22, gap = 6;
    const max = Math.max(...s.map((x) => x[1])) || 1, bw = (W - L * 2) / s.length;
    const h = (v) => (H - B - T) * v / max;
    const rects = s.map(([y, v], i) => {
      const x = L + i * bw + gap / 2, w = bw - gap, hh = Math.max(2, h(v)), last = i === s.length - 1;
      return `<g class="kn-bar${last ? " is-last" : ""}" tabindex="0" data-tip="${esc(`${y}: ${people(v)}`)}"><rect x="${x}" y="${H - B - hh}" width="${w}" height="${hh}" rx="4"/><rect class="kn-hit" x="${L + i * bw}" y="${T - 4}" width="${bw}" height="${H - T - B + 4}"/>${last ? `<text class="kn-val" x="${x + w / 2}" y="${H - B - hh - 6}" text-anchor="middle">${esc(people(v))}</text>` : ""}<text class="kn-ax" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${y}</text></g>`;
    }).join("");
    const rows = s.map(([y, v]) => `<tr><td>${y}</td><td>${num(v, 1)}</td></tr>`).join("");
    return `<div class="kn-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title(ds))}"><line class="kn-base" x1="${L}" x2="${W - L}" y1="${H - B}" y2="${H - B}"/>${rects}</svg><div class="kn-tip" hidden></div></div>
      <details class="kn-table"><summary>${esc(title(ds))}</summary><table><thead><tr><th>${t("year")}</th><th>${t("value")}</th></tr></thead><tbody>${rows}</tbody></table></details>`;
  }
  const title = (ds) => (ds.title && (ds.title[LANG] || ds.title.uz)) || "";
  const unit = (ds) => (ds.unit && (ds.unit[LANG] || ds.unit.uz)) || "";
  function spark(v) {
    const W = 120, H = 30, max = Math.max(...v, 1), min = Math.min(...v), r = max - min || 1;
    const pts = v.map((x, i) => `${(i * (W - 4) / Math.max(1, v.length - 1) + 2).toFixed(1)},${(H - 3 - (x - min) / r * (H - 6)).toFixed(1)}`);
    return `<svg class="kn-spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts.join(" ")}"/><circle r="3" cx="${pts[pts.length - 1].split(",")[0]}" cy="${pts[pts.length - 1].split(",")[1]}"/></svg>`;
  }
  function interest(d) {
    const I = d.interest; if (!I || !I.items.length) return "";
    const n = I.days.length;
    const rows = I.items.map((x) => {
      const last = x.views[n - 1] || 0, wk = x.views.slice(Math.max(0, n - 8), n - 1), avg = wk.reduce((a, b) => a + b, 0) / (wk.length || 1);
      return `<tr><th scope="row">${esc(x.name[LANG] || x.name.uz)}</th><td>${num(last)}</td><td>${spark(x.views)}</td><td>${delta(pct(last, avg))}</td></tr>`;
    }).join("");
    return `<section class="kn-box"><h2 class="sp-h2">${t("interestH")}</h2><div class="kn-scroll"><table class="kn-grid"><thead><tr><th>${t("place")}</th><th>${t("yesterday", day(I.days[n - 1]))}</th><th>${t("trend")}</th><th>${t("change")}</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted small">${t("interestNote", day(I.days[0]), day(I.days[n - 1]))}</p></section>`;
  }
  function rates(d) {
    const R = d.rates; if (!R) return "";
    const rows = R.list.map((x) => `<tr><th scope="row"><b>${esc(x.c)}</b> <span class="muted">${x.n > 1 ? x.n + " " : ""}${esc(x[LANG] || x.uz || "")}</span></th><td>${num(x.r, 2)}</td><td>${x.d ? delta(pct(x.r, x.r - x.d), true) : "—"}</td></tr>`).join("");
    const opts = R.list.map((x) => `<option value="${esc(x.c)}">${esc(x.c)}</option>`).join("");
    return `<section class="kn-box"><h2 class="sp-h2">${t("ratesH")}</h2>
      <form class="kn-calc"><label>${t("amount")} <input type="number" min="0" step="any" value="100" inputmode="decimal" id="knAmt"></label><label>${t("ccy")} <select id="knCcy">${opts}</select></label><output id="knOut" for="knAmt knCcy"></output></form>
      <div class="kn-scroll"><table class="kn-grid"><thead><tr><th>${t("ccy")}</th><th>${t("rate")}</th><th>${t("diff")}</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted small">${t("ratesNote", esc(R.date))} <a href="https://cbu.uz/" target="_blank" rel="noopener">cbu.uz</a></p></section>`;
  }
  function official(d) {
    const list = d.official || []; if (!list.length) return "";
    const tot = list.find((x) => x.id === 1038) || list[0];
    const others = list.filter((x) => x !== tot).map((x) => {
      const s = x.series, [y, v] = s[s.length - 1], p = s[s.length - 2];
      return `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(title(x))}</a>${unit(x) ? ` <span class="muted">(${esc(unit(x))})</span>` : ""}: <b>${y}: ${num(v, 1)}</b> ${p ? delta(pct(v, p[1])) : ""}</li>`;
    }).join("");
    return `<section class="kn-box"><h2 class="sp-h2">${t("officialH")}</h2><p><a href="${esc(tot.url)}" target="_blank" rel="noopener">${esc(title(tot))}</a></p>${bars(tot)}${others ? `<ul class="kn-list">${others}</ul>` : ""}<p class="muted small">${t("officialNote", esc(tot.modified || "—"))}</p></section>`;
  }

  // ---------- hover tooltip for the bar chart ----------
  function wireChart(root) {
    root.querySelectorAll(".kn-chart").forEach((box) => {
      const tip = box.querySelector(".kn-tip");
      const show = (g, x, y) => { tip.textContent = g.dataset.tip; tip.hidden = false; const r = box.getBoundingClientRect(); tip.style.left = Math.min(Math.max(0, x - r.left), r.width - 10) + "px"; tip.style.top = (y - r.top) + "px"; box.querySelectorAll(".kn-bar").forEach((b) => b.classList.toggle("is-hot", b === g)); };
      const hide = () => { tip.hidden = true; box.querySelectorAll(".is-hot").forEach((b) => b.classList.remove("is-hot")); };
      box.addEventListener("pointermove", (e) => { const g = e.target.closest(".kn-bar"); g ? show(g, e.clientX, e.clientY) : hide(); });
      box.addEventListener("pointerleave", hide);
      box.addEventListener("focusin", (e) => { const g = e.target.closest(".kn-bar"); if (g) { const r = g.getBoundingClientRect(); show(g, r.left + r.width / 2, r.top); } });
      box.addEventListener("focusout", hide);
    });
  }
  function wireCalc(root, d) {
    const a = root.querySelector("#knAmt"), c = root.querySelector("#knCcy"), o = root.querySelector("#knOut");
    if (!a) return;
    a.form.addEventListener("submit", (e) => e.preventDefault());
    const run = () => { const x = d.rates.list.find((r) => r.c === c.value); const v = parseFloat(a.value); o.textContent = x && isFinite(v) ? "= " + t("result", num(v * x.r / x.n, 0)) : ""; };
    a.addEventListener("input", run); c.addEventListener("change", run); run();
  }

  // ---------- render ----------
  function renderHome(d) {
    home.innerHTML = `<div class="kn-home-grid"><div class="now-card"><p class="now-lbl">${t("news")}</p>${newsList(newsOf(d, LANG), 5)}</div><div>${tiles(d)}<p class="muted small kn-upd">${t("updated", esc(stamp(d.updated)))}</p></div></div>`;
  }
  function renderFull(d) {
    let nl = LANG;
    const chips = () => `<div class="chips" role="group" aria-label="${t("news")}">${["uz", "ru", "en"].map((l) => `<button type="button" class="chip" data-kn-lang="${l}" aria-pressed="${l === nl}">${S.langs[l]} <span class="muted">${newsOf(d, l).length}</span></button>`).join("")}</div>`;
    full.innerHTML = `<p class="muted small kn-upd">${t("updated", esc(stamp(d.updated)))}</p>${tiles(d)}
      <section class="kn-box"><h2 class="sp-h2">${t("news")}</h2><div id="knChips">${chips()}</div><div id="knNews" lang="${nl}">${newsList(newsOf(d, nl), 40)}</div></section>
      ${official(d)}${interest(d)}${rates(d)}
      <section class="kn-box"><h2 class="sp-h2">${t("sources")}</h2><p class="muted small">${t("sourcesTxt")}</p><p class="small"><a href="https://kun.uz" target="_blank" rel="noopener">Kun.uz</a> · <a href="https://daryo.uz" target="_blank" rel="noopener">Daryo</a> · <a href="https://www.gazeta.uz" target="_blank" rel="noopener">Gazeta.uz</a> · <a href="https://uza.uz" target="_blank" rel="noopener">UzA</a> · <a href="https://podrobno.uz" target="_blank" rel="noopener">Podrobno.uz</a> · <a href="https://uzdaily.uz" target="_blank" rel="noopener">UzDaily</a> · <a href="https://news.google.com" target="_blank" rel="noopener">Google News</a> · <a href="https://siat.stat.uz" target="_blank" rel="noopener">siat.stat.uz</a> · <a href="https://cbu.uz" target="_blank" rel="noopener">cbu.uz</a> · <a href="https://wikimedia.org/api/rest_v1/" target="_blank" rel="noopener">Wikimedia</a></p></section>`;
    full.querySelector("#knChips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-kn-lang]"); if (!b) return;
      nl = b.dataset.knLang;
      full.querySelector("#knChips").innerHTML = chips();
      const box = full.querySelector("#knNews"); box.lang = nl; box.innerHTML = newsList(newsOf(d, nl), 40);
    });
    wireChart(full); wireCalc(full, d);
  }

  function load() {
    [home, full].forEach((el) => el && (el.innerHTML = `<p class="muted small">${t("loading")}</p>`));
    fetch("data/daily.json", { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
      if (home) renderHome(d);
      if (full) renderFull(d);
    }).catch(() => {
      [home, full].forEach((el) => { if (!el) return; el.innerHTML = `<p class="muted">${t("fail")}</p><button class="btn btn-line" type="button" data-kn-retry>${t("retry")}</button>`; el.querySelector("[data-kn-retry]").addEventListener("click", load); });
    });
  }
  // The home block loads when it comes near the screen; the full page loads at once.
  if (home && !full && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "500px" });
    io.observe(home);
  } else load();
})();
