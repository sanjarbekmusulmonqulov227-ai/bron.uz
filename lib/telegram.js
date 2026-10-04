// Telegram bot for customers and partners (same bot as TELEGRAM_BOT_TOKEN).
// A customer opens t.me/<bot>?start=b_<code>_<sig> from the booking confirmation and then gets every
// status change of that booking. A partner opens the link from the partner cabinet and gets new bookings
// for their places. The bot reads its messages by long polling, so no public webhook URL is needed.
"use strict";

const crypto = require("node:crypto");

module.exports = function telegram({ db, token, secret, describe }) {
  db.exec(`CREATE TABLE IF NOT EXISTS tg_links (
    chat_id TEXT NOT NULL, kind TEXT NOT NULL, ref TEXT NOT NULL, created TEXT NOT NULL,
    PRIMARY KEY (chat_id, kind, ref)
  )`);
  const sig = (s) => crypto.createHmac("sha256", secret).update("tg:" + s).digest("base64url").slice(0, 12);
  let username = "";
  const api = async (method, body) => {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw Object.assign(new Error(`Telegram ${method}: ${r.status} ${j.description || ""}`), { status: r.status });
    return j.result;
  };
  const say = (chat, text) => api("sendMessage", { chat_id: chat, text, disable_web_page_preview: true }).catch((e) => console.warn(e.message));

  async function onMessage(msg) {
    const chat = String(msg.chat.id), text = String(msg.text || "").trim();
    const m = /^\/start(?:\s+([bp])_([\w-]+)_([\w-]{12}))?/.exec(text);
    if (m && m[1]) {
      const [, kind, ref, s] = m;
      if (sig(kind + ref) !== s) return say(chat, "Havola noto'g'ri yoki eskirgan.");
      db.prepare("INSERT OR IGNORE INTO tg_links (chat_id, kind, ref, created) VALUES (?,?,?,?)").run(chat, kind === "b" ? "booking" : "partner", ref, new Date().toISOString());
      return say(chat, kind === "b" ? `✅ Ulandi. Bron holati o'zgarsa, shu yerga xabar keladi.\n\n${describe.booking(ref) || ref}` : `✅ Hamkor kabineti ulandi. Joylaringizga yangi bron tushsa, shu yerga xabar keladi.`);
    }
    if (/^\/(bronlarim|status)/.test(text)) {
      const codes = db.prepare("SELECT ref FROM tg_links WHERE chat_id = ? AND kind = 'booking' ORDER BY created DESC LIMIT 10").all(chat).map((r) => r.ref);
      return say(chat, codes.length ? codes.map((c) => describe.booking(c) || c).join("\n\n") : "Hali ulangan bron yo'q. Saytda bron qilgach, \"Telegram'da kuzatish\" tugmasini bosing.");
    }
    if (/^\/stop/.test(text)) {
      db.prepare("DELETE FROM tg_links WHERE chat_id = ?").run(chat);
      return say(chat, "Xabarlar o'chirildi.");
    }
    return say(chat, "Salom! Bu bron.uz boti.\n/bronlarim: ulangan bronlar holati\n/stop: xabarlarni o'chirish");
  }

  async function poll() {
    let offset = 0;
    try { const me = await api("getMe"); username = me.username || ""; } catch (e) { console.warn("Telegram bot ishga tushmadi:", e.message); return; }
    for (;;) {
      try {
        const ups = await api("getUpdates", { offset, timeout: 25, allowed_updates: ["message"] });
        for (const u of ups) { offset = u.update_id + 1; if (u.message && u.message.chat && u.message.chat.type === "private") await onMessage(u.message); }
      } catch (e) {
        // 409: a webhook or another copy of the server reads this bot; stop instead of fighting over updates.
        if (e.status === 409) { console.warn("Telegram: boshqa server shu botni o'qiyapti, mijoz xabarlari o'chirildi."); username = ""; return; }
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
  return {
    start() { if (token && process.env.TELEGRAM_POLL !== "0") poll(); },
    get username() { return username; },
    bookingLink: (code) => username ? `https://t.me/${username}?start=b_${code}_${sig("b" + code)}` : "",
    partnerLink: (uid) => username ? `https://t.me/${username}?start=p_${uid}_${sig("p" + uid)}` : "",
    toBooking(code, text) { for (const r of db.prepare("SELECT chat_id FROM tg_links WHERE kind = 'booking' AND ref = ?").all(code)) say(r.chat_id, text); },
    toPartner(uid, text) { for (const r of db.prepare("SELECT chat_id FROM tg_links WHERE kind = 'partner' AND ref = ?").all(String(uid))) say(r.chat_id, text); }
  };
};
