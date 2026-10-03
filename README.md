# bron.uz

Mehmonxona, konferens-zal va turlarni bron qilish sayti. Node.js 22.13+ kerak, boshqa paket o'rnatish shart emas.

## Tuzilma
- `public/` — sayt (index.html, styles.css, app.js)
- `server.js` — server: sayt, API, admin panel, Telegram xabarlari
- `admin.html` — admin panel (`/admin`, login va parol bilan)
- `public/data.js` — namuna joylar; bo'sh bazaga birinchi ishga tushganda yoziladi
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` — telefonga o'rnatiladigan ilova (PWA)
- `data/bron.db` — SQLite baza (avtomatik yaratiladi, zaxira nusxasini oling)

## Kompyuterda ishga tushirish
    ADMIN_PASSWORD=parol node server.js
Sayt: http://localhost:3000, admin: http://localhost:3000/admin (login `admin`).

## Sozlamalar (muhit o'zgaruvchilari)
| Nomi | Nima uchun |
|---|---|
| `ADMIN_PASSWORD` | Admin panel paroli. Bo'lmasa admin panel yopiq |
| `ADMIN_USER` | Admin login (standart: `admin`) |
| `TELEGRAM_BOT_TOKEN` | @BotFather bergan token |
| `TELEGRAM_CHAT_ID` | Xabar boradigan chat ID (@userinfobot orqali bilib olasiz) |
| `PORT` | Server porti (standart 3000) |
| `DATA_DIR` | Baza papkasi (standart `./data`) |

## Telegram xabarlari
1. Telegram'da @BotFather → /newbot → token oling.
2. Botingizga /start yozing. @userinfobot dan o'z ID raqamingizni oling.
3. `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` ni o'rnating. Har yangi bron va guruh so'rovi Telegram'ga keladi.

## Internetga joylash
Bazani saqlab qoladigan disk kerak, shuning uchun bepul "disksiz" hostinglar mos emas.

**Variant A — VPS (Ubuntu, masalan ahost.uz yoki Hetzner):**
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs
    # fayllarni /opt/bron-uz ga ko'chiring, keyin:
    cd /opt/bron-uz && cp .env.example .env && nano .env
    sudo npm i -g pm2 && pm2 start server.js --name bron --node-args="--no-warnings --env-file=.env" && pm2 save && pm2 startup
Keyin Caddy bilan HTTPS: `/etc/caddy/Caddyfile` ga `bron.uz { reverse_proxy localhost:3000 }` yozing.

**Variant B — Docker (Railway, Fly.io, Render + disk):**
`Dockerfile` tayyor. `/data` papkasiga doimiy disk (volume) ulang va yuqoridagi o'zgaruvchilarni kiriting.

## Domen
bron.uz ni .uz ro'yxatchisi orqali oling va DNS'da `A` yozuvini server IP manziliga yo'naltiring.

## Keyingi qadamlar
- Click / Payme onlayn to'lovi (MChJ yoki YaTT va shartnoma kerak)
- Joylar uchun haqiqiy rasmlar yuklash
- Rus tili

## Mijoz hisoblari
Server ishlaganda mijozlar telefon raqami va parol bilan ro'yxatdan o'tadi. Parol `scrypt` bilan shifrlanib saqlanadi, kirish HttpOnly cookie orqali 30 kun saqlanadi. API: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/my/bookings`.
GitHub Pages'da server yo'q, shuning uchun u yerda hisob faqat foydalanuvchi qurilmasida saqlanadi.

## Suratlar
Shahar suratlari Wikimedia Commons'dan olinadi (`public/data.js` dagi `BRON_PHOTOS`). Joyning o'z suratini admin paneldagi "Surat havolasi" maydoniga qo'yish mumkin.

## Android ilova
`android/` — saytni ochadigan Android ilova. `main` ga push qilinganda GitHub Actions APK yig'adi va uni Releases sahifasiga `bron-uz.apk` nomi bilan joylaydi.

## Xavfsizlik

Xavfsizlik holati va tavsiyalar: [SECURITY.md](SECURITY.md).
