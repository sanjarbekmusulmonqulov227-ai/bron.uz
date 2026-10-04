// SMS codes through Eskiz.uz (https://eskiz.uz). Set ESKIZ_EMAIL and ESKIZ_PASSWORD to turn it on;
// ESKIZ_FROM is the sender name (default "4546", Eskiz's test sender). Eskiz only delivers texts whose
// wording was approved in your Eskiz cabinet, so register the SMS_TEXT below (or set your own) there.
// Without these settings SMS is off; SMS_DEV=1 prints codes to the server log for testing instead.
"use strict";

const EMAIL = process.env.ESKIZ_EMAIL || "";
const PASSWORD = process.env.ESKIZ_PASSWORD || "";
const FROM = process.env.ESKIZ_FROM || "4546";
const DEV = process.env.SMS_DEV === "1";
const TEXT = process.env.SMS_TEXT || "bron.uz tasdiqlash kodi: {code}";
const API = "https://notify.eskiz.uz/api";

let token = "";
async function login() {
  const body = new FormData();
  body.set("email", EMAIL);
  body.set("password", PASSWORD);
  const r = await fetch(`${API}/auth/login`, { method: "POST", body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.data || !j.data.token) throw new Error("Eskiz login xatosi: " + r.status);
  token = j.data.token;
}

async function send(phone, text) {
  if (!token) await login();
  const go = () => {
    const body = new FormData();
    body.set("mobile_phone", phone.replace(/^\+/, ""));
    body.set("message", text);
    body.set("from", FROM);
    return fetch(`${API}/message/sms/send`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body });
  };
  let r = await go();
  if (r.status === 401) { await login(); r = await go(); }
  if (!r.ok) throw new Error("Eskiz SMS xatosi: " + r.status + " " + (await r.text()).slice(0, 200));
}

module.exports = {
  enabled: !!(EMAIL && PASSWORD) || DEV,
  async sendCode(phone, code) {
    const text = TEXT.replace("{code}", code);
    if (EMAIL && PASSWORD) return send(phone, text);
    if (DEV) console.log(`[SMS_DEV] ${phone}: ${text}`);
  }
};
