# bron.uz xavfsizligi

Oxirgi tekshiruv: 2026-yil 3-oktabr.

## Qisqa xulosa

Sayt oddiy hujumlarga (SQL injection, XSS, brute-force, CSRF, fayl o'g'irlash) chidamli qilib yozilgan va sinovdan o'tkazilgan.
Eng katta xavf koddagi xatolar emas, balki **akkaunt va parollar**. GitHub akkauntingiz buzilsa, butun sayt buziladi. Shuning uchun quyidagi "Sizning vazifalaringiz" bo'limi eng muhimi.

## Hozir nimalar himoyalangan

| Hujum turi | Himoya | Sinov natijasi |
|---|---|---|
| SQL injection (bazani buzish) | Barcha so'rovlar tayyor (prepared) statement orqali | `' OR 1=1--` ta'sir qilmadi |
| XSS (begona skript qo'shish) | Barcha matnlar ekranlanadi, Content-Security-Policy faqat o'z skriptlarimizga ruxsat beradi | Sayt CSP bilan xatosiz ishlaydi |
| Parolni taxmin qilish (brute-force) | 5 marta noto'g'ri parol kiritilsa, raqam 15 daqiqaga bloklanadi. Bitta IP manzildan daqiqasiga 10 tadan ortiq urinish bo'lsa, u ham bloklanadi | 6-urinish 429 xatosini oldi |
| Admin parolini taxmin qilish | 15 daqiqada 5 ta noto'g'ri urinishdan keyin IP bloklanadi | 6-urinish 429 xatosini oldi |
| CSRF (boshqa saytdan sizning nomingizdan so'rov yuborish) | Faqat JSON so'rovlar qabul qilinadi, begona Origin rad etiladi, cookie `SameSite=Lax; HttpOnly` | text/plain 415, begona sayt 403 oldi |
| Parollar bazadan o'g'irlansa | Parollar scrypt bilan, sessiya tokenlari SHA-256 bilan saqlanadi. Ochiq matn saqlanmaydi | Tekshirildi |
| Server fayllarini o'qish (`../server.js`) | Yo'l tekshiruvi | 404 qaytardi |
| Clickjacking (saytni boshqa sayt ichiga joylash) | `X-Frame-Options: DENY`, `frame-ancestors 'none'` | Sarlavhalar mavjud |
| Sekin so'rovlar bilan serverni qotirish | So'rov hajmi cheklangan, 15 soniyalik timeout | Sozlandi |
| Uchinchi tomon kutubxonalaridagi zaifliklar | Server birorta ham tashqi paketsiz ishlaydi | `npm` bog'liqliklari yo'q |
| Admin panel kodi | `admin.js` faqat parol kiritilgandan keyin beriladi | Parolsiz 401 qaytardi |
| Android ilova | WebView telefon fayllariga kira olmaydi, begona havolalar brauzerda ochiladi | Kodda sozlandi |

## Bu safar tuzatilgan joylar

- Server javoblariga xavfsizlik sarlavhalari qo'shildi: CSP, HSTS, nosniff, Permissions-Policy.
- Login, ro'yxatdan o'tish va admin panelga urinishlar soni cheklandi, raqam bo'yicha bloklash qo'shildi.
- Sessiya tokenlari bazada xeshlangan holda saqlanadigan bo'ldi.
- CSRF himoyasi qo'shildi.
- Parolning eng kam uzunligi 6 tadan 8 belgiga oshirildi.
- GitHub Pages sahifasiga ham CSP qo'shildi.
- Admin panel skripti alohida faylga ko'chirildi va parol bilan himoyalandi.
- Android WebView'da fayllarga kirish o'chirildi.

## Sizning vazifalaringiz (muhimlik tartibida)

1. **GitHub'da ikki bosqichli himoyani (2FA) yoqing.** Settings → Password and authentication → Two-factor authentication. Bu eng muhim qadam.
2. **Gmail'da ham 2FA yoqing**, chunki GitHub parolini tiklash shu pochta orqali bo'ladi.
3. **Server ishga tushganda admin uchun kuchli parol qo'ying** (`ADMIN_PASSWORD`, kamida 16 belgi, boshqa joyda ishlatilmagan). Parol va bot tokenini hech qachon chatga, GitHub'ga yoki skrinshotga qo'ymang. Ular faqat serverdagi `.env` faylida tursin.
4. **Serverni faqat HTTPS bilan ishga tushiring.** Masalan, Caddy proksi orqali, `.env` da `TRUST_PROXY=1` bilan. HTTPS bo'lmasa, parollar internetda ochiq ketadi.
5. **Bazaning zaxira nusxasini oling.** `data/bron.db` faylini har kuni boshqa joyga nusxalab qo'ying.
6. **Ilovani Play Market'ga chiqarishdan oldin haqiqiy imzo kalitini yarating.** Kalit GitHub Secrets'da saqlanadi. Hozirgi APK sinov kaliti bilan imzolangan.
7. **Serverni yangilab turing:** Node.js va operatsion tizim yangilanishlarini o'rnatib boring.

## Bilish kerak bo'lgan cheklovlar

- **GitHub Pages'dagi hozirgi versiya namuna rejimida ishlaydi.** U yerdagi akkauntlar va bronlar faqat foydalanuvchining o'z telefoni yoki brauzerida saqlanadi. Bu haqiqiy himoya emas, faqat ko'rsatish uchun. Haqiqiy mijozlar ma'lumoti faqat server (VPS) ishga tushgandan keyin xavfsiz saqlanadi.
- **Katta DDoS hujumlarini kod to'xtata olmaydi.** Bunga Cloudflare kabi bepul xizmat kerak. GitHub Pages esa o'zi himoyalangan.
- **SMS orqali telefon raqamini tasdiqlash hali yo'q.** Kimdir boshqa odamning raqami bilan ro'yxatdan o'tishi mumkin. Buning uchun Eskiz.uz kabi SMS xizmati ulanishi kerak.
- **Onlayn to'lov (Click, Payme) ulanganda** karta ma'lumotlari saytda emas, to'lov tizimining o'z sahifasida kiritilishi kerak.

## Zaiflik topsangiz

Iltimos, uni ochiq e'lon qilmang. Sayt egasiga to'g'ridan-to'g'ri xabar bering.
