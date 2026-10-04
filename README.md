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
| `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` | Eskiz.uz hisobi: ro'yxatdan o'tish va parol tiklashda SMS kod yuboriladi |
| `ESKIZ_FROM` | SMS jo'natuvchi nomi (standart `4546`, Eskiz test nomi) |
| `SMS_TEXT` | SMS matni, `{code}` o'rniga kod qo'yiladi. Shu matnni Eskiz kabinetida tasdiqlating |
| `SMS_DEV` | `1` bo'lsa SMS yuborilmaydi, kod server logiga yoziladi (sinov uchun) |
| `TELEGRAM_POLL` | `0` bo'lsa bot mijoz va hamkor xabarlarini o'qimaydi (faqat admin xabarlari qoladi) |
| `SITE_URL` | `tools/build-pages.js` uchun sayt manzili (sitemap va canonical havolalar) |
| `TRUST_PROXY` | `1`: server Caddy/Nginx orqasida (haqiqiy IP `X-Forwarded-For` dan olinadi) |
| `PORT` | Server porti (standart 3000) |
| `DATA_DIR` | Baza papkasi (standart `./data`) |

## Telegram xabarlari
1. Telegram'da @BotFather → /newbot → token oling.
2. Botingizga /start yozing. @userinfobot dan o'z ID raqamingizni oling.
3. `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` ni o'rnating. Har yangi bron va guruh so'rovi Telegram'ga keladi.
4. Shu bot mijozlarga ham ishlaydi: bron tasdiqlangach "Telegram'da kuzatish" havolasi chiqadi va bron holati o'zgarsa mijozga xabar boradi. Hamkor kabinetidagi "Telegram'ga ulash" havolasi hamkorga yangi bronlarni yuboradi. Bot buyruqlari: /bronlarim, /stop. Bot server orqali ishlaydi (long polling), webhook kerak emas; bitta tokenni faqat bitta server o'qishi mumkin.

## Internetga joylash
Bazani saqlab qoladigan disk kerak, shuning uchun bepul "disksiz" hostinglar mos emas.

**Variant A — VPS (Ubuntu, masalan ahost.uz yoki Hetzner):**
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs
    # fayllarni /opt/bron-uz ga ko'chiring, keyin:
    cd /opt/bron-uz && cp .env.example .env && nano .env
    sudo npm i -g pm2 && pm2 start server.js --name bron --node-args="--no-warnings --env-file=.env" && pm2 save && pm2 startup
Keyin Caddy bilan HTTPS: `/etc/caddy/Caddyfile` ga `bron.uz { reverse_proxy localhost:3000 }` yozing. Server Caddy orqasida ishlagani uchun `.env` da `TRUST_PROXY=1` bo'lishi shart: aks holda barcha mijozlar bitta IP bo'lib ko'rinadi (cheklovlar hammaga birdan ishlaydi) va cookie `Secure` bo'lmaydi.

**Variant B — Docker (Railway, Fly.io, Render + disk):**
`Dockerfile` tayyor. `/data` papkasiga doimiy disk (volume) ulang va yuqoridagi o'zgaruvchilarni kiriting.

## Domen
bron.uz ni .uz ro'yxatchisi orqali oling va DNS'da `A` yozuvini server IP manziliga yo'naltiring.

## SMS tasdiqlash
`ESKIZ_EMAIL` va `ESKIZ_PASSWORD` o'rnatilsa, ro'yxatdan o'tishda telefonga 6 xonali kod keladi (5 daqiqa amal qiladi, 5 urinish, raqamga 10 daqiqada 3 tagacha SMS). "Parolni unutdingizmi?" ham shu kod bilan ishlaydi. Sozlanmagan bo'lsa kod so'ralmaydi.

## Sharhlar
Sharhni faqat bron qilib, joyda bo'lib qaytgan mehmon qoldiradi (bron tugagan yoki holati "yakunlandi"), har bronga bitta. Ism "Ali V." ko'rinishida chiqadi. Admin panelning "Sharhlar" bo'limida sharhni yashirish mumkin. Joy kartasidagi namuna reyting alohida, haqiqiy mehmon bahosi `guestRating` bo'lib keladi.
Bron "yakunlandi" qilinganda mijozga Telegram orqali sharh so'rovi boradi; `SITE_URL` sozlangan bo'lsa xabarda `SITE_URL/#sharh=BRN-…` havolasi bo'ladi va u sharh oynasini ochadi. Bron bekor qilinsa, uning sharhi yashiriladi.

