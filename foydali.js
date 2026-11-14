// Home page "Bayramlar va festivallar" and "Qachon borgan yaxshi?": hides dates already past,
// marks the next one with a days-left badge, and marks the current month in the season table.
(function () {
  "use strict";
  const LANG = (window.BRON_I18N && window.BRON_I18N.lang) || "uz";
  const L = {
    uz: { today: "Bugun", left: (n) => `${n} kun qoldi`, next: "Keyingisi", month: "Shu oy" },
    ru: { today: "Сегодня", left: (n) => `через ${n} дн.`, next: "Ближайший", month: "Этот месяц" },
    en: { today: "Today", left: (n) => `in ${n} days`, next: "Next up", month: "This month" }
  }[LANG];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const list = document.getElementById("holList");
  if (list) {
    let first = true;
    list.querySelectorAll("li[data-date]").forEach((li) => {
      const [y, m, d] = li.dataset.date.split("-").map(Number);
      const days = Math.round((new Date(y, m - 1, d) - today) / 864e5);
      if (days < 0) { li.hidden = true; return; }
      if (first) {
        first = false;
        li.classList.add("hol-next");
        const tag = document.createElement("em");
        tag.className = "hol-tag";
        tag.setAttribute("data-no-i18n", "");
        tag.textContent = `${L.next} · ${days === 0 ? L.today : L.left(days)}`;
        li.prepend(tag);
      }
    });
  }
  const m = now.getMonth();
  document.querySelectorAll(".season").forEach((t) => {
    const th = t.querySelector(`thead th[data-m="${m}"]`);
    if (th) { th.classList.add("ss-now"); }
    t.querySelectorAll("tbody tr").forEach((tr) => { const td = tr.children[m + 1]; if (td) td.classList.add("ss-now"); });
    // On narrow screens, scroll the table so the current month is in view.
    const wrap = t.closest(".ss-wrap"), cell = th, head = t.querySelector("tbody th");
    if (wrap && cell && head && wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = Math.max(0, cell.offsetLeft - head.offsetWidth - 40);
  });
})();
