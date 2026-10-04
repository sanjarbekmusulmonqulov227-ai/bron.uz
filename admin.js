(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  const d = (s) => s ? s.slice(0, 10).split("-").reverse().join(".") : "";
  const STATUSES = ["yangi", "tasdiqlandi", "bekor qilindi", "yakunlandi"];
  const TYPE = { hotel: "Mehmonxona", hostel: "Hostel", venue: "Zal", tour: "Tur", transport: "Transport" };
  let listings = [];
  // Amenity names the site understands (same keys as public/app.js AMEN).
  const AMEN = { wifi: "Wi-Fi", breakfast: "Nonushta", pool: "Basseyn", spa: "Spa", gym: "Fitnes", parking: "Avtoturargoh", restaurant: "Restoran", transfer: "Transfer", ac: "Konditsioner", family: "Oilalar uchun", translation: "Sinxron tarjima", screen: "LED ekran", coffee: "Kofe-breyk", stage: "Sahna", guide: "Gid", tickets: "Chiptalar kiradi", meal: "Ovqat kiradi", transport: "Transport" };
  const amenKey = (t) => { const v = t.trim().toLowerCase(); return Object.keys(AMEN).find((k) => k === v || AMEN[k].toLowerCase() === v); };

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

  async function loadPartners() {
    const rows = await call("GET", "/api/admin/partner-requests");
    $("#partnersBody").innerHTML = rows.length ? rows.map((r) => `<tr>
      <td class="num">${d(r.created)}</td><td><b>${esc(r.property)}</b></td><td>${esc(TYPE[r.type] || r.type)}</td><td>${esc(r.city)}</td><td class="num">${r.units || ""}</td>
      <td>${esc(r.contact)}<div class="muted">${esc(r.phone)}</div></td>
      <td>${statusSelect("partner-requests", r.id, r.status)}</td></tr>`).join("") : `<tr><td colspan="7" class="muted">Hamkorlik arizalari hali yo'q.</td></tr>`;
  }

  async function loadListings() {
    listings = await call("GET", "/api/admin/listings");
    $("#listingsBody").innerHTML = listings.map((x) => `<tr>
      <td>${esc(x.name)}</td><td>${TYPE[x.type]}</td><td>${esc(x.city)}</td><td class="num">${som(x.price)}</td><td class="num">${x.capacity}</td>
      <td>${x.active ? '<span class="pill">saytda</span>' : '<span class="pill muted">yashirin</span>'}</td>
      <td style="white-space:nowrap">${x.type === "tour" ? '<span class="muted">—</span>' : `<input size="14" placeholder="+998..." value="${esc(x.owner)}" data-owner-input="${esc(x.id)}"> <button class="btn line" data-owner="${esc(x.id)}">Biriktirish</button>`}</td>
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
    $("#lTags").value = x ? (x.amenities || x.tags || []).map((k) => AMEN[k] || k).join(", ") : "";
    $("#lHue").value = x ? x.hue : 200;
    $("#lPhoto").value = x && x.photo ? x.photo : "";
    $("#lDesc").value = x && x.desc ? x.desc : "";
    $("#lSave").textContent = x ? "Saqlash" : "Qo'shish";
    $("#lCancel").hidden = !x;
  }
  const formData = () => ({ type: $("#lType").value, name: $("#lName").value, city: $("#lCity").value, price: $("#lPrice").value, capacity: $("#lCap").value, rating: $("#lRating").value, reviews: $("#lReviews").value, tags: $("#lTags").value, amenities: $("#lTags").value.split(",").map(amenKey).filter(Boolean), hue: $("#lHue").value, photo: $("#lPhoto").value.trim(), desc: $("#lDesc").value.trim() });

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
        ["bookings", "requests", "listings", "partners"].forEach((k) => { $("#tab-" + k).hidden = k !== t.dataset.tab; });
        ({ bookings: loadBookings, requests: loadRequests, listings: loadListings, partners: loadPartners })[t.dataset.tab]();
      } else if (t.dataset.edit) { fillForm(listings.find((x) => x.id === t.dataset.edit)); window.scrollTo(0, 0); }
      else if (t.dataset.hide) { await call("DELETE", `/api/admin/listings/${t.dataset.hide}`); say("Joy saytdan yashirildi.", true); loadListings(); }
      else if (t.dataset.show) { const x = listings.find((y) => y.id === t.dataset.show); await call("PUT", `/api/admin/listings/${x.id}`, { ...x, active: true }); say("Joy saytga qaytarildi.", true); loadListings(); }
      else if (t.dataset.owner) {
        const phone = document.querySelector(`[data-owner-input="${CSS.escape(t.dataset.owner)}"]`).value.trim();
        const r = await call("POST", `/api/admin/listings/${encodeURIComponent(t.dataset.owner)}/owner`, { phone });
        say(r.owner ? `Joy ${r.owner} raqamiga biriktirildi.` : "Egasi olib tashlandi.", true); loadListings();
      }
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

  // ---------- bulk import ----------
  // CSV with a header row (quoted fields allowed) or a JSON array; lists inside a cell use ";" (amenities) and "|" (photos).
  function parseCsv(text) {
    const rows = []; let row = [], cell = "", q = false;
    const sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
      else cell += c;
    }
    row.push(cell); if (row.some((x) => x.trim())) rows.push(row);
    const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
    return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()]).filter(([h, v]) => h && v !== "")));
  }
  const listOf = (v, re) => Array.isArray(v) ? v : String(v || "").split(re).map((t) => t.trim()).filter(Boolean);
  function importRows() {
    const text = $("#impText").value.trim();
    if (!text) throw new Error("Fayl tanlang yoki ma'lumotni joylang.");
    let rows = /^[[{]/.test(text) ? JSON.parse(text) : parseCsv(text);
    if (!Array.isArray(rows)) rows = rows.items || [rows];
    return rows.map((r) => ({
      ...r,
      type: String(r.type || "hotel").toLowerCase(),
      amenities: listOf(r.amenities, /[;|]/).map((t) => amenKey(t) || t.toLowerCase()).filter(Boolean),
      photos: listOf(r.photos, /[|\s]+/).filter((u) => /^https:\/\//.test(typeof u === "string" ? u : u.url || "") || (u && u.file)),
      photo: r.photo || undefined
    }));
  }
  $("#impFile").addEventListener("change", async () => { const f = $("#impFile").files[0]; if (f) $("#impText").value = await f.text(); });
  $("#impTpl").addEventListener("click", () => {
    const csv = "id,type,name,city,district,stars,price,capacity,rating,reviews,amenities,photos,desc,lat,lng\n,hotel,Misol Hotel,Nukus,Markaz,3,450000,3,8.6,0,wifi;breakfast;parking,https://example.com/1.jpg|https://example.com/2.jpg,\"Qisqa tavsif, xonalar haqida\",42.46,59.61\n";
    $("#impTpl").href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
  });
  $("#impCheck").addEventListener("click", () => {
    try {
      const rows = importRows();
      const bad = rows.map((r, i) => !r.name || !r.city || !(+r.price > 0) || !(+r.capacity > 0) ? i + 1 : 0).filter(Boolean);
      $("#impOut").textContent = `${rows.length} ta qator o'qildi. ${bad.length ? `Nomi, shahri, narxi yoki sig'imi yo'q qatorlar: ${bad.slice(0, 20).join(", ")}.` : "Hammasi to'g'ri ko'rinadi."}`;
    } catch (err) { $("#impOut").textContent = err.message; }
  });
  $("#impGo").addEventListener("click", async () => {
    try {
      const rows = importRows();
      $("#impOut").textContent = "Yuklanmoqda...";
      const r = await call("POST", "/api/admin/listings/import", { items: rows });
      $("#impOut").textContent = `Qo'shildi: ${r.added}, yangilandi: ${r.updated}, xato: ${r.failed}.` + (r.errors.length ? " " + r.errors.map((e) => `${e.row}-qator: ${e.error}`).join(" ") : "");
      loadListings();
    } catch (err) { $("#impOut").textContent = err.message; }
  });

  loadBookings().catch((err) => say(err.message));
  setInterval(() => { if (!$("#tab-bookings").hidden) loadBookings().catch(() => {}); }, 30000);
})();
