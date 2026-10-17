// bron.uz date-range picker: one calendar for "from" and "to" instead of two browser date boxes.
// The original <input type="date"> elements stay in the form (hidden) and keep holding the values,
// so the rest of the code reads and sets them as before; a button shows the chosen date.
(function () {
  "use strict";
  const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const WD = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const T = (s) => (window.BRON_I18N ? window.BRON_I18N.t(s) : s);
  const SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const label = (s) => { if (!s) return ""; const d = parse(s); return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`; };
  // Short form for the buttons: "14 okt, Ch".
  const short = (s) => { const d = parse(s); return `${d.getDate()} ${SHORT[d.getMonth()]}, ${WD[(d.getDay() + 6) % 7]}`; };
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

  // Replace a date input with a button; setting input.value from code updates the button too.
  function wrap(input, onOpen) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dp-btn";
    btn.setAttribute("aria-haspopup", "dialog");
    input.parentNode.insertBefore(btn, input);
    input.classList.add("dp-native");
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    const show = () => {
      const v = desc.get.call(input);
      btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg><span>${v ? short(v) : "Sanani tanlang"}</span>`;
      btn.title = v ? label(v) : "";
    };
    Object.defineProperty(input, "value", { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); show(); } });
    input.addEventListener("focus", () => btn.focus());
    btn.addEventListener("click", (e) => { e.preventDefault(); onOpen(btn); });
    show();
    return { btn, show };
  }

  // opts: from, to (inputs), single() → only one date, minSpan() → 1 for nights, 0 for days, span(from, to) → footer text
  function range(opts) {
    const { from, to } = opts;
    let pop = null, phase = "from", view = null, hover = "", anchor = null;
    const a = wrap(from, (b) => open("from", b));
    const z = wrap(to, (b) => open(opts.single() ? "from" : "to", b));
    const fire = (el) => { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };
    const months = () => (matchMedia("(max-width: 640px)").matches ? 1 : 2);

    function open(p, btn) {
      phase = p; anchor = btn; hover = "";
      const cur = (p === "to" && to.value) || from.value || from.min || iso(new Date());
      view = parse(cur); view.setDate(1);
      if (p === "to" && months() === 2 && from.value && parse(from.value).getMonth() !== view.getMonth()) { view = parse(from.value); view.setDate(1); }
      if (!pop) build();
      draw();
      pop.hidden = false;
      place();
      setTimeout(() => { const f = pop.querySelector(".dp-day.is-from, .dp-day.is-to, .dp-day:not([disabled])"); if (f) f.focus({ preventScroll: true }); }, 0);
    }
    function close(back) { if (!pop || pop.hidden) return; pop.hidden = true; if (back && anchor) anchor.focus({ preventScroll: true }); }
    function build() {
      pop = document.createElement("div");
      pop.className = "dp-pop";
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", "Sanani tanlang");
      pop.hidden = true;
      (from.closest("dialog") || document.body).appendChild(pop);
      // Fixed to the viewport, so it is never clipped by the search card or the dialog; it follows its button on scroll.
      window.addEventListener("scroll", () => { if (pop && !pop.hidden) place(); }, { passive: true });
      pop.addEventListener("click", (e) => {
        const nav = e.target.closest("[data-dp-nav]");
        if (nav) { view.setMonth(view.getMonth() + +nav.dataset.dpNav); draw(); return; }
        const d = e.target.closest("[data-dp]");
        if (d && !d.disabled) pick(d.dataset.dp);
        if (e.target.closest("[data-dp-done]")) close(true);
      });
      pop.addEventListener("mouseover", (e) => { const d = e.target.closest("[data-dp]"); if (phase === "to" && d && d.dataset.dp !== hover) { hover = d.dataset.dp; paint(); } });
      pop.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); return; }
        const d = e.target.closest("[data-dp]");
        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        if (!d || !step) return;
        e.preventDefault();
        const n = parse(d.dataset.dp); n.setDate(n.getDate() + step);
        const id = iso(n);
        let el = pop.querySelector(`[data-dp="${id}"]`);
        if (!el) { view.setMonth(view.getMonth() + (step > 0 ? 1 : -1)); draw(); el = pop.querySelector(`[data-dp="${id}"]`); }
        if (el) { if (phase === "to") { hover = id; paint(); } el.focus(); }
      });
      document.addEventListener("pointerdown", (e) => { if (pop && !pop.hidden && !pop.contains(e.target) && !e.target.closest(".dp-btn")) close(false); });
      window.addEventListener("resize", () => { if (pop && !pop.hidden) { draw(); place(); } });
    }
    function pick(d) {
      const span = opts.minSpan();
      if (opts.single()) { from.value = d; fire(from); close(true); return; }
      if (phase === "from" || (from.value && d < from.value) || (span && d === from.value)) {
        from.value = d; fire(from);
        const next = parse(d); next.setDate(next.getDate() + span);
        if (!to.value || to.value < iso(next)) { to.value = iso(next); fire(to); }
        phase = "to"; hover = ""; draw();
        return;
      }
      to.value = d; fire(to);
      close(true);
    }
    function month(y, m) {
      const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
      const min = from.min || "", max = (phase === "to" ? to.max : from.max) || "";
      let cells = "";
      for (let i = 0; i < lead; i++) cells += `<span class="dp-gap"></span>`;
      for (let d = 1; d <= n; d++) {
        const id = `${y}-${pad(m + 1)}-${pad(d)}`;
        const off = (min && id < min) || (max && id > max);
        cells += `<button type="button" class="dp-day" data-dp="${id}"${off ? " disabled" : ""} aria-label="${d} ${MONTHS[m]} ${y}">${d}</button>`;
      }
      return `<div class="dp-month"><p class="dp-title">${MONTHS[m]} ${y}</p><div class="dp-grid">${WD.map((w) => `<span class="dp-wd">${w}</span>`).join("")}${cells}</div></div>`;
    }
    function draw() {
      const k = months();
      let html = "";
      for (let i = 0; i < k; i++) { const d = new Date(view.getFullYear(), view.getMonth() + i, 1); html += month(d.getFullYear(), d.getMonth()); }
      const minM = from.min ? parse(from.min) : null;
      const prevOff = minM && (view.getFullYear() < minM.getFullYear() || (view.getFullYear() === minM.getFullYear() && view.getMonth() <= minM.getMonth()));
      const hint = opts.single() ? "Sanani tanlang" : phase === "from" ? opts.fromHint() : opts.toHint();
      pop.innerHTML = `<div class="dp-head"><button type="button" class="dp-nav" data-dp-nav="-1" aria-label="Oldingi oy"${prevOff ? " disabled" : ""}>‹</button><b class="dp-hint">${hint}</b><button type="button" class="dp-nav" data-dp-nav="1" aria-label="Keyingi oy">›</button></div>
        <div class="dp-months">${html}</div>
        <div class="dp-foot"><span class="dp-span"></span><button type="button" class="btn btn-gold dp-done" data-dp-done>Tayyor</button></div>`;
      paint();
    }
    function paint() {
      const f = from.value, single = opts.single();
      const t = single ? "" : phase === "to" && hover && f && hover > f ? hover : to.value;
      pop.querySelectorAll("[data-dp]").forEach((b) => {
        const d = b.dataset.dp;
        b.classList.toggle("is-from", d === f);
        b.classList.toggle("is-to", !!t && d === t && d !== f);
        b.classList.toggle("in-range", !!t && d > f && d < t);
        b.setAttribute("aria-pressed", String(d === f || d === t));
      });
      pop.querySelector(".dp-span").textContent = !single && f && t ? opts.span(f, t) : f ? label(f) : "";
    }
    function place() {
      if (matchMedia("(max-width: 640px)").matches) { pop.classList.add("dp-sheet"); pop.style.left = pop.style.top = ""; return; }
      pop.classList.remove("dp-sheet");
      const r = (anchor || a.btn).getBoundingClientRect();
      const w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth, vh = innerHeight;
      pop.style.left = `${Math.max(8, Math.min(r.left, vw - w - 8))}px`;
      pop.style.top = `${r.bottom + 8 + h > vh && r.top - 8 - h > 0 ? r.top - 8 - h : r.bottom + 8}px`;
    }
    return { refresh() { a.show(); z.show(); }, close };
  }

  window.BRON_PICKER = { range, label, T };
})();
