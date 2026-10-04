(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const T = (s) => (window.BRON_I18N ? window.BRON_I18N.t(s) : s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  const d = (s) => s ? s.slice(0, 10).split("-").reverse().join(".") : "";
  const TYPE = { hotel: "Mehmonxona", hostel: "Hostel", venue: "Zal", tour: "Tur" };
  const UNIT = { hotel: "Xonalar soni", hostel: "O'rinlar soni" };
  const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const ST = { yangi: "st-new", tasdiqlandi: "st-ok", "bekor qilindi": "st-off", yakunlandi: "st-done" };
  let me = null;
  let month = new Date().toISOString().slice(0, 7);


  function say(t, ok) { const m = $("#pcMsg"); m.textContent = t; m.style.color = ok ? "var(--ok)" : "var(--err)"; if (ok) setTimeout(() => { if (m.textContent === t) m.textContent = ""; }, 2500); }
  async function call(method, url, body) {
    const r = await fetch(url, { method, credentials: "same-origin", headers: method === "GET" ? { accept: "application/json" } : { "content-type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || `Xatolik (${r.status})`); e.status = r.status; throw e; }
    return data;
  }
  const show = (id) => ["#pcStatic", "#pcLogin", "#pcMain"].forEach((s) => { $(s).hidden = s !== id; });

  async function start() {
    let r;
    try { r = await fetch("api/auth/me", { credentials: "same-origin", headers: { accept: "application/json" } }); } catch (e) { r = null; }
    if (!r || !r.ok || !String(r.headers.get("content-type") || "").includes("json")) return show("#pcStatic");
    const u = await r.json().catch(() => null);
    if (!u || !u.id) return show("#pcLogin");
    await enter();
  }

  async function enter() {
    me = await call("GET", "api/partner/me");
    show("#pcMain");
    $("#pcOut").hidden = false;
    $("#pcName").textContent = me.user.name || me.user.phone;
    const none = !me.listings.length;
    $("#pcEmpty").hidden = !none;
    $("#pcTabs").hidden = none;
    document.querySelectorAll(".pc-tab").forEach((t) => { t.hidden = none || t.id !== "pc-bookings"; });
    if (none) return;
    $("#pcCalListing").innerHTML = me.listings.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
    await loadBookings();
  }

  async function loadBookings() {
    const rows = await call("GET", "api/partner/bookings");
    const fresh = rows.filter((r) => r.status === "yangi").length;
    $("#pc-bookings").innerHTML = `<div class="pc-stats"><div><b>${fresh}</b><span>yangi</span></div><div><b>${rows.filter((r) => r.status === "tasdiqlandi").length}</b><span>tasdiqlangan</span></div><div><b>${som(rows.filter((r) => r.status !== "bekor qilindi").reduce((a, r) => a + r.sum, 0))}</b><span>faol bronlar summasi</span></div></div>` +
      (rows.length ? `<div class="pc-list">${rows.map((r) => `<article class="pc-row">
        <div><b>${esc(r.code)}</b> <span class="st ${ST[r.status] || ""}">${esc(r.status)}</span><div class="muted small">${esc(r.listing_name)}</div></div>
        <div>${d(r.date_from)}${r.date_to !== r.date_from ? " – " + d(r.date_to) : ""}<div class="muted small">${r.guests} kishi · ${esc(r.pay)}</div></div>
        <div>${esc(r.client)}<div class="muted small"><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></div>${r.note ? `<div class="muted small">${esc(r.note)}</div>` : ""}</div>
        <div class="pc-sum">${som(r.sum)}</div>
        <div class="pc-acts">${r.status === "yangi" ? `<button class="btn btn-ink" data-st="tasdiqlandi" data-code="${esc(r.code)}">Tasdiqlash</button>` : ""}
          ${r.status === "yangi" || r.status === "tasdiqlandi" ? `<button class="btn btn-line" data-st="bekor qilindi" data-code="${esc(r.code)}">Bekor qilish</button>` : ""}
          ${r.status === "tasdiqlandi" ? `<button class="btn btn-line" data-st="yakunlandi" data-code="${esc(r.code)}">Yakunlandi</button>` : ""}</div>
      </article>`).join("")}</div>` : `<div class="pc-box"><p class="muted">Hali bron yo'q. Mijoz saytdan bron qilishi bilan shu yerda paydo bo'ladi.</p></div>`);
  }

  function renderListings() {
    const base = location.origin + location.pathname.replace(/[^/]*$/, "");
    $("#pc-listings").innerHTML = `<div class="pc-list">${me.listings.map((x) => `<form class="pc-row pc-edit" data-id="${esc(x.id)}">
      <div><b>${esc(x.name)}</b><div class="muted small">${TYPE[x.type] || ""} · ${esc(x.city)}</div></div>
      <label class="field"><span>Narx (so'm)</span><input name="price" type="number" min="1" value="${x.price}" required></label>
      ${UNIT[x.type] ? `<label class="field"><span>${UNIT[x.type]}</span><input name="units" type="number" min="1" max="500" value="${x.capacityPerDay}"></label>` : `<div class="muted small">Kuniga ${x.capacityPerDay} ta bron</div>`}
      <label class="pc-check"><input name="active" type="checkbox"${x.active === false ? "" : " checked"}> Saytda ko'rinsin</label>
      <div class="pc-acts"><button class="btn btn-ink" type="submit">Saqlash</button></div>
      <label class="field pc-ical"><span>iCal havola (Booking.com, Airbnb, Google Calendar uchun)</span><span class="pc-copy"><input readonly value="${esc(base + x.ical.replace(/^\//, ""))}"><button class="btn btn-line" type="button" data-copy>Nusxa</button></span></label>
    </form>`).join("")}</div>`;
  }

  async function loadCalendar() {
    const id = $("#pcCalListing").value;
    const [y, m] = month.split("-").map(Number);
    $("#pcMonth").textContent = `${MONTHS[m - 1]} ${y}`;
    const data = await call("GET", `api/partner/listings/${encodeURIComponent(id)}/calendar?month=${month}`);
    const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const head = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((w) => `<div class="pc-wd">${w}</div>`).join("");
    $("#pcCal").innerHTML = head + "<div></div>".repeat(lead) + data.days.map((x) => {
      const cls = x.blocked ? "d-block" : x.used >= x.cap ? "d-full" : x.used > 0 ? "d-part" : "d-free";
      return `<button type="button" class="pc-day ${cls}" data-day="${x.date}" data-blocked="${x.blocked ? 1 : 0}" aria-label="${d(x.date)}: ${x.blocked ? "yopilgan" : `${x.used} / ${x.cap} band`}"><b>${Number(x.date.slice(8))}</b><span>${x.blocked ? "yopiq" : `${x.used}/${x.cap}`}</span></button>`;
    }).join("");
  }

  function tab(k) {
    document.querySelectorAll("#pcTabs .seg-b").forEach((b) => b.classList.toggle("is-on", b.dataset.pc === k));
    document.querySelectorAll(".pc-tab").forEach((t) => { t.hidden = t.id !== "pc-" + k; });
    if (k === "bookings") return loadBookings();
    if (k === "listings") return call("GET", "api/partner/me").then((r) => { me = r; renderListings(); });
    return loadCalendar();
  }

  document.addEventListener("click", async (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    try {
      if (t.dataset.pc) await tab(t.dataset.pc);
      else if (t.dataset.st) {
        if (t.dataset.st === "bekor qilindi" && !confirm(T("Bronni bekor qilasizmi? Mijozga o'zingiz qo'ng'iroq qilib xabar bering."))) return;
        await call("PATCH", `api/partner/bookings/${t.dataset.code}`, { status: t.dataset.st }); say("Holat saqlandi.", true); await loadBookings();
      } else if (t.dataset.day) {
        await call("POST", `api/partner/listings/${encodeURIComponent($("#pcCalListing").value)}/blocks`, { date: t.dataset.day, blocked: t.dataset.blocked !== "1" });
        await loadCalendar();
      } else if (t.hasAttribute("data-copy")) {
        const inp = t.previousElementSibling; inp.select();
        try { await navigator.clipboard.writeText(inp.value); } catch (err) { document.execCommand("copy"); }
        say("Havola nusxalandi.", true);
      } else if (t.id === "pcPrev" || t.id === "pcNext") {
        const [y, m] = month.split("-").map(Number);
        const n = new Date(Date.UTC(y, m - 1 + (t.id === "pcNext" ? 1 : -1), 1));
        month = n.toISOString().slice(0, 7); await loadCalendar();
      } else if (t.id === "pcOut") {
        await call("POST", "api/auth/logout"); location.reload();
      }
    } catch (err) { if (err.status === 401) return show("#pcLogin"); say(err.message); }
  });
  $("#pcCalListing").addEventListener("change", () => loadCalendar().catch((err) => say(err.message)));
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest(".pc-edit");
    if (!f) return;
    e.preventDefault();
    try {
      await call("PUT", `api/partner/listings/${encodeURIComponent(f.dataset.id)}`, { price: f.price.value, units: f.units ? f.units.value : undefined, active: f.active.checked });
      say("Saqlandi. Saytda darhol yangilandi.", true);
    } catch (err) { say(err.message); }
  });
  $("#pcLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const m = $("#pcLoginMsg");
    try { await call("POST", "api/auth/login", { phone: $("#pcPhone").value, password: $("#pcPass").value }); m.textContent = ""; await enter(); }
    catch (err) { m.textContent = err.message; m.style.color = "var(--err)"; }
  });

  start().catch((err) => { show("#pcMain"); say(err.message); });
})();
