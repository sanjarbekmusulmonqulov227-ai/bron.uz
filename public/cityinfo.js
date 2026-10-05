// City pages: local time in Uzbekistan (with the visitor's difference) and a 7-day forecast from Open-Meteo.
(function () {
  "use strict";
  const box = document.querySelector(".city-now");
  if (!box) return;
  const T = (s) => (window.BRON_I18N ? window.BRON_I18N.t(s) : s);
  const fmt = (tz, d, sec) => new Intl.DateTimeFormat("ru-RU", { timeZone: tz, hour: "2-digit", minute: "2-digit", ...(sec ? { second: "2-digit" } : {}) }).format(d);
  function offMin(tz, d) {
    try {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
      const g = (t) => +p.find((x) => x.type === t).value;
      return Math.round((Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - Math.floor(d.getTime() / 60000) * 60000) / 60000);
    } catch (e) { return null; }
  }
  const clock = box.querySelector(".cn-clock"), diff = box.querySelector(".cn-diff");
  function tick() {
    const d = new Date();
    clock.textContent = fmt("Asia/Tashkent", d, true);
    const mine = Intl.DateTimeFormat().resolvedOptions().timeZone, m = offMin(mine, d), u = offMin("Asia/Tashkent", d) ?? 300;
    if (m == null || m === u) { diff.textContent = ""; return; }
    const h = String(Math.abs(m - u) / 60).replace(".", ",");
    diff.textContent = T(`Sizning vaqtingiz: ${fmt(mine, d)}`) + " · " + T(m > u ? `Toshkentdan ${h} soat oldinda` : `Toshkentdan ${h} soat orqada`);
  }
  tick(); setInterval(tick, 1000);
  const W = (c) => c === 0 ? ["☀️", "Ochiq"] : c <= 2 ? ["🌤️", "Qisman bulutli"] : c === 3 ? ["☁️", "Bulutli"] : c <= 48 ? ["🌫️", "Tuman"] : c <= 67 || (c >= 80 && c <= 82) ? ["🌧️", "Yomg'ir"] : c <= 77 || c === 85 || c === 86 ? ["🌨️", "Qor"] : ["⛈️", "Momaqaldiroq"];
  const lang = (window.BRON_I18N && window.BRON_I18N.lang) || "uz";
  const loc = lang === "ru" ? "ru-RU" : lang === "en" ? "en-GB" : "uz-Latn-UZ";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let unit = "c";
  try { unit = JSON.parse(localStorage.getItem("bron.unit")) === "f" ? "f" : "c"; } catch (e) { /* storage blocked */ }
  const deg = (c) => unit === "f" ? `${Math.round(c * 9 / 5 + 32)}°F` : `${Math.round(c)}°`;
  const body = box.querySelector(".cn-body");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${box.dataset.lat}&longitude=${box.dataset.lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=Asia%2FTashkent`;
  function get(tries) {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const t = ctl && setTimeout(() => ctl.abort(), 10000);
    fetch(url, ctl ? { signal: ctl.signal } : {})
      .then((r) => r.json().then((j) => (r.ok && j && !j.error ? j : Promise.reject(j && j.reason))))
      .then((j) => {
        const c = j.current, d = j.daily;
        const UZ = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
        const wd = (t) => { try { return lang === "uz" ? UZ[new Date(t + "T12:00").getDay()] : new Intl.DateTimeFormat(loc, { weekday: "short" }).format(new Date(t + "T12:00")); } catch (e) { return t.slice(5); } };
        body.innerHTML = `<p class="cn-now"><span class="wx-ic" aria-hidden="true">${W(c.weather_code)[0]}</span> <b>${deg(c.temperature_2m)}</b> ${esc(W(c.weather_code)[1])} · ${Math.round(c.wind_speed_10m)} km/h · ${Math.round(c.relative_humidity_2m)}%</p>
          <div class="wx-days">${d.time.map((t, i) => `<div class="wx-day"><small>${i ? esc(wd(t)) : "Bugun"}</small><span class="wx-ic" aria-hidden="true">${W(d.weather_code[i])[0]}</span><b>${deg(d.temperature_2m_max[i])}</b><small>${deg(d.temperature_2m_min[i])}</small></div>`).join("")}</div>
          <p class="muted small">Prognoz: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a></p>`;
      })
      .catch(() => {
        if (tries > 0) return setTimeout(() => get(tries - 1), 3000);
        body.innerHTML = `<p class="muted small">Ob-havo ma'lumotini hozir yuklab bo'lmadi.</p><button class="btn btn-line" type="button">Qayta urinish</button>`;
        body.querySelector("button").addEventListener("click", () => { body.innerHTML = `<p class="muted small">Ob-havo yuklanmoqda…</p>`; get(1); });
      })
      .finally(() => { if (t) clearTimeout(t); });
  }
  get(1);
})();
