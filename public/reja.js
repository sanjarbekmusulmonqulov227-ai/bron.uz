// "Sayohat rejasi": a day-by-day trip planner built in the browser from the site's own data
// (cities, sights, sample listings and the sample transport timetable in data.js / sights.js).
// The plan lives in the address bar (?s=…&c=…&d=…), so it can be shared or bookmarked.
// Labels are in this file for uz/ru/en; city names go through the site translator; output is data-no-i18n.
(function () {
  "use strict";
  const page = document.getElementById("rejaPage");
  if (!page) return;
  const I = window.BRON_I18N || { lang: "uz", t: (s) => s };
  const LANG = I.lang || "uz";
  const LOC = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" }[LANG];
  const S = {
    uz: {
      start: "Boshlanish shahri", date: "Boshlanish sanasi", days: "Kunlar soni", people: "Necha kishi", cities: "Qaysi shaharlarni ko'rasiz",
      pace: "Sur'at", paceOpts: ["Sokin, 2 joy/kun", "O'rtacha, 3 joy/kun", "Faol, 4 joy/kun"],
      style: "Turar joy", styleOpts: ["Tejamkor: hostel", "Qulay: mehmonxona", "Hashamatli: 5*"],
      back: "Oxirida boshlang'ich shaharga qaytish", make: "Reja tuzish",
      day: "{0}-kun", arrive: "{0}ga yetib kelish", free: "Erkin vaqt: bozor, hunarmandlar ustaxonasi va mahalliy taomlar.",
      sleep: "Tunash", nights: "{0} kecha", noStay: "Bu shaharda hali hamkor joy yo'q.", trip: "Yo'l", backTo: "Qaytish: {0}",
      train: "Poyezd", avia: "Avia", avto: "Haydovchili mashina", night: "tungi", h: "s", m: "daq", km: "km",
      sum: "Reja qisqacha", sumDays: "{0} kun, {1} shahar", stayCost: "Turar joy", trCost: "Yo'l", total: "Jami taxminan",
      sample: "Narxlar namuna jadvaldan olingan va taxminiy. Haqiqiy narx va vaqt bron paytida tasdiqlanadi.",
      tooShort: "Tanlangan shaharlar uchun kamida {0} kun kerak, kunlar soni {0} ga oshirildi.", pick: "Kamida bitta shahar tanlang.",
      copy: "Havolani nusxalash", copied: "Havola nusxalandi", print: "Chop etish", tg: "Telegram'da ulashish", ics: "Kalendarga qo'shish",
      book: "Bron qilish", city: "Shahar sahifasi", ticket: "Chipta topish", wx: "Ob-havo", som: "so'm", per: "kishi uchun", pax: "{0} kishi",
      icsName: "bron.uz sayohat rejasi", order: "Yo'nalish tartibi: eng yaqin shahar birinchi."
    },
    ru: {
      start: "Откуда начинаете", date: "Дата начала", days: "Количество дней", people: "Сколько человек", cities: "Какие города посетите",
      pace: "Темп", paceOpts: ["Спокойно, 2 в день", "Средне, 3 в день", "Активно, 4 в день"],
      style: "Проживание", styleOpts: ["Экономно (хостел)", "Комфорт (отель)", "Люкс (5 звёзд)"],
      back: "В конце вернуться в начальный город", make: "Составить план",
      day: "День {0}", arrive: "Прибытие: {0}", free: "Свободное время: базар, мастерские ремесленников и местная кухня.",
      sleep: "Ночёвка", nights: "ночей: {0}", noStay: "В этом городе пока нет партнёров.", trip: "Дорога", backTo: "Возвращение: {0}",
      train: "Поезд", avia: "Авиа", avto: "Машина с водителем", night: "ночной", h: "ч", m: "мин", km: "км",
      sum: "План вкратце", sumDays: "{0} дн., городов: {1}", stayCost: "Проживание", trCost: "Дорога", total: "Итого примерно",
      sample: "Цены взяты из примерного расписания и ориентировочны. Точная цена и время подтверждаются при бронировании.",
      tooShort: "Для выбранных городов нужно минимум {0} дн., количество дней увеличено до {0}.", pick: "Выберите хотя бы один город.",
      copy: "Скопировать ссылку", copied: "Ссылка скопирована", print: "Печать", tg: "Поделиться в Telegram", ics: "Добавить в календарь",
      book: "Забронировать", city: "Страница города", ticket: "Найти билет", wx: "Погода", som: "сум", per: "на человека", pax: "{0} чел.",
      icsName: "План поездки bron.uz", order: "Порядок маршрута: сначала ближайший город."
    },
    en: {
      start: "Starting from", date: "Start date", days: "Number of days", people: "Travellers", cities: "Cities to visit",
      pace: "Pace", paceOpts: ["Relaxed, 2 a day", "Moderate, 3 a day", "Active, 4 a day"],
      style: "Stay", styleOpts: ["Budget (hostel)", "Comfort (hotel)", "Luxury (5 stars)"],
      back: "Return to the starting city at the end", make: "Build the plan",
      day: "Day {0}", arrive: "Arrive in {0}", free: "Free time: the bazaar, craft workshops and local food.",
      sleep: "Stay", nights: "{0} nights", noStay: "No partner places in this city yet.", trip: "Travel", backTo: "Return to {0}",
      train: "Train", avia: "Flight", avto: "Car with driver", night: "overnight", h: "h", m: "min", km: "km",
      sum: "Plan at a glance", sumDays: "{0} days, {1} cities", stayCost: "Stay", trCost: "Travel", total: "Total, approx.",
      sample: "Prices come from a sample timetable and are approximate. The real price and times are confirmed when you book.",
      tooShort: "The chosen cities need at least {0} days, so the trip was set to {0} days.", pick: "Choose at least one city.",
      copy: "Copy link", copied: "Link copied", print: "Print", tg: "Share on Telegram", ics: "Add to calendar",
      book: "Book", city: "City page", ticket: "Find a ticket", wx: "Weather", som: "UZS", per: "per person", pax: "{0} people",
      icsName: "bron.uz trip plan", order: "Route order: nearest city first."
    }
  }[LANG];
  const fmt = (s, ...a) => s.replace(/\{(\d)\}/g, (_, i) => a[i]);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const T = (s) => I.t(s);
  const money = (n) => Math.round(n / 1000) * 1000 === 0 ? "0" : String(Math.round(n / 1000) * 1000).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + S.som;
  const dur = (min) => (min >= 60 ? Math.floor(min / 60) + " " + S.h + " " : "") + (min % 60 ? (min % 60) + " " + S.m : "");
  const slug = (s) => s.toLowerCase().replace(/[ʻʼ'`’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const iso = (d) => d.toISOString().slice(0, 10);
  // Browsers print Uzbek dates as "M10 15", so Uzbek month and weekday names are spelled out here.
  const UZ_MON = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const UZ_WD = ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"];
  const dateTxt = (s, o) => {
    const d = new Date(s + "T00:00:00");
    if (LANG !== "uz") return d.toLocaleDateString(LOC, o);
    return (o.weekday ? UZ_WD[d.getDay()] + ", " : "") + d.getDate() + "-" + (o.month === "short" ? UZ_MON[d.getMonth()].slice(0, 3) : UZ_MON[d.getMonth()]) + (o.year ? ", " + d.getFullYear() : "");
  };
  // Today in the visitor's own calendar (toISOString is UTC: before 05:00 in Tashkent it gave yesterday).
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const addDays = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

  const SIGHTS = window.BRON_SIGHTS || [];
  const LIST = window.BRON_LISTINGS || [];
  const GEO = window.BRON_GEO || {};
  const TR = window.BRON_TRANSPORT || { avia: [], poyezd: [], avto: [] };
  // Cities a visitor can add: those with sights to see, in a west-to-east-ish reading order.
  const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Xiva", "Shahrisabz", "Nurota", "Chimyon", "Qo'qon", "Rishton", "Termiz", "Nukus", "Mo'ynoq"].filter((c) => GEO[c]);
  const STARTS = ["Toshkent", "Samarqand", "Buxoro", "Urganch", "Farg'ona", "Termiz", "Nukus"].filter((c) => GEO[c]);
  const WEIGHT = { Toshkent: 2, Samarqand: 2.5, Buxoro: 2.5, Xiva: 1.5 };

  const hav = (p, q) => { const r = Math.PI / 180, a = Math.sin((q[0] - p[0]) * r / 2) ** 2 + Math.cos(p[0] * r) * Math.cos(q[0] * r) * Math.sin((q[1] - p[1]) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(a)); };
  const dist = (a, b) => (GEO[a] && GEO[b] ? hav(GEO[a], GEO[b]) : 9999);

  // Read the plan from the address bar, with defaults.
  function readQuery() {
    const q = new URLSearchParams(location.search);
    const today = localToday();
    const c = (q.get("c") || "Samarqand~Buxoro~Xiva").split("~").filter((x) => CITIES.includes(x));
    const s = STARTS.includes(q.get("s")) ? q.get("s") : "Toshkent";
    const d = q.get("t") && /^\d{4}-\d\d-\d\d$/.test(q.get("t")) && q.get("t") >= today ? q.get("t") : addDays(today, 14);
    return { s, c, t: d, d: Math.min(14, Math.max(1, +q.get("d") || 7)), u: Math.min(16, Math.max(1, +q.get("u") || 2)),
      p: [2, 3, 4].includes(+q.get("p")) ? +q.get("p") : 3, b: q.has("b") && [0, 1, 2].includes(+q.get("b")) ? +q.get("b") : 1, r: q.get("r") !== "0" };
  }
  function writeQuery(o) {
    const q = new URLSearchParams(location.search);
    q.set("s", o.s); q.set("c", o.c.join("~")); q.set("t", o.t); q.set("d", o.d); q.set("u", o.u); q.set("p", o.p); q.set("b", o.b); q.set("r", o.r ? "1" : "0");
    history.replaceState(null, "", "?" + q.toString());
  }

  // Order the chosen cities as a short route from the start: nearest unvisited city next.
  function route(o) {
    const left = o.c.filter((c) => c !== o.s), out = [o.s];
    while (left.length) { const last = out[out.length - 1]; left.sort((a, b) => dist(last, a) - dist(last, b)); out.push(left.shift()); }
    return out;
  }

  // Best way from a to b: a daytime train up to 7 h, else a direct flight, else an overnight train, else a car.
  function leg(a, b, pax) {
    const minClass = (t) => Math.min(...Object.values(t.classes));
    const trains = TR.poyezd.filter((t) => t.from === a && t.to === b);
    const day = trains.filter((t) => !t.night && t.dur <= 420).sort((x, y) => x.dur - y.dur)[0];
    const fl = TR.avia.filter((f) => f.from === a && f.to === b && !f.via).sort((x, y) => x.price - y.price)[0];
    const nt = trains.filter((t) => t.night)[0];
    if (day) return { mode: "train", no: `${day.name} ${day.no}`, dep: day.dep, arr: day.arr, dur: day.dur, cost: minClass(day) * pax };
    if (fl) return { mode: "avia", no: fl.no, dep: fl.dep, arr: fl.arr, dur: fl.dur, cost: fl.price * pax };
    if (nt) return { mode: "train", night: true, no: `${nt.name} ${nt.no}`, dep: nt.dep, arr: nt.arr, dur: nt.dur, cost: minClass(nt) * pax };
    const v = pax <= 3 ? "sedan" : pax <= 6 ? "miniven" : pax <= 16 ? "mikro" : "avtobus";
    const car = TR.avto.find((x) => x.from === a && x.to === b && x.vehicle === v);
    if (car) return { mode: "avto", no: car.name, km: car.km, dur: car.dur, cost: car.price };
    return null;
  }

  // A stay for one city in the chosen style; price is for the whole group per night.
  function stay(city, style, pax) {
    const hostels = LIST.filter((l) => l.city === city && l.type === "hostel").sort((a, b) => a.price - b.price);
    const hotels = LIST.filter((l) => l.city === city && l.type === "hotel");
    let pick;
    if (style === 0) pick = hostels[0] || hotels.slice().sort((a, b) => a.price - b.price)[0];
    else if (style === 2) pick = hotels.slice().sort((a, b) => (b.stars || 0) - (a.stars || 0) || b.rating - a.rating)[0];
    else { const sorted = hotels.slice().sort((a, b) => a.price - b.price), cap = sorted[Math.floor((sorted.length - 1) / 2)]; pick = sorted.filter((h) => h.price <= (cap ? cap.price : Infinity)).sort((a, b) => b.rating - a.rating)[0]; }
    if (!pick) return null;
    const night = pick.type === "hostel" ? pick.price * pax : pick.price * Math.ceil(pax / Math.max(2, Math.min(pick.capacity || 2, 4)));
    return { l: pick, night };
  }

  function plan(o) {
    const stops = route(o);
    const need = stops.length;
    let note = "";
    if (o.d < need) { note = fmt(S.tooShort, need); o.d = need; }
    // Share the days by weight, at least one each, and no more than the sights can fill plus one free day.
    const sightsOf = (c) => SIGHTS.filter((x) => x.city === c);
    const w = stops.map((c, i) => (i === 0 && !o.c.includes(c) ? 0.6 : WEIGHT[c] || 1));
    const cap = stops.map((c) => Math.max(1, Math.ceil(sightsOf(c).length / o.p) + 1));
    const days = stops.map(() => 1);
    for (let left = o.d - stops.length; left > 0; left--) {
      let best = -1, score = -1;
      stops.forEach((c, i) => { const s = w[i] / days[i] * (days[i] < cap[i] ? 1 : 0.25); if (s > score) { score = s; best = i; } });
      days[best]++;
    }
    const out = [];
    let n = 0, stayCost = 0, trCost = 0;
    stops.forEach((c, i) => {
      const list = sightsOf(c).slice();
      const st = stay(c, o.b, o.u);
      const nights = i === stops.length - 1 ? days[i] - 1 : days[i];
      if (st) stayCost += st.night * nights;
      for (let k = 0; k < days[i]; k++) {
        const d = { n: ++n, date: addDays(o.t, n - 1), city: c };
        let take = o.p;
        // An arrival day has less time: one place fewer, two fewer after a long ride.
        if (k === 0 && i > 0) { d.leg = leg(stops[i - 1], c, o.u); if (d.leg) { trCost += d.leg.cost; take = Math.max(1, o.p - (d.leg.dur > 240 ? 2 : 1)); } }
        d.sights = list.splice(0, take);
        if (k === 0 && st) d.stay = { ...st, nights };
        out.push(d);
      }
    });
    const last = out[out.length - 1];
    if (o.r && stops.length > 1 && last.city !== o.s) { last.back = leg(last.city, o.s, o.u); last.backTo = o.s; if (last.back) trCost += last.back.cost; }
    return { stops, days: out, stayCost, trCost, note };
  }

  // ---- drawing ----
  const MODE = { train: "🚆", avia: "✈️", avto: "🚗" };
  const legHtml = (l, title) => !l ? "" : `<div class="rj-leg"><span class="rj-ic" aria-hidden="true">${MODE[l.mode]}</span><div><b>${esc(title)}</b>
    <span>${esc(S[l.mode])}${l.night ? " (" + S.night + ")" : ""} · ${esc(l.no)}${l.dep ? ` · ${l.dep}–${l.arr}` : ""} · ${dur(l.dur)}${l.km ? ` · ${l.km} ${S.km}` : ""}</span>
    <span class="rj-price">≈ ${money(l.cost)}</span></div><a class="rj-link" href="./#transport">${S.ticket}</a></div>`;
  const sightName = (x) => (x[LANG] || x.uz)[0], sightText = (x) => (x[LANG] || x.uz)[1];

  function draw(o, res) {
    const out = page.querySelector("#rjOut");
    const total = res.stayCost + res.trCost;
    out.innerHTML = `${res.note ? `<p class="form-msg err">${esc(res.note)}</p>` : ""}
      <section class="sp-card rj-sum"><h2 class="sp-h2">${S.sum}</h2>
        <p class="rj-route">${res.stops.map((c) => `<span>${esc(T(c))}</span>`).join('<i aria-hidden="true">→</i>')}${o.r && res.stops.length > 1 ? `<i aria-hidden="true">→</i><span>${esc(T(o.s))}</span>` : ""}</p>
        <p>${fmt(S.sumDays, o.d, res.stops.length)} · ${fmt(S.pax, o.u)} · ${dateTxt(o.t, { day: "numeric", month: "long" })} – ${dateTxt(addDays(o.t, o.d - 1), { day: "numeric", month: "long", year: "numeric" })}</p>
        <dl class="rj-cost"><div><dt>${S.stayCost}</dt><dd>≈ ${money(res.stayCost)}</dd></div><div><dt>${S.trCost}</dt><dd>≈ ${money(res.trCost)}</dd></div><div class="rj-total"><dt>${S.total}</dt><dd>≈ ${money(total)}</dd></div></dl>
        <p class="muted rj-note">${S.sample} ${S.order}</p>
        <div class="rj-actions"><button type="button" class="btn btn-gold" id="rjCopy">${S.copy}</button><a class="btn btn-line" id="rjTg" target="_blank" rel="noopener">${S.tg}</a><button type="button" class="btn btn-line" id="rjIcs">${S.ics}</button><button type="button" class="btn btn-line" id="rjPrint">${S.print}</button></div>
      </section>
      <ol class="rj-days">${res.days.map((d) => `<li class="rj-day" data-city="${esc(d.city)}" data-date="${d.date}">
        <header><span class="rj-n">${fmt(S.day, d.n)}</span><h3>${esc(T(d.city))}</h3><time datetime="${d.date}">${dateTxt(d.date, { weekday: "short", day: "numeric", month: "short" })}</time><span class="rj-wx"></span></header>
        ${d.leg ? legHtml(d.leg, fmt(S.arrive, T(d.city))) : ""}
        ${d.sights.length ? `<ul class="rj-sights">${d.sights.map((x) => `<li><b>${esc(sightName(x))}</b><span>${esc(sightText(x))}</span></li>`).join("")}</ul>` : `<p class="muted">${S.free}</p>`}
        ${d.stay ? `<div class="rj-stay"><span class="rj-ic" aria-hidden="true">🛏️</span><div><b>${S.sleep}: ${esc(d.stay.l.name)}</b><span>${fmt(S.nights, d.stay.nights)} · ≈ ${money(d.stay.night * d.stay.nights)}${d.stay.l.real ? "" : ` · ${esc(T("Namuna"))}`}</span></div><a class="rj-link" href="./#joy=${esc(d.stay.l.id)}">${S.book}</a></div>`
          : d.n === 1 || d.leg ? `<p class="muted rj-nostay">${S.noStay} <a href="shahar/${slug(d.city)}.html">${S.city}</a></p>` : ""}
        ${d.back ? legHtml(d.back, fmt(S.backTo, T(d.backTo))) : ""}
      </li>`).join("")}</ol>`;
    const url = location.href;
    out.querySelector("#rjTg").href = "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(res.stops.map(T).join(" → "));
    out.querySelector("#rjCopy").onclick = (e) => { const b = e.currentTarget; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { b.textContent = S.copied; setTimeout(() => (b.textContent = S.copy), 2000); }, () => prompt(S.copy, url)); };
    out.querySelector("#rjPrint").onclick = () => print();
    out.querySelector("#rjIcs").onclick = () => ics(res);
    weather(o, res);
  }

  function ics(res) {
    const z = (s) => s.replace(/-/g, ""), now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const ev = res.days.map((d) => ["BEGIN:VEVENT", `UID:bron-${d.date}-${d.n}@bron.uz`, `DTSTAMP:${now}`, `DTSTART;VALUE=DATE:${z(d.date)}`, `DTEND;VALUE=DATE:${z(addDays(d.date, 1))}`,
      `SUMMARY:${fmt(S.day, d.n)}: ${T(d.city)}`, `DESCRIPTION:${d.sights.map(sightName).join(", ").replace(/[,;]/g, (c) => "\\" + c)}`, "END:VEVENT"].join("\r\n"));
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//bron.uz//reja//UZ", `X-WR-CALNAME:${S.icsName}`, ...ev, "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    a.download = "bron-reja.ics"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Daily forecast for each day of the trip, when it falls within the next 16 days (Open-Meteo, no key).
  function weather(o, res) {
    const end = addDays(o.t, o.d - 1), lim = addDays(localToday(), 15);
    if (o.t > lim) return;
    const unit = (() => { try { return localStorage.getItem("bron.unit") === "f" ? "fahrenheit" : "celsius"; } catch (e) { return "celsius"; } })();
    [...new Set(res.days.map((d) => d.city))].forEach((c) => {
      const g = GEO[c]; if (!g) return;
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 8000);
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g[0]}&longitude=${g[1]}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia%2FTashkent&temperature_unit=${unit}&start_date=${o.t}&end_date=${end < lim ? end : lim}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => {
          const dd = j.daily || {};
          (dd.time || []).forEach((t, i) => {
            const el = page.querySelector(`.rj-day[data-city="${CSS.escape(c)}"][data-date="${t}"] .rj-wx`);
            if (el) { el.textContent = `${icon(dd.weather_code[i])} ${Math.round(dd.temperature_2m_max[i])}° / ${Math.round(dd.temperature_2m_min[i])}°`; el.title = S.wx; }
          });
        }).catch(() => {});
    });
  }
  const icon = (w) => (w <= 1 ? "☀️" : w <= 3 ? "⛅" : w <= 48 ? "🌫️" : w <= 67 ? "🌧️" : w <= 77 ? "🌨️" : w <= 82 ? "🌦️" : "⛈️");

  // ---- form ----
  function form(o) {
    const opt = (arr, v) => arr.map((x, i) => `<option value="${i}"${i === v ? " selected" : ""}>${esc(x)}</option>`).join("");
    page.innerHTML = `<form class="sp-card rj-form" id="rjForm">
      <div class="rj-grid">
        <label>${S.start}<select name="s">${STARTS.map((c) => `<option value="${esc(c)}"${c === o.s ? " selected" : ""}>${esc(T(c))}</option>`).join("")}</select></label>
        <label>${S.date}<input type="date" name="t" value="${o.t}" min="${localToday()}"></label>
        <label>${S.days}<input type="number" name="d" min="1" max="14" value="${o.d}" inputmode="numeric"></label>
        <label>${S.people}<input type="number" name="u" min="1" max="16" value="${o.u}" inputmode="numeric"></label>
        <label>${S.pace}<select name="p">${opt(S.paceOpts, o.p - 2)}</select></label>
        <label>${S.style}<select name="b">${opt(S.styleOpts, o.b)}</select></label>
      </div>
      <fieldset class="rj-cities"><legend>${S.cities}</legend>${CITIES.map((c) => `<label class="rj-chip"><input type="checkbox" name="c" value="${esc(c)}"${o.c.includes(c) ? " checked" : ""}><span>${esc(T(c))}</span></label>`).join("")}</fieldset>
      <label class="rj-check"><input type="checkbox" name="r"${o.r ? " checked" : ""}> ${S.back}</label>
      <p class="form-msg" id="rjMsg" role="status"></p>
      <button class="btn btn-gold" type="submit">${S.make}</button>
    </form><div id="rjOut" aria-live="polite"></div>`;
    const f = page.querySelector("#rjForm");
    const run = () => {
      const fd = new FormData(f);
      const n = {
        s: fd.get("s"), t: fd.get("t") || o.t, d: Math.min(14, Math.max(1, +fd.get("d") || 1)), u: Math.min(16, Math.max(1, +fd.get("u") || 1)),
        p: +fd.get("p") + 2, b: +fd.get("b"), r: fd.get("r") === "on", c: fd.getAll("c")
      };
      const msg = page.querySelector("#rjMsg");
      if (!n.c.length) { msg.textContent = S.pick; msg.className = "form-msg err"; return; }
      msg.textContent = ""; msg.className = "form-msg";
      const res = plan(n);
      f.elements.d.value = n.d;
      writeQuery(n);
      draw(n, res);
    };
    f.addEventListener("submit", (e) => { e.preventDefault(); run(); page.querySelector("#rjOut").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); });
    f.addEventListener("change", run);
    run();
  }

  // Wait for the translation dictionary so city names come out in the visitor's language.
  const ready = () => !document.documentElement.classList.contains("i18n-wait");
  if (ready()) form(readQuery());
  else new MutationObserver((_, ob) => { if (ready()) { ob.disconnect(); form(readQuery()); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
})();