## Namuna va haqiqiy joylar
`public/data.js` dagi joylar namuna: kartada "Namuna" belgisi chiqadi, `joy/*.html` sahifalari `noindex` va sitemapga kirmaydi. Haqiqiy hamkor joyini admin panelda "Haqiqiy joy (namuna emas)" belgisi bilan saqlang (yoki hamkor egasi biriktirilsa) va namuna belgisi o'chadi.

## Bekor qilish va bron qidirish
Mijoz bronni boshlanish kunidan oldin o'zi bekor qila oladi; tasdiqlangan pullik bronni faqat menejer bekor qiladi. Bekor qilingan bronni qayta faollashtirishda bo'sh joy yana tekshiriladi. Telefon raqami xorijiy bo'lishi mumkin (`+44…`), SMS kod esa faqat O'zbekiston raqamlariga. Kirmagan mehmon bronlari `POST /api/bookings/lookup` orqali (kod + telefon) yangilanadi.

## Diqqatga sazovor joylar va xaritadagi mehmonxonalar
`public/sights.js`: 26 ta joy (uz/ru/en matn). Suratlar mehmon brauzerida Wikipedia'dan yuklanadi (yuklanmasa rasm o'rniga chizma qoladi). Xaritada "Boshqa mehmonxonalar (OpenStreetMap)" belgisi yoqilsa, yaqinlashtirilgan hududdagi OSM mehmonxonalari kulrang nuqta bo'lib chiqadi: ular hamkor emas, faqat ma'lumot uchun. `turistlar.html`: xorijlik turist uchun qo'llanma (viza, ro'yxatdan o'tish, pul, aloqa, transport).

## Xonalar soni
Mehmonxonada bir bronda 1–10 ta xona olinadi; narx va bo'sh xonalar soni shunga qarab hisoblanadi.

## Statik sahifalar va huquqiy matnlar
    SITE_URL=https://bron.uz node tools/build-pages.js
Har joy (`public/joy/`), har shahar (`public/shahar/`), `shaharlar.html`, `oferta.html`, `qoidalar.html`, `maxfiylik.html`, `sitemap.xml`, `robots.txt` yaratiladi. Kompaniya rekvizitlarini `tools/company.example.json` dan nusxa olib `tools/company.json` ga yozing, keyin skriptni qayta ishga tushiring. Huquqiy matnlar namuna: e'lon qilishdan oldin yuristga ko'rsating. Joylar ro'yxati o'zgarsa, skriptni qayta ishga tushiring.

## Keyingi qadamlar
- Click / Payme onlayn to'lovi (MChJ yoki YaTT va shartnoma kerak)
- Joylar uchun haqiqiy rasmlar yuklash

