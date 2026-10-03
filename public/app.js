// bron.uz front-end: listings, search, booking dialog, local "my bookings".
// With server.js running, listings and bookings go through /api. Opened as a plain file
// (or in a preview without the server) it falls back to the sample data below and localStorage.
(function () {
  "use strict";

  let LISTINGS = [
    { id: "h1", type: "hotel", name: "Registon Saroy Hotel", city: "Samarqand", rating: 9.1, reviews: 412, price: 980000, capacity: 4, tags: ["Nonushta", "Wi-Fi", "Registon 5 daqiqa"], hue: 205, glyph: "★5" },
    { id: "h2", type: "hotel", name: "Chorsu Boutique", city: "Toshkent", rating: 8.6, reviews: 238, price: 640000, capacity: 3, tags: ["Metro yonida", "Wi-Fi", "Avtoturargoh"], hue: 175, glyph: "★4" },
    { id: "h3", type: "hotel", name: "Labi Hovuz Guest House", city: "Buxoro", rating: 9.4, reviews: 527, price: 520000, capacity: 4, tags: ["Hovli", "Nonushta", "Eski shahar"], hue: 30, glyph: "★3" },
    { id: "h4", type: "hotel", name: "Ichan Qal'a Inn", city: "Xiva", rating: 8.9, reviews: 189, price: 460000, capacity: 3, tags: ["Qal'a ichida", "Terrasa"], hue: 15, glyph: "★3" },
    { id: "h5", type: "hotel", name: "Tashkent City Plaza", city: "Toshkent", rating: 8.8, reviews: 903, price: 1450000, capacity: 4, tags: ["Basseyn", "Fitnes", "Biznes-markaz"], hue: 220, glyph: "★5" },
    { id: "h6", type: "hotel", name: "Siyob Family Hotel", city: "Samarqand", rating: 8.3, reviews: 146, price: 390000, capacity: 5, tags: ["Oilaviy", "Transfer"], hue: 150, glyph: "★3" },

    { id: "v1", type: "venue", name: "Navoiy Kongress Zali", city: "Toshkent", rating: 9.0, reviews: 64, price: 18500000, capacity: 600, tags: ["Sinxron tarjima", "LED ekran", "Kofe-breyk"], hue: 230, glyph: "600" },
    { id: "v2", type: "venue", name: "Afrosiyob Forum Hall", city: "Samarqand", rating: 9.2, reviews: 41, price: 12000000, capacity: 350, tags: ["Proyektor", "Mikrofonlar", "Fuye"], hue: 195, glyph: "350" },
    { id: "v3", type: "venue", name: "Mirzo Ulug'bek Seminar Xonasi", city: "Toshkent", rating: 8.7, reviews: 88, price: 2400000, capacity: 40, tags: ["Doska", "Videoaloqa", "Tushlik"], hue: 165, glyph: "40" },
    { id: "v4", type: "venue", name: "Ark Ziyofat Zali", city: "Buxoro", rating: 8.9, reviews: 37, price: 7800000, capacity: 220, tags: ["Banket", "Sahna", "Ovoz tizimi"], hue: 25, glyph: "220" },

    { id: "t1", type: "tour", name: "Samarqand: Registon va Shohi Zinda", city: "Samarqand", rating: 9.6, reviews: 712, price: 350000, capacity: 30, tags: ["6 soat", "Gid", "O'zbek / rus / ingliz"], hue: 200, glyph: "6s" },
    { id: "t2", type: "tour", name: "Buxoro kechki sayr va milliy taomlar", city: "Buxoro", rating: 9.3, reviews: 301, price: 280000, capacity: 20, tags: ["3 soat", "Kechki ovqat"], hue: 35, glyph: "3s" },
    { id: "t3", type: "tour", name: "Toshkent metrosi va Eski shahar", city: "Toshkent", rating: 9.0, reviews: 455, price: 220000, capacity: 25, tags: ["4 soat", "Piyoda"], hue: 180, glyph: "4s" },
    { id: "t4", type: "tour", name: "Xiva: Ichan Qal'a to'liq ekskursiya", city: "Xiva", rating: 9.5, reviews: 267, price: 300000, capacity: 25, tags: ["5 soat", "Chiptalar kiradi"], hue: 10, glyph: "5s" },
    { id: "t5", type: "tour", name: "Chimyon va Chorvoq: bir kunlik safar", city: "Toshkent", rating: 9.1, reviews: 384, price: 540000, capacity: 40, tags: ["10 soat", "Transport", "Tushlik"], hue: 140, glyph: "1k" }
  ];

  // Per-type wording: unit of price, date labels, guest label.
  const TYPES = {
    hotel: { title: "Mehmonxonalar", kind: "Mehmonxona", unit: "1 kecha", from: "Kelish", to: "Ketish", guests: "Mehmonlar", noun: "kecha" },
    venue: { title: "Konferens-zallar", kind: "Zal", unit: "1 kun", from: "Boshlanish", to: "Tugash", guests: "Qatnashchilar", noun: "kun" },
    tour:  { title: "Turlar va ekskursiyalar", kind: "Tur", unit: "1 kishi", from: "Sana", to: "Qaytish", guests: "Kishilar", noun: "kishi" }
  };

  const STORE_KEY = "bronuz.bookings";
  let API = false; // true once /api/listings answered

  async function api(path, body) {
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Server javob bermadi. Keyinroq urinib ko'ring.");
    return data;
  }
  const $ = (s) => document.querySelector(s);
  const state = { type: "hotel", city: "", from: "", to: "", guests: 2, sort: "rec", current: null };

  // ---------- helpers ----------
  const som = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  const iso = (d) => d.toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normPhone = (p) => p.replace(/[\s()-]/g, "");
  const validPhone = (p) => /^\+998\d{9}$/.test(normPhone(p));
  const fmtDate = (s) => { const [y, m, d] = s.split("-"); return `${d}.${m}.${y}`; };

  function loadBookings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function saveBookings(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* storage blocked: keep in memory only */ }
    memoryBookings = list;
  }
  let memoryBookings = loadBookings();

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // Total price for a listing given dates and guests.
  function quote(item, from, to, guests) {
    const t = TYPES[item.type];
    if (item.type === "tour") return { qty: guests, label: `${som(item.price)} × ${guests} ${t.noun}`, sum: item.price * guests };
    const n = Math.max(1, daysBetween(from, to) + (item.type === "venue" ? 1 : 0));
    return { qty: n, label: `${som(item.price)} × ${n} ${t.noun}`, sum: item.price * n };
  }

  // ---------- search ----------
  function setType(type) {
    state.type = type;
    document.querySelectorAll(".tab").forEach((b) => {
      const on = b.dataset.type === type;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
    const t = TYPES[type];
    $("#fFromLabel").textContent = t.from;
    $("#fToLabel").textContent = t.to;
    $("#fGuestsLabel").textContent = t.guests;
    $("#fTo").closest(".field").hidden = type === "tour";
    if (type === "venue" && +$("#fGuests").value < 10) $("#fGuests").value = 50;
    if (type !== "venue" && +$("#fGuests").value > 40) $("#fGuests").value = 2;
    readSearch();
    render();
  }

  function readSearch() {
    state.city = $("#fCity").value;
    state.from = $("#fFrom").value;
    state.to = $("#fTo").value;
    state.guests = Math.max(1, parseInt($("#fGuests").value, 10) || 1);
    state.sort = $("#fSort").value;
  }

  function validateSearch() {
    const msg = $("#searchMsg");
    msg.className = "form-msg";
    msg.textContent = "";
    const today = iso(new Date());
    if (!state.from) return fail("Sanani tanlang.");
    if (state.from < today) return fail("O'tgan sanani tanlab bo'lmaydi. Bugungi yoki keyingi kunni tanlang.");
    if (state.type !== "tour" && state.to < state.from) return fail(`"${TYPES[state.type].to}" sanasi "${TYPES[state.type].from}" sanasidan keyin bo'lishi kerak.`);
    if (state.type === "hotel" && state.to === state.from) return fail("Mehmonxona uchun kamida 1 kecha tanlang.");
    return true;
    function fail(t) { msg.textContent = t; msg.classList.add("err"); return false; }
  }

  function results() {
    let list = LISTINGS.filter((x) => x.type === state.type && (!state.city || x.city === state.city));
    list = list.filter((x) => x.capacity >= (state.type === "hotel" ? Math.min(state.guests, 5) : state.guests));
    const by = { cheap: (a, b) => a.price - b.price, exp: (a, b) => b.price - a.price, rate: (a, b) => b.rating - a.rating, rec: (a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews) };
    return list.sort(by[state.sort]);
  }

  function render() {
    const t = TYPES[state.type];
    const list = results();
    $("#resTitle").textContent = state.city ? `${state.city}: ${t.title.toLowerCase()}` : t.title;
    $("#resCount").textContent = `${list.length} ta variant topildi`;
    if (!list.length) {
      $("#grid").innerHTML = `<div class="empty">Bu shartlar bo'yicha joy topilmadi. Boshqa shaharni tanlang yoki ${t.guests.toLowerCase()} sonini kamaytiring.</div>`;
      return;
    }
    $("#grid").innerHTML = list.map((x) => {
      const cap = x.type === "hotel" ? `${x.capacity} kishigacha` : x.type === "venue" ? `${x.capacity} o'rin` : `Guruh ${x.capacity} kishigacha`;
      return `
      <article class="item">
        <div class="thumb" style="--h:${x.hue}"><span class="kind">${t.kind}</span><span class="glyph" aria-hidden="true">${esc(x.glyph)}</span></div>
        <div class="item-body">
          <div class="item-top"><h3>${esc(x.name)}</h3><span class="rating" title="${x.reviews} ta sharh">${x.rating.toFixed(1)}</span></div>
          <p class="meta">${esc(x.city)} · ${cap} · ${x.reviews} sharh</p>
          <div class="tags">${x.tags.map((g) => `<span>${esc(g)}</span>`).join("")}</div>
        </div>
        <div class="item-foot">
          <p class="price"><small>${t.unit}</small><b>${som(x.price)}</b></p>
          <button class="btn btn-gold" type="button" data-book="${x.id}">Bron qilish</button>
        </div>
      </article>`;
    }).join("");
  }

  // ---------- booking dialog ----------
  function openBooking(id) {
    const item = LISTINGS.find((x) => x.id === id);
    if (!item) return;
    state.current = item;
    const t = TYPES[item.type];
    $("#dlgTitle").textContent = item.name;
    $("#dlgCity").textContent = `${t.kind} · ${item.city}`;
    $("#bFromLabel").textContent = t.from;
    $("#bToLabel").textContent = t.to;
    $("#bGuestsLabel").textContent = t.guests;
    $("#bTo").closest(".field").hidden = item.type === "tour";
    $("#bFrom").value = state.from;
    $("#bTo").value = state.to;
    $("#bGuests").value = Math.min(state.guests, item.capacity);
    $("#bGuests").max = item.capacity;
    $("#bookMsg").textContent = "";
    $("#bookMsg").className = "form-msg";
    updateTotal();
    const dlg = $("#bookDlg");
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    setTimeout(() => $("#bName").focus(), 30);
  }

  function updateTotal() {
    const item = state.current;
    if (!item) return;
    const from = $("#bFrom").value, to = $("#bTo").value;
    const guests = Math.max(1, parseInt($("#bGuests").value, 10) || 1);
    const q = quote(item, from, to || from, guests);
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
    ["#bName", "#bPhone"].forEach((s) => $(s).removeAttribute("aria-invalid"));

    if (name.length < 3) { $("#bName").setAttribute("aria-invalid", "true"); msg.textContent = "Ism familiyangizni kiriting."; return; }
    if (!validPhone(phone)) { $("#bPhone").setAttribute("aria-invalid", "true"); msg.textContent = "Telefon raqamini +998 90 123 45 67 ko'rinishida yozing."; return; }
    if (!from || from < iso(new Date())) { msg.textContent = "Bugungi yoki keyingi sanani tanlang."; return; }
    if (item.type === "hotel" && !(to > from)) { msg.textContent = "Ketish sanasi kelish sanasidan keyin bo'lishi kerak."; return; }
    if (item.type === "venue" && to < from) { msg.textContent = "Tugash sanasi boshlanish sanasidan oldin bo'lmasin."; return; }
    if (guests < 1 || guests > item.capacity) { msg.textContent = `Bu joy ${item.capacity} kishigacha qabul qiladi.`; return; }

    const pay = $("#bPay").value, note = $("#bNote").value.trim();
    let booking;
    if (API) {
      const btn = $("#bookForm button[type=submit]");
      btn.disabled = true;
      try {
        const r = await api("/api/bookings", { listingId: item.id, from, to, guests, client: name, phone, pay, note });
        booking = { code: r.code, id: item.id, name: r.name, city: r.city, type: r.type, from: r.from, to: r.to, guests: r.guests, sum: r.sum, phone: normPhone(phone) };
      } catch (err) {
        msg.textContent = err.message;
        return;
      } finally {
        btn.disabled = false;
      }
    } else {
      const code = "BRN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      booking = { code, id: item.id, name: item.name, city: item.city, type: item.type, from, to, guests, sum: quote(item, from, to, guests).sum, phone: normPhone(phone) };
    }
    const code = booking.code;
    saveBookings([booking, ...memoryBookings]);
    $("#bookDlg").close();
    $("#bookForm").reset();
    renderMine();
    toast(`Bron qabul qilindi. Raqamingiz: ${code}`);
  }

  // ---------- my bookings ----------
  function renderMine() {
    const list = memoryBookings;
    $("#myCount").textContent = list.length;
    if (!list.length) {
      $("#myList").innerHTML = `<p class="muted">Hali bron yo'q. Yuqoridan joy tanlab "Bron qilish" tugmasini bosing, bron shu yerda paydo bo'ladi.</p>`;
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
      try {
        await api("/api/group-requests", { company: $("#mCompany").value, kind: $("#mKind").value, people: $("#mPeople").value, phone: $("#mPhone").value });
      } catch (err) { msg.textContent = err.message; return; }
    }
    msg.className = "form-msg ok";
    msg.textContent = `Rahmat! ${$("#mKind").value} bo'yicha so'rovingiz qabul qilindi, menejer siz bilan bog'lanadi.`;
    $("#miceForm").reset();
  }

  // ---------- wiring ----------
  function init() {
    const start = addDays(new Date(), 7);
    $("#fFrom").value = iso(start);
    $("#fTo").value = iso(addDays(start, 2));
    $("#fFrom").min = $("#fTo").min = $("#bFrom").min = $("#bTo").min = iso(new Date());

    document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => setType(b.dataset.type)));
    document.querySelectorAll("[data-nav]").forEach((a) => a.addEventListener("click", () => setType(a.dataset.nav)));
    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      readSearch();
      if (!validateSearch()) return;
      render();
      $("#natijalar").scrollIntoView({ block: "start" });
    });
    $("#fSort").addEventListener("change", () => { readSearch(); render(); });
    $("#fCity").addEventListener("change", () => { readSearch(); render(); });
    $("#fFrom").addEventListener("change", () => { if ($("#fTo").value <= $("#fFrom").value) $("#fTo").value = iso(addDays(new Date($("#fFrom").value), 1)); readSearch(); });

    $("#grid").addEventListener("click", (e) => { const b = e.target.closest("[data-book]"); if (b) openBooking(b.dataset.book); });
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

    ["#bFrom", "#bTo", "#bGuests"].forEach((s) => $(s).addEventListener("input", updateTotal));
    $("#bookForm").addEventListener("submit", submitBooking);
    $("#dlgClose").addEventListener("click", () => $("#bookDlg").close());
    $("#miceForm").addEventListener("submit", submitMice);

    readSearch();
    render();
    renderMine();
    loadListings();
  }

  async function loadListings() {
    if (location.protocol === "file:") return;
    try {
      const r = await fetch("/api/listings", { headers: { accept: "application/json" } });
      if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return;
      LISTINGS = await r.json();
      API = true;
      document.querySelector(".note").hidden = true;
      render();
    } catch (e) { /* no server: keep sample data */ }
  }

  init();
})();
