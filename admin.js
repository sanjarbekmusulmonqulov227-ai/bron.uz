(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  const d = (s) => s ? s.slice(0, 10).split("-").reverse().join(".") : "";
  const STATUSES = ["yangi", "tasdiqlandi", "bekor qilindi", "yakunlandi"];
  const TYPE = { hotel: "Mehmonxona", venue: "Zal", tour: "Tur" };
  let listings = [];

  function say(t, ok) { const m = $("#msg"); m.textContent = t; m.className = "msg " + (ok ? "ok" : "err"); if (ok) setTimeout(() => { m.textContent = ""; }, 2500); }
  async function call(method, url, body) {
    const r = await fetch(url, { method, headers: method === "GET" ? {} : { "content-type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Xatolik (${r.status})`);
    return data;
  }
  const statusSelect = (kind, id, cur) => `<select data-kind="${kind}" data-id="${esc(id)}">${STATUSES.map((s) => `<option${s === cur ? " selected" : ""}>${s}</option>`).join("")}</select>`;

  async function loadBookings() {
    const rows = await call("GET", "/api/admin/bookings");
    const active = rows.filter((r) => r.status !== "bekor qilindi");
    const fresh = rows.filter((r) => r.status === "yangi").length;
    const total = active.reduce((a, r) => a + r.sum, 0);
    $("#stats").innerHTML = `<div class="stat"><b>${fresh}</b><span>yangi bron</span></div><div class="stat"><b>${active.length}</b><span>faol bronlar</span></div><div class="stat"><b>${som(total)}</b><span>faol bronlar summasi</span></div>`;
    $("#bookingsBody").innerHTML = rows.length ? rows.map((r) => `<tr>
      <td><b>${esc(r.code)}</b><div class="muted">${d(r.created)}</div></td>
      <td>${esc(r.listing_name)}<div class="muted">${esc(r.city)}</div></td>
      <td class="num">${d(r.date_from)}${r.date_to !== r.date_from ? "<br>" + d(r.date_to) : ""}</td>
      <td class="num">${r.guests}</td>
      <td class="num">${som(r.sum)}</td>
      <td>${esc(r.client)}<div class="muted">${esc(r.phone)}</div>${r.note ? `<div class="muted">${esc(r.note)}</div>` : ""}</td>
      <td>${esc(r.pay)}</td>
      <td>${statusSelect("bookings", r.code, r.status)}</td></tr>`).join("") : `<tr><td colspan="8" class="muted">Hali bron yo'q. Saytdan bron qilinganda shu yerda paydo bo'ladi.</td></tr>`;
  }

  async function loadRequests() {
    const rows = await call("GET", "/api/admin/requests");
    $("#requestsBody").innerHTML = rows.length ? rows.map((r) => `<tr>
      <td class="num">${d(r.created)}</td><td>${esc(r.company)}</td><td>${esc(r.kind)}</td><td class="num">${r.people}</td><td>${esc(r.phone)}</td>
      <td>${statusSelect("requests", r.id, r.status)}</td></tr>`).join("") : `<tr><td colspan="6" class="muted">Guruh so'rovlari hali yo'q.</td></tr>`;
  }

  async function loadListings() {
    listings = await call("GET", "/api/admin/listings");
    $("#listingsBody").innerHTML = listings.map((x) => `<tr>
      <td>${esc(x.name)}</td><td>${TYPE[x.type]}</td><td>${esc(x.city)}</td><td class="num">${som(x.price)}</td><td class="num">${x.capacity}</td>
      <td>${x.active ? '<span class="pill">saytda</span>' : '<span class="pill muted">yashirin</span>'}</td>
      <td style="white-space:nowrap"><button class="btn line" data-edit="${esc(x.id)}">Tahrirlash</button> ${x.active ? `<button class="btn line" data-hide="${esc(x.id)}">Yashirish</button>` : `<button class="btn line" data-show="${esc(x.id)}">Qaytarish</button>`}</td></tr>`).join("");
  }

  function fillForm(x) {
    $("#lId").value = x ? x.id : "";
    $("#lType").value = x ? x.type : "hotel";
    $("#lName").value = x ? x.name : "";
    $("#lCity").value = x ? x.city : "";
    $("#lPrice").value = x ? x.price : "";
    $("#lCap").value = x ? x.capacity : "";
    $("#lRating").value = x ? x.rating : 9;
    $("#lReviews").value = x ? x.reviews : 0;
    $("#lTags").value = x ? x.tags.join(", ") : "";
    $("#lHue").value = x ? x.hue : 200;
    $("#lPhoto").value = x && x.photo ? x.photo : "";
    $("#lDesc").value = x && x.desc ? x.desc : "";
    $("#lSave").textContent = x ? "Saqlash" : "Qo'shish";
    $("#lCancel").hidden = !x;
  }
  const formData = () => ({ type: $("#lType").value, name: $("#lName").value, city: $("#lCity").value, price: $("#lPrice").value, capacity: $("#lCap").value, rating: $("#lRating").value, reviews: $("#lReviews").value, tags: $("#lTags").value, hue: $("#lHue").value, photo: $("#lPhoto").value.trim(), desc: $("#lDesc").value.trim() });

  document.addEventListener("change", async (e) => {
    const s = e.target.closest("select[data-kind]");
    if (!s) return;
    try { await call("PATCH", `/api/admin/${s.dataset.kind}/${encodeURIComponent(s.dataset.id)}`, { status: s.value }); say("Holat saqlandi.", true); if (s.dataset.kind === "bookings") loadBookings(); }
    catch (err) { say(err.message); }
  });
  document.addEventListener("click", async (e) => {
    const t = e.target;
    try {
      if (t.dataset.tab) {
        document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b === t));
        ["bookings", "requests", "listings"].forEach((k) => { $("#tab-" + k).hidden = k !== t.dataset.tab; });
        ({ bookings: loadBookings, requests: loadRequests, listings: loadListings })[t.dataset.tab]();
      } else if (t.dataset.edit) { fillForm(listings.find((x) => x.id === t.dataset.edit)); window.scrollTo(0, 0); }
      else if (t.dataset.hide) { await call("DELETE", `/api/admin/listings/${t.dataset.hide}`); say("Joy saytdan yashirildi.", true); loadListings(); }
      else if (t.dataset.show) { const x = listings.find((y) => y.id === t.dataset.show); await call("PUT", `/api/admin/listings/${x.id}`, { ...x, active: true }); say("Joy saytga qaytarildi.", true); loadListings(); }
      else if (t.id === "lCancel") fillForm(null);
    } catch (err) { say(err.message); }
  });
  $("#listingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("#lId").value;
    try {
      if (id) { const cur = listings.find((x) => x.id === id); await call("PUT", `/api/admin/listings/${id}`, { ...(cur || {}), ...formData(), active: cur ? cur.active : true }); say("Saqlandi.", true); }
      else { await call("POST", "/api/admin/listings", formData()); say("Yangi joy qo'shildi.", true); }
      fillForm(null); loadListings();
    } catch (err) { say(err.message); }
  });

  loadBookings().catch((err) => say(err.message));
  setInterval(() => { if (!$("#tab-bookings").hidden) loadBookings().catch(() => {}); }, 30000);
})();
