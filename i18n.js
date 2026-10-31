// bron.uz languages: Uzbek is the source text; Russian and English come from i18n-ru.js / i18n-en.js.
// The page is written once in Uzbek and every visible text node and label is translated as it appears,
// so content drawn later by app.js (cards, dialogs, messages) is translated too.
// Lookup order: exact text, then the same text with numbers as {n}, then each part between separators.
(function () {
  "use strict";
  const LANGS = { uz: "O'zbekcha", ru: "Русский", en: "English" };
  const KEY = "bron.lang";
  const fromUrl = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  // Uzbek unless the visitor picked another language (switch buttons or ?lang=ru|en|uz).
  let lang = LANGS[fromUrl] ? fromUrl : LANGS[saved] ? saved : "uz";
  if (fromUrl && LANGS[fromUrl]) { try { localStorage.setItem(KEY, fromUrl); } catch (e) { /* ignore */ } }

  let DICT = {};
  const NUM = /\d+(?:[  .,:]\d+)*/g;
  const SEPS = [" · ", " — ", " – ", " → ", ": ", " / ", " | ", ", ", ". "];
  const cache = new Map();

  function lookup(s) {
    if (Object.prototype.hasOwnProperty.call(DICT, s)) return DICT[s];
    const nums = s.match(NUM);
    if (nums) {
      const tpl = s.replace(NUM, "{n}");
      if (Object.prototype.hasOwnProperty.call(DICT, tpl)) { let i = 0; return DICT[tpl].replace(/\{n\}/g, () => nums[i++] ?? ""); }
    }
    return null;
  }
  function tr(s) {
    if (lang === "uz" || !s) return s;
    if (cache.has(s)) return cache.get(s);
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    const core = m[2];
    let out = null;
    if (core && /[A-Za-zЀ-ӿ]/.test(core)) {
      out = lookup(core);
      if (out == null) { const p = /^(.*?)([.:!?…]+)$/.exec(core); if (p) { const x = lookup(p[1]); if (x != null) out = x + p[2]; } }
      if (out == null) {
        for (const sep of SEPS) {
          if (!core.includes(sep)) continue;
          const parts = core.split(sep);
          const done = parts.map((x) => tr(x));
          if (done.some((x, i) => x !== parts[i])) { out = done.join(sep); break; }
        }
      }
    }
    const res = out == null ? s : m[1] + out + m[3];
    if (cache.size < 5000) cache.set(s, res);
    return res;
  }

  const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "svg"]);
  const ATTRS = ["placeholder", "aria-label", "title", "alt", "label"];
  const mine = new WeakMap();
  function textNode(n) {
    const v = n.nodeValue;
    if (mine.get(n) === v) return;
    const p = n.parentNode;
    if (!p || SKIP.has(p.nodeName) || (p.closest && p.closest("[data-no-i18n]"))) return;
    const t = tr(v);
    if (t !== v) { n.nodeValue = t; }
    mine.set(n, n.nodeValue);
  }
  function element(el) {
    if (el.nodeName === "SCRIPT" || el.nodeName === "STYLE" || el.hasAttribute("data-no-i18n")) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v) { const t = tr(v); if (t !== v) el.setAttribute(a, t); }
    }
    if (el.nodeName === "INPUT" && (el.type === "submit" || el.type === "button") && el.value) el.value = tr(el.value);
  }
  function walk(root) {
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1 || SKIP.has(root.nodeName) || root.hasAttribute("data-no-i18n")) return;
    element(root);
    const it = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.nodeType === 1 && (SKIP.has(n.nodeName) || n.hasAttribute("data-no-i18n")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    for (let n = it.nextNode(); n; n = it.nextNode()) n.nodeType === 3 ? textNode(n) : element(n);
    root.querySelectorAll("textarea").forEach(element);
  }

  function setLang(l) {
    if (!LANGS[l] || l === lang) return;
    try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
    const u = new URL(location.href);
    if (u.searchParams.has("lang")) u.searchParams.set("lang", l);
    location.replace(u.toString());
  }

  function markSwitch() {
    document.querySelectorAll("[data-lang]").forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function start() {
    document.documentElement.lang = lang;
    markSwitch();
    document.addEventListener("click", (e) => { const b = e.target.closest("[data-lang]"); if (b) { e.preventDefault(); setLang(b.dataset.lang); } });
    if (lang === "uz") return;
    document.title = tr(document.title);
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = tr(md.content);
    walk(document.body);
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") textNode(m.target);
        else if (m.type === "attributes") element(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  window.BRON_I18N = { lang, langs: LANGS, t: tr, setLang };
  const root = document.documentElement;
  const go = () => {
    DICT = (window.BRON_I18N_DICT || {})[lang] || {};
    cache.clear(); // lookups made before the dictionary arrived must not stick
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
    root.classList.remove("i18n-wait");
  };
  if (lang === "uz") go();
  else {
    // Hide the Uzbek text for the moment the dictionary takes to load, but never for long.
    root.classList.add("i18n-wait");
    const s = document.createElement("script");
    s.src = (document.currentScript && document.currentScript.src || "i18n.js").replace(/i18n\.js(\?.*)?$/, `i18n-${lang}.js`);
    s.onload = s.onerror = go;
    document.head.appendChild(s);
    setTimeout(() => root.classList.remove("i18n-wait"), 1500);
  }
})();