## Mijoz hisoblari
Server ishlaganda mijozlar telefon raqami va parol bilan ro'yxatdan o'tadi. Parol `scrypt` bilan shifrlanib saqlanadi, kirish HttpOnly cookie orqali 30 kun saqlanadi. API: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/my/bookings`.
GitHub Pages'da server yo'q, shuning uchun u yerda hisob faqat foydalanuvchi qurilmasida saqlanadi.

## Suratlar
Shahar suratlari Wikimedia Commons'dan olinadi (`public/data.js` dagi `BRON_PHOTOS`). Joyning o'z suratini admin paneldagi "Surat havolasi" maydoniga qo'yish mumkin.

## Android ilova
`android/` — saytni ochadigan Android ilova. `main` ga push qilinganda GitHub Actions APK yig'adi va uni Releases sahifasiga `bron-uz.apk` nomi bilan joylaydi.

## Xavfsizlik

Xavfsizlik holati va tavsiyalar: [SECURITY.md](SECURITY.md).

## Hamkorlar bilan to'g'ridan-to'g'ri bron

- Mehmonxona, hostel yoki zal egasi saytdagi "Hamkor bo'lish" bo'limidan ariza yuboradi (admin panel → "Hamkor arizalari").
- Egasi saytda ro'yxatdan o'tadi. Admin "Joylar" bo'limida uning joyiga telefon raqamini yozib "Biriktirish"ni bosadi.
- Egasi `/partner.html` sahifasida bronlarni tasdiqlaydi yoki bekor qiladi, narx va xona/o'rin sonini o'zgartiradi, band kunlarni yopadi.
- Har bir joyning iCal havolasi bor: uni Booking.com yoki Airbnb kalendariga qo'shsangiz, bron.uz'dagi bronlar u yerda ham band ko'rinadi.
- Bo'sh joy kunma-kun hisoblanadi (mehmonxona: xonalar soni, hostel: o'rinlar, zal: kuniga bitta tadbir). Joy qolmasa, bron qabul qilinmaydi.
- Transport (avia, poyezd, avto) jadvali va narxlari `public/data.js` ichidagi namuna ma'lumot. Haqiqiy chipta sotish uchun Uzbekistan Airways va O'zbekiston temir yo'llari bilan shartnoma va API kerak.
- Xarita OpenStreetMap va Leaflet (`public/vendor/leaflet`, BSD-2 litsenziya) orqali ishlaydi.

## Tillar

- Sayt o'zbek, rus va ingliz tilida. Tilni yuqoridagi UZ / RU / EN tugmalari yoki `?lang=ru` havolasi bilan tanlash mumkin.
- Asosiy matn o'zbekcha yoziladi. Tarjimalar `public/i18n-ru.js` va `public/i18n-en.js` fayllarida: chapda o'zbekcha matn, o'ngda tarjima. Sonlar `{n}` bilan yoziladi.
- Yangi matn qo'shsangiz va tarjimasini yozmasangiz, u o'zbekcha ko'rinadi.

## Hududlar, shaharlar va ommaviy yuklash

`public/data.js` da O'zbekistonning 14 hududi (`BRON_REGIONS`) va 45 shahar (`BRON_CITIES`, har birida `region`) bor. Shahar filtrida butun hududni tanlash mumkin. Yangi shaharlardagi mehmonxona, hostel va zallar **namuna** (nomlar va narxlar o'ylab topilgan); eski bazaga ular server birinchi ishga tushganda bir marta qo'shiladi (`data/regions-v9.done`).

Transport: 11 aeroport (Toshkentdan har biriga ertalabki va kechki reys, qolgan juftliklar Toshkent orqali ulanadi), 29 poyezd yo'nalishi (ikki tomonga), istalgan ikki shahar orasida haydovchili mashina (masofa ma'lum bo'lmasa, to'g'ri chiziq × 1.3). Jadval va narxlar namuna.

Shahar suratlari: `BRON_PHOTOS` da surati yo'q shaharlar uchun brauzer Vikipediya maqolasidagi Commons suratlarini oladi (`wiki` maydoni) va 14 kun saqlaydi.

Haqiqiy mehmonxonalarni qo'shish: admin → Joylar → **Ommaviy yuklash**. CSV ustunlari `id,type,name,city,district,stars,price,capacity,rating,reviews,amenities,photos,desc,lat,lng` (qulayliklar `wifi;pool`, suratlar `https://...|https://...`), yoki JSON massiv. API: `POST /api/admin/listings/import` `{ "items": [...] }`, bir martada 2000 tagacha; mavjud `id` yangilanadi.

## Statistika
Server ishlaganda bosh sahifada foydalanuvchilar (noyob qurilmalar), tashriflar, joy ko'rishlari va ro'yxatdan o'tganlar soni chiqadi; joy oynasida "N marta ko'rilgan". Bir qurilmaning 30 daqiqa ichidagi qayta kirishi va bir joyni bir soat ichida qayta ochish qayta sanalmaydi. API: `POST /api/visit`, `GET /api/stats`, `POST /api/listings/:id/view`. Admin panel bosh sahifasida ham ko'rinadi. GitHub Pages'da server yo'qligi uchun bu raqamlar chiqmaydi.
