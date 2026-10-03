// Namuna ma'lumotlar: joy nomlari, narxlar va reytinglar dizaynni ko'rsatish uchun o'ylab topilgan.
// Server ishlayotgan bo'lsa, ro'yxat /api/listings dan olinadi va bu ma'lumot ishlatilmaydi.
window.BRON_CITIES = [
  { name: "Toshkent", note: "Poytaxt, biznes va metro", art: "tower", hue: 212 },
  { name: "Samarqand", note: "Registon va Shohi Zinda", art: "dome", hue: 200 },
  { name: "Buxoro", note: "Eski shahar va Labi Hovuz", art: "minaret", hue: 32 },
  { name: "Xiva", note: "Ichan Qal'a devorlari ichida", art: "fortress", hue: 18 },
  { name: "Shahrisabz", note: "Oqsaroy va Amir Temur yurti", art: "portal", hue: 190 },
  { name: "Farg'ona", note: "Rishton sopoli, Marg'ilon ipagi", art: "garden", hue: 140 },
  { name: "Chimyon", note: "Tog'lar, chang'i, Chorvoq", art: "mountain", hue: 205 },
  { name: "Termiz", note: "Qadimiy Baqtriya, Surxon", art: "stupa", hue: 40 }
];

window.BRON_LISTINGS = [
  // ---- Toshkent ----
  { id: "h01", type: "hotel", name: "Tashkent City Plaza", city: "Toshkent", district: "Tashkent City, Olmazor", stars: 5, rating: 9.2, reviews: 1284, price: 1450000, old: 1690000, capacity: 4, art: "tower", hue: 214, free: true,
    amenities: ["wifi", "breakfast", "pool", "spa", "gym", "parking", "restaurant"], desc: "Tashkent City parkiga qaragan 28 qavatli mehmonxona. Tomdagi basseyn, 3 ta restoran va 600 o'rinli biznes-markaz bor." },
  { id: "h02", type: "hotel", name: "Chorsu Boutique", city: "Toshkent", district: "Eski shahar, Chorsu", stars: 4, rating: 8.7, reviews: 416, price: 640000, capacity: 3, art: "house", hue: 176, free: true,
    amenities: ["wifi", "breakfast", "ac", "transfer"], desc: "Chorsu bozori va Ko'kaldosh madrasasidan 5 daqiqa piyoda. 18 ta xona, hovlida choyxona." },
  { id: "h03", type: "hotel", name: "Amir Temur Grand", city: "Toshkent", district: "Amir Temur xiyoboni", stars: 5, rating: 9.0, reviews: 902, price: 1980000, capacity: 4, art: "classic", hue: 225, free: false,
    amenities: ["wifi", "breakfast", "pool", "spa", "gym", "parking", "restaurant", "transfer"], desc: "Shahar markazidagi klassik uslubdagi mehmonxona. Prezident lyuksi, 2 ta konferens-zal va yopiq basseyn." },
  { id: "h04", type: "hotel", name: "Yunusobod Family Inn", city: "Toshkent", district: "Yunusobod", stars: 3, rating: 8.4, reviews: 233, price: 420000, old: 480000, capacity: 5, art: "house", hue: 150, free: true,
    amenities: ["wifi", "breakfast", "parking", "family", "ac"], desc: "Oilalar uchun qulay: bolalar o'yingohi, oilaviy xonalar va bepul avtoturargoh. Metro 7 daqiqa." },
  { id: "h05", type: "hotel", name: "Minor Hostel & Rooms", city: "Toshkent", district: "Minor masjidi yonida", stars: 2, rating: 8.9, reviews: 610, price: 180000, capacity: 2, art: "dome", hue: 196, free: true,
    amenities: ["wifi", "ac"], desc: "Sayohatchilar uchun arzon va toza. Umumiy oshxona, kir yuvish mashinasi va kechasi ham ishlaydigan qabulxona." },
  { id: "h06", type: "hotel", name: "Aeroport Transit Hotel", city: "Toshkent", district: "Sergeli, aeroportdan 4 km", stars: 3, rating: 8.1, reviews: 344, price: 520000, capacity: 3, art: "tower", hue: 240, free: true,
    amenities: ["wifi", "breakfast", "transfer", "parking", "restaurant"], desc: "Erta reyslar uchun qulay: 24 soat bepul aeroport transferi va soat 04:00 dan nonushta." },

  // ---- Samarqand ----
  { id: "h07", type: "hotel", name: "Registon Saroy", city: "Samarqand", district: "Registon maydoni, 400 m", stars: 5, rating: 9.4, reviews: 1050, price: 980000, old: 1150000, capacity: 4, art: "dome", hue: 200, free: true,
    amenities: ["wifi", "breakfast", "spa", "restaurant", "parking", "ac"], desc: "Tomdagi terrasadan Registonning kechki yoritilishi ko'rinadi. Xonalar Samarqand naqshlari bilan bezatilgan." },
  { id: "h08", type: "hotel", name: "Siyob Family Hotel", city: "Samarqand", district: "Siyob bozori", stars: 3, rating: 8.5, reviews: 287, price: 390000, capacity: 5, art: "house", hue: 160, free: true,
    amenities: ["wifi", "breakfast", "family", "transfer"], desc: "Bibixonim masjidi va Siyob bozori yonida. Uy egasi oilasi tayyorlagan nonushta va bepul vokzal transferi." },
  { id: "h09", type: "hotel", name: "Afrosiyob Silk Resort", city: "Samarqand", district: "Silk Road Samarqand majmuasi", stars: 5, rating: 9.3, reviews: 734, price: 2100000, capacity: 4, art: "garden", hue: 186, free: false,
    amenities: ["wifi", "breakfast", "pool", "spa", "gym", "restaurant", "parking", "transfer"], desc: "Boqiy shahar yonidagi kurort: termal spa, ochiq basseyn, kongress-markaz va kechki shou." },
  { id: "h10", type: "hotel", name: "Ulug'bek Rasadxona Inn", city: "Samarqand", district: "Ulug'bek rasadxonasi", stars: 4, rating: 8.8, reviews: 198, price: 610000, capacity: 3, art: "portal", hue: 210, free: true,
    amenities: ["wifi", "breakfast", "parking", "ac"], desc: "Shahar shovqinidan uzoq, tepalikdagi sokin mehmonxona. Kechasi yulduzlarni kuzatish uchun teleskop bor." },
  { id: "h11", type: "hotel", name: "Konigil Paper Mill Guest House", city: "Samarqand", district: "Konigil qishlog'i", stars: 3, rating: 9.5, reviews: 156, price: 450000, capacity: 4, art: "garden", hue: 120, free: true,
    amenities: ["wifi", "breakfast", "family", "parking"], desc: "Samarqand qog'ozi ustaxonasi yonida, daryo bo'yida. Mehmonlar qog'oz tayyorlash darsiga qatnasha oladi." },

  // ---- Buxoro ----
  { id: "h12", type: "hotel", name: "Labi Hovuz Guest House", city: "Buxoro", district: "Labi Hovuz", stars: 3, rating: 9.4, reviews: 892, price: 520000, capacity: 4, art: "minaret", hue: 34, free: true,
    amenities: ["wifi", "breakfast", "ac", "transfer"], desc: "XIX asr savdogar uyi: o'ymakor shiftlar, hovli va tut daraxti. Labi Hovuz hovuzi 2 daqiqa." },
  { id: "h13", type: "hotel", name: "Poi Kalon Palace", city: "Buxoro", district: "Minorai Kalon, 300 m", stars: 4, rating: 9.1, reviews: 501, price: 780000, old: 890000, capacity: 3, art: "minaret", hue: 24, free: true,
    amenities: ["wifi", "breakfast", "restaurant", "ac", "spa"], desc: "Kalon minorasiga qaragan xonalar, an'anaviy hammom va milliy taomlar restorani." },
  { id: "h14", type: "hotel", name: "Sitorai Mohi Xosa Residence", city: "Buxoro", district: "Yangi shahar", stars: 4, rating: 8.6, reviews: 240, price: 590000, capacity: 5, art: "classic", hue: 44, free: false,
    amenities: ["wifi", "breakfast", "pool", "parking", "family"], desc: "Ochiq basseynli zamonaviy mehmonxona. Eski shaharga bepul avtobus har soatda qatnaydi." },
  { id: "h15", type: "hotel", name: "Ark Caravanserai", city: "Buxoro", district: "Ark qal'asi yonida", stars: 3, rating: 8.9, reviews: 377, price: 410000, capacity: 3, art: "fortress", hue: 30, free: true,
    amenities: ["wifi", "breakfast", "ac"], desc: "Qayta tiklangan karvonsaroy: hujralar hovli atrofida joylashgan, kechqurun hovlida musiqa kechasi." },

  // ---- Xiva ----
  { id: "h16", type: "hotel", name: "Ichan Qal'a Inn", city: "Xiva", district: "Ichan Qal'a ichida", stars: 3, rating: 9.0, reviews: 455, price: 460000, capacity: 3, art: "fortress", hue: 16, free: true,
    amenities: ["wifi", "breakfast", "ac"], desc: "Qal'a devorlari ichida, Kalta Minor yonida. Tomdagi terrasadan quyosh botishi ko'rinadi." },
  { id: "h17", type: "hotel", name: "Xorazm Shohona", city: "Xiva", district: "Dishan Qal'a", stars: 4, rating: 8.7, reviews: 263, price: 690000, old: 760000, capacity: 4, art: "minaret", hue: 12, free: true,
    amenities: ["wifi", "breakfast", "pool", "restaurant", "parking"], desc: "Xorazm uslubidagi yog'och ustunli ayvon, basseyn va Urganch aeroportiga transfer." },

  // ---- Shahrisabz ----
  { id: "h18", type: "hotel", name: "Oqsaroy View", city: "Shahrisabz", district: "Oqsaroy majmuasi", stars: 4, rating: 8.8, reviews: 174, price: 560000, capacity: 4, art: "portal", hue: 192, free: true,
    amenities: ["wifi", "breakfast", "parking", "restaurant", "family"], desc: "Oqsaroy peshtoqiga qaragan mehmonxona. Samarqanddan 2 soatlik tog' yo'li bilan keladigan mehmonlar uchun." },
  { id: "h19", type: "hotel", name: "Kitob Tog' Uyi", city: "Shahrisabz", district: "Kitob tumani", stars: 2, rating: 9.2, reviews: 88, price: 260000, capacity: 6, art: "mountain", hue: 150, free: true,
    amenities: ["breakfast", "parking", "family"], desc: "Tog' etagidagi oilaviy mehmon uyi: uy noni, bog' va Hisor tog'lariga piyoda sayr." },

  // ---- Farg'ona ----
  { id: "h20", type: "hotel", name: "Marg'ilon Atlas Hotel", city: "Farg'ona", district: "Marg'ilon", stars: 4, rating: 8.9, reviews: 211, price: 540000, capacity: 4, art: "garden", hue: 300, free: true,
    amenities: ["wifi", "breakfast", "restaurant", "parking", "ac"], desc: "Yodgorlik ipak fabrikasi yonida. Mehmonlar atlas to'qish jarayonini ko'rishi mumkin." },
  { id: "h21", type: "hotel", name: "Rishton Kulol Uyi", city: "Farg'ona", district: "Rishton", stars: 3, rating: 9.3, reviews: 132, price: 350000, capacity: 4, art: "house", hue: 205, free: true,
    amenities: ["wifi", "breakfast", "family"], desc: "Kulol oilasi mehmonxonasi: ko'k sopol ustaxonasi va o'zingiz piyola yasaydigan dars." },

  // ---- Chimyon ----
  { id: "h22", type: "hotel", name: "Chimyon Peak Resort", city: "Chimyon", district: "Chimyon chang'i bazasi", stars: 5, rating: 9.1, reviews: 688, price: 1750000, old: 1990000, capacity: 5, art: "mountain", hue: 208, free: false,
    amenities: ["wifi", "breakfast", "pool", "spa", "restaurant", "parking", "family"], desc: "Chang'i ko'targichidan 200 m. Isitiladigan ochiq basseyn, sauna va qishda chang'i ijarasi." },
  { id: "h23", type: "hotel", name: "Chorvoq Lake Cottages", city: "Chimyon", district: "Chorvoq suv ombori", stars: 4, rating: 8.8, reviews: 402, price: 1100000, capacity: 6, art: "lake", hue: 190, free: true,
    amenities: ["wifi", "breakfast", "parking", "family", "restaurant"], desc: "Suv bo'yidagi yog'och kottejlar: har birida mangal joyi va ko'lga qaragan ayvon." },

  // ---- Termiz ----
  { id: "h24", type: "hotel", name: "Surxon Oasis", city: "Termiz", district: "Termiz markazi", stars: 4, rating: 8.5, reviews: 119, price: 480000, capacity: 4, art: "stupa", hue: 38, free: true,
    amenities: ["wifi", "breakfast", "pool", "parking", "ac"], desc: "Fayoztepa va Qoratepa buddaviy yodgorliklariga ekskursiyalar uchun qulay boshlang'ich nuqta." },

  // ---- Zallar ----
  { id: "v01", type: "venue", name: "Navoiy Kongress Zali", city: "Toshkent", district: "Amir Temur xiyoboni", rating: 9.0, reviews: 84, price: 18500000, capacity: 600, art: "hall", hue: 230, free: false,
    amenities: ["wifi", "translation", "screen", "coffee", "parking"], desc: "Teatr uslubida 600 o'rin, 6 kanalli sinxron tarjima kabinalari, 12 m LED ekran." },
  { id: "v02", type: "venue", name: "Afrosiyob Forum Hall", city: "Samarqand", district: "Silk Road Samarqand", rating: 9.3, reviews: 52, price: 12000000, old: 13500000, capacity: 350, art: "hall", hue: 198, free: false,
    amenities: ["wifi", "translation", "screen", "coffee", "parking"], desc: "Xalqaro forumlar uchun qurilgan zal: fuye, 4 ta kichik muzokaralar xonasi va matbuot markazi." },
  { id: "v03", type: "venue", name: "Mirzo Ulug'bek Seminar Xonasi", city: "Toshkent", district: "IT Park yonida", rating: 8.7, reviews: 118, price: 2400000, capacity: 40, art: "tower", hue: 168, free: true,
    amenities: ["wifi", "screen", "coffee"], desc: "Trening va seminarlar uchun: flipchart, videoaloqa uskunasi, tushlik keyteringi." },
  { id: "v04", type: "venue", name: "Ark Ziyofat Zali", city: "Buxoro", district: "Ark qal'asi yonida", rating: 8.9, reviews: 47, price: 7800000, capacity: 220, art: "fortress", hue: 26, free: false,
    amenities: ["screen", "coffee", "parking", "stage"], desc: "Gala-kechalar va banketlar uchun sahnali zal, milliy raqs dasturini buyurtma qilish mumkin." },
  { id: "v05", type: "venue", name: "Chorvoq Team Base", city: "Chimyon", district: "Chorvoq", rating: 9.1, reviews: 39, price: 5600000, capacity: 120, art: "lake", hue: 196, free: true,
    amenities: ["wifi", "screen", "coffee", "parking"], desc: "Jamoaviy treninglar uchun ochiq maydon va zal, keyin qayiq sayri yoki tog' yurishi." },
  { id: "v06", type: "venue", name: "Oqsaroy Konferens-markazi", city: "Shahrisabz", district: "Shahar markazi", rating: 8.6, reviews: 21, price: 4200000, capacity: 150, art: "portal", hue: 186, free: true,
    amenities: ["wifi", "screen", "coffee", "parking"], desc: "Hududiy anjumanlar uchun 150 o'rinli zal, mehmonxona bloki bilan birga bron qilinadi." },

  // ---- Turlar ----
  { id: "t01", type: "tour", name: "Samarqand: Registon va Shohi Zinda", city: "Samarqand", district: "6 soat, piyoda", rating: 9.6, reviews: 1712, price: 350000, capacity: 30, art: "dome", hue: 202, free: true,
    amenities: ["guide", "tickets"], desc: "Registon, Bibixonim, Siyob bozori va Shohi Zinda. Gid o'zbek, rus va ingliz tillarida." },
  { id: "t02", type: "tour", name: "Buxoro kechki sayr va milliy taomlar", city: "Buxoro", district: "3 soat, kechqurun", rating: 9.3, reviews: 601, price: 280000, old: 320000, capacity: 20, art: "minaret", hue: 36, free: true,
    amenities: ["guide", "meal"], desc: "Yoritilgan Poi Kalon, savdo gumbazlari va oilaviy uyda plov kechasi." },
  { id: "t03", type: "tour", name: "Toshkent metrosi va Eski shahar", city: "Toshkent", district: "4 soat, piyoda", rating: 9.0, reviews: 755, price: 220000, capacity: 25, art: "tower", hue: 182, free: true,
    amenities: ["guide", "tickets"], desc: "Eng chiroyli 8 ta metro bekati, Chorsu bozori, Hazrati Imom majmuasi." },
  { id: "t04", type: "tour", name: "Xiva: Ichan Qal'a to'liq ekskursiya", city: "Xiva", district: "5 soat", rating: 9.5, reviews: 467, price: 300000, capacity: 25, art: "fortress", hue: 14, free: true,
    amenities: ["guide", "tickets"], desc: "Kalta Minor, Juma masjidi, Toshhovli saroyi va qal'a devoriga chiqish." },
  { id: "t05", type: "tour", name: "Chimyon va Chorvoq: bir kunlik safar", city: "Chimyon", district: "10 soat, transport bilan", rating: 9.1, reviews: 584, price: 540000, capacity: 40, art: "mountain", hue: 204, free: true,
    amenities: ["guide", "transport", "meal"], desc: "Toshkentdan olib ketish, kanat yo'li, Chorvoq bo'yida tushlik va qaytish." },
  { id: "t06", type: "tour", name: "Shahrisabz: Amir Temur yurti", city: "Shahrisabz", district: "Samarqanddan, 9 soat", rating: 9.2, reviews: 233, price: 490000, capacity: 18, art: "portal", hue: 190, free: true,
    amenities: ["guide", "transport", "meal"], desc: "Taxtaqoracha dovoni orqali Oqsaroy, Ko'k gumbaz va Dorus-saodat majmuasi." },
  { id: "t07", type: "tour", name: "Farg'ona hunarmandlari", city: "Farg'ona", district: "1 kun", rating: 9.4, reviews: 141, price: 420000, capacity: 15, art: "garden", hue: 310, free: true,
    amenities: ["guide", "transport", "meal"], desc: "Marg'ilon ipak fabrikasi, Rishton kulollari va Qo'qon Xudoyorxon o'rdasi." },
  { id: "t08", type: "tour", name: "Termiz: Buddaviy yodgorliklar", city: "Termiz", district: "7 soat", rating: 9.0, reviews: 76, price: 380000, capacity: 20, art: "stupa", hue: 42, free: true,
    amenities: ["guide", "transport", "tickets"], desc: "Fayoztepa, Qoratepa, Zurmala stupasi va Al-Hakim at-Termiziy majmuasi." }
];
