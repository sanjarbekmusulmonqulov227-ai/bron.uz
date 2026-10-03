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

  // ---- Hostellar (narx 1 o'rin, 1 kecha uchun) ----
  { id: "hs01", type: "hostel", kind: "Hostel", name: "Topchan Hostel", city: "Toshkent", district: "Chilonzor, metro yonida", rating: 9.1, reviews: 642, price: 120000, capacity: 8, beds: 36, art: "house", hue: 160, free: true,
    amenities: ["wifi", "breakfast", "kitchen", "laundry", "ac"], desc: "Ayvonli hovli, 4 va 6 o'rinli xonalar, har bir karavotda chiroq va rozetka. Kechqurun umumiy oshxonada choy va tanishuv." },
  { id: "hs02", type: "hostel", kind: "Hostel", name: "Backpackers Toshkent Markaz", city: "Toshkent", district: "Amir Temur xiyoboni, 500 m", rating: 8.8, reviews: 1033, price: 140000, capacity: 8, beds: 48, art: "classic", hue: 210, free: true,
    amenities: ["wifi", "kitchen", "laundry", "ac", "transfer"], desc: "Shahar markazida, metro va aeroport avtobusi yonida. Ayollar uchun alohida xona va shaxsiy shkafchalar." },
  { id: "hs03", type: "hostel", kind: "Hostel", name: "Bahor Hostel", city: "Samarqand", district: "Registon, 700 m", rating: 9.4, reviews: 877, price: 110000, capacity: 8, beds: 30, art: "dome", hue: 200, free: true,
    amenities: ["wifi", "breakfast", "kitchen", "ac"], desc: "Tomdan Registon gumbazlari ko'rinadi. Nonushtada issiq non, qaymoq va mahalliy murabbo." },
  { id: "hs04", type: "hostel", kind: "Hostel", name: "Kukeldash Hostel", city: "Buxoro", district: "Labi Hovuz, 200 m", rating: 9.2, reviews: 715, price: 95000, capacity: 8, beds: 28, art: "minaret", hue: 34, free: true,
    amenities: ["wifi", "breakfast", "kitchen", "laundry"], desc: "Eski shahar ichida, an'anaviy hovli va salqin yerto'la xonasi. Velosiped ijarasi bor." },
  { id: "hs05", type: "hostel", kind: "Hostel", name: "Ichan Hostel", city: "Xiva", district: "Ichan Qal'a ichida", rating: 9.0, reviews: 402, price: 90000, capacity: 6, beds: 20, art: "fortress", hue: 18, free: true,
    amenities: ["wifi", "breakfast", "ac"], desc: "Qal'a devorlari ichidagi oilaviy hostel, tomdan quyosh botishi manzarasi." },
  { id: "hs06", type: "hostel", kind: "Hostel", name: "Ipak Hostel", city: "Farg'ona", district: "Farg'ona markazi", rating: 8.7, reviews: 158, price: 80000, capacity: 6, beds: 18, art: "garden", hue: 310, free: true,
    amenities: ["wifi", "kitchen", "laundry", "transfer"], desc: "Marg'ilon va Rishtonga kunlik sayohatlar uchun qulay boshlang'ich nuqta." },
  { id: "hs07", type: "hostel", kind: "Hostel", name: "Chimyon Tog' Hostel", city: "Chimyon", district: "Chimyon kurorti", rating: 8.9, reviews: 233, price: 130000, capacity: 8, beds: 24, art: "mountain", hue: 205, free: true,
    amenities: ["wifi", "kitchen", "parking"], desc: "Chang'ichilar va tog' sayyohlari uchun: jihozlar quritgichi, kamin va issiq choy." },
  { id: "hs08", type: "hostel", kind: "Hostel", name: "Surxon Hostel", city: "Termiz", district: "Termiz markazi", rating: 8.6, reviews: 74, price: 75000, capacity: 6, beds: 16, art: "stupa", hue: 42, free: true,
    amenities: ["wifi", "breakfast", "ac"], desc: "Arxeologiya yodgorliklariga yaqin, mehmondo'st oilaviy hostel." },

  // ---- Konferens-zallar ----
  // layouts: teatr / sinf / banket / furshet (kishi); area: m²; format: conf | meet | gala | open | expo
  { id: "v01", type: "venue", format: "conf", kind: "Kongress-zal", name: "Navoiy Kongress Zali", city: "Toshkent", district: "Amir Temur xiyoboni", rating: 9.0, reviews: 84, price: 18500000, capacity: 600, area: 1100, layouts: { teatr: 600, sinf: 320, banket: 400, furshet: 700 }, art: "hall", hue: 230, free: false,
    photos: [{ file: "Palace_of_International_Forums.JPG", title: "Xalqaro forumlar saroyi uslubidagi bino" }, { file: "700_seat_auditorium.jpg", title: "Teatr uslubidagi zal" }],
    amenities: ["wifi", "translation", "screen", "stage", "coffee", "parking"], desc: "Hukumat darajasidagi forumlar va xalqaro kongresslar uchun. 6 kanalli sinxron tarjima kabinalari, 12 metrli LED ekran, matbuot markazi va VIP-zal." },
  { id: "v02", type: "venue", format: "conf", kind: "Forum zal", name: "Afrosiyob Forum Hall", city: "Samarqand", district: "Silk Road Samarqand", rating: 9.3, reviews: 52, price: 12000000, old: 13500000, capacity: 350, area: 640, layouts: { teatr: 350, sinf: 180, banket: 240, furshet: 400 }, art: "hall", hue: 198, free: false,
    photos: [{ file: "700_seat_auditorium.jpg", title: "Forum zali" }],
    amenities: ["wifi", "translation", "screen", "coffee", "parking"], desc: "Xalqaro forumlar uchun qurilgan zal: keng fuye, 4 ta muzokara xonasi va matbuot markazi. Mehmonxonalar bloki bilan bir hududda." },
  { id: "v03", type: "venue", format: "meet", kind: "Seminar xonasi", name: "Mirzo Ulug'bek Seminar Xonasi", city: "Toshkent", district: "IT Park yonida", rating: 8.7, reviews: 118, price: 2400000, capacity: 40, area: 85, layouts: { teatr: 40, sinf: 24, banket: 30, furshet: 45 }, art: "tower", hue: 168, free: true,
    amenities: ["wifi", "screen", "coffee", "ac"], desc: "Trening va seminarlar uchun: flipchart, videoaloqa uskunasi, yorug' deraza va tushlik keyteringi." },
  { id: "v04", type: "venue", format: "gala", kind: "Ziyofat zali", name: "Ark Ziyofat Zali", city: "Buxoro", district: "Ark qal'asi yonida", rating: 8.9, reviews: 47, price: 7800000, capacity: 260, area: 520, layouts: { teatr: 260, sinf: 120, banket: 220, furshet: 300 }, art: "fortress", hue: 26, free: false,
    photos: [{ file: "Wedding_Banquet_setting.jpeg", title: "Banket uchun bezatilgan zal" }],
    amenities: ["screen", "stage", "coffee", "parking"], desc: "Gala-kechalar va banketlar uchun sahnali zal. Milliy raqs, maqom ansambli va Buxoro oshxonasi dasturini buyurtma qilish mumkin." },
  { id: "v05", type: "venue", format: "open", kind: "Team-building baza", name: "Chorvoq Team Base", city: "Chimyon", district: "Chorvoq suv ombori", rating: 9.1, reviews: 39, price: 5600000, capacity: 120, area: 2400, layouts: { teatr: 120, sinf: 60, banket: 100, furshet: 150 }, art: "lake", hue: 196, free: true,
    amenities: ["wifi", "screen", "coffee", "parking", "transfer"], desc: "Jamoaviy treninglar uchun ochiq maydon va yopiq zal. Tadbirdan keyin qayiq sayri, tog' yurishi yoki gulxan kechasi." },
  { id: "v06", type: "venue", format: "conf", kind: "Konferens-markaz", name: "Oqsaroy Konferens-markazi", city: "Shahrisabz", district: "Shahar markazi", rating: 8.6, reviews: 21, price: 4200000, capacity: 150, area: 300, layouts: { teatr: 150, sinf: 80, banket: 110, furshet: 180 }, art: "portal", hue: 186, free: true,
    amenities: ["wifi", "screen", "coffee", "parking"], desc: "Hududiy anjumanlar uchun 150 o'rinli zal. Mehmonxona bloki va Oqsaroyga ekskursiya bilan birga bron qilinadi." },
  { id: "v07", type: "venue", format: "conf", kind: "Biznes-zal", name: "Tashkent City Business Hall", city: "Toshkent", district: "Tashkent City, 18-qavat", rating: 9.4, reviews: 96, price: 9600000, old: 10800000, capacity: 250, area: 420, layouts: { teatr: 250, sinf: 140, banket: 180, furshet: 280 }, art: "tower", hue: 214, free: true,
    photos: [{ file: "TashkentCity.jpg", title: "Tashkent City" }],
    amenities: ["wifi", "screen", "translation", "coffee", "parking", "ac"], desc: "Shahar panoramasiga ochiladigan zal: mahsulot taqdimotlari, investor uchrashuvlari va press-konferensiyalar uchun. Onlayn translyatsiya studiyasi bor." },
  { id: "v08", type: "venue", format: "open", kind: "Tom terassasi", name: "Registon Tom Terassasi", city: "Samarqand", district: "Registon maydoni, 400 m", rating: 9.7, reviews: 63, price: 8400000, capacity: 180, area: 600, layouts: { teatr: 160, sinf: 0, banket: 140, furshet: 180 }, art: "dome", hue: 205, free: false,
    photos: [{ file: "Registan_square_Samarkand,_Uzbekistan,_at_night.jpg", title: "Terassadan Registon manzarasi" }],
    amenities: ["stage", "coffee", "screen"], desc: "Kechki yoritilgan Registon ko'rinib turadigan ochiq terassa. Furshet, mukofotlash kechasi va korporativ fotosessiyalar uchun ideal." },
  { id: "v09", type: "venue", format: "meet", kind: "Board room", name: "Ipak Yo'li Board Room", city: "Toshkent", district: "Mirobod, biznes-markaz", rating: 9.2, reviews: 71, price: 1800000, capacity: 16, area: 48, layouts: { teatr: 0, sinf: 0, banket: 16, furshet: 20 }, art: "classic", hue: 30, free: true,
    amenities: ["wifi", "screen", "coffee", "ac"], desc: "Direktorlar kengashi va muzokaralar uchun 16 o'rinli stol, 4K videokonferensiya, ovoz izolyatsiyasi va shaxsiy kofe-breyk." },
  { id: "v10", type: "venue", format: "gala", kind: "Tarixiy hovli", name: "Labi Hovuz Madrasa Hovlisi", city: "Buxoro", district: "Labi Hovuz ansambli", rating: 9.5, reviews: 44, price: 11000000, capacity: 300, area: 900, layouts: { teatr: 300, sinf: 0, banket: 240, furshet: 350 }, art: "minaret", hue: 34, free: false,
    photos: [{ file: "Lyabi-Hovuz_and_Nadir_Divanbegi_Khanqah.jpg", title: "Labi Hovuz ansambli" }],
    amenities: ["stage", "coffee", "screen"], desc: "XVII asr madrasasi hovlisida ochiq osmon ostida gala-kechalar. Milliy liboslar ko'rgazmasi va hunarmandlar bozori qo'shiladi." },
  { id: "v11", type: "venue", format: "conf", kind: "Konferens-zal", name: "Ichan Qal'a Konferens Zali", city: "Xiva", district: "Ichan Qal'a darvozasi yonida", rating: 8.8, reviews: 26, price: 3900000, capacity: 120, area: 240, layouts: { teatr: 120, sinf: 70, banket: 90, furshet: 140 }, art: "fortress", hue: 16, free: true,
    amenities: ["wifi", "screen", "coffee", "parking"], desc: "Xorazmdagi ilmiy anjumanlar va turizm forumlari uchun. Qal'a devoriga chiqish va kechki ekskursiya bilan birga." },
  { id: "v12", type: "venue", format: "expo", kind: "Ko'rgazma zali", name: "Farg'ona Atlas Expo", city: "Farg'ona", district: "Farg'ona shahri, sanoat zonasi", rating: 8.9, reviews: 31, price: 14000000, capacity: 800, area: 2200, layouts: { teatr: 800, sinf: 0, banket: 500, furshet: 900 }, art: "garden", hue: 300, free: false,
    amenities: ["wifi", "screen", "parking", "stage"], desc: "2200 m² ko'rgazma maydoni: 60 ta stend joyi, yuk kirish darvozasi, alohida taqdimot sahnasi. To'qimachilik va hunarmandchilik ko'rgazmalari uchun." },
  { id: "v13", type: "venue", format: "gala", kind: "Ballroom", name: "Chimyon Mountain Ballroom", city: "Chimyon", district: "Chimyon kurorti", rating: 9.0, reviews: 58, price: 9200000, capacity: 400, area: 760, layouts: { teatr: 400, sinf: 220, banket: 320, furshet: 450 }, art: "mountain", hue: 210, free: true,
    amenities: ["wifi", "screen", "stage", "coffee", "parking", "transfer"], desc: "Tog' manzarali katta zal: yillik korporativ tadbirlar, dilerlar konferensiyasi va qishki incentive dasturlari uchun." },
  { id: "v14", type: "venue", format: "conf", kind: "Konferens-zal", name: "Baqtriya Hall", city: "Termiz", district: "Termiz markazi", rating: 8.5, reviews: 18, price: 3600000, capacity: 200, area: 380, layouts: { teatr: 200, sinf: 110, banket: 150, furshet: 220 }, art: "stupa", hue: 44, free: true,
    amenities: ["wifi", "translation", "screen", "coffee", "parking"], desc: "Chegara savdosi va arxeologiya anjumanlari uchun zal. Sinxron tarjima va Fayoztepaga ekskursiya tashkil qilinadi." },

  // ---- Tur paketlari (ko'p kunlik) ----
  // days/nights, route, itinerary: [kun sarlavhasi, tavsif]
  { id: "p01", type: "tour", name: "Buyuk Ipak yo'li: to'rt shahar", city: "Toshkent", district: "8 kun · 7 kecha", days: 8, nights: 7, route: ["Toshkent", "Samarqand", "Buxoro", "Xiva"], rating: 9.8, reviews: 412, price: 9800000, old: 10900000, capacity: 16, art: "dome", hue: 205, free: true,
    amenities: ["hotel", "train", "transport", "guide", "meal", "tickets"], desc: "O'zbekistonning eng mashhur yo'nalishi: poytaxtdan Xorazmgacha. 4 yulduzli mehmonxonalar, Afrosiyob tezyurar poyezdi va har bir shaharda litsenziyali gid.",
    itinerary: [["1-kun · Toshkent", "Aeroportda kutib olish, Hazrati Imom majmuasi, Chorsu bozori, kechki osh markazi."], ["2-kun · Toshkent", "Metro bekatlari, Amir Temur xiyoboni, Tashkent City. Kechqurun Afrosiyob poyezdida Samarqandga."], ["3-kun · Samarqand", "Registon, Bibixonim masjidi, Siyob bozori, Go'ri Amir maqbarasi."], ["4-kun · Samarqand", "Shohi Zinda, Ulug'bek rasadxonasi, Konigil qog'oz ustaxonasi."], ["5-kun · Buxoro", "Poyezdda Buxoroga. Labi Hovuz, savdo gumbazlari, kechki plov oilaviy uyda."], ["6-kun · Buxoro", "Ark qal'asi, Poi Kalon, Somoniylar maqbarasi, Sitorai Mohi Xosa saroyi."], ["7-kun · Xiva", "Qizilqum orqali Xivaga. Ichan Qal'a, Kalta Minor, quyosh botishida qal'a devori."], ["8-kun · Xiva", "Toshhovli saroyi, Juma masjidi. Urganch aeroportiga transfer."]] },
  { id: "p02", type: "tour", name: "Samarqand va Buxoro: klassik safar", city: "Samarqand", district: "5 kun · 4 kecha", days: 5, nights: 4, route: ["Toshkent", "Samarqand", "Buxoro"], rating: 9.6, reviews: 538, price: 5400000, capacity: 18, art: "minaret", hue: 34, free: true,
    amenities: ["hotel", "train", "guide", "meal", "tickets"], desc: "Ikki muzey-shaharning eng yaxshi joylari bitta qisqa safarda. Birinchi marta keladiganlar uchun eng ko'p tanlanadigan paket.",
    itinerary: [["1-kun · Samarqand", "Toshkentdan ertalabki Afrosiyob poyezdi. Registon va Go'ri Amir."], ["2-kun · Samarqand", "Shohi Zinda, Bibixonim, Siyob bozori, kechki Registon nur-shousi."], ["3-kun · Buxoro", "Poyezdda Buxoroga. Labi Hovuz va savdo gumbazlari."], ["4-kun · Buxoro", "Ark, Poi Kalon, Chor Minor, hunarmandlar ustaxonalari."], ["5-kun · Buxoro", "Nonushta, Toshkentga poyezd yoki aeroportga transfer."]] },
  { id: "p03", type: "tour", name: "Afrosiyobda Samarqand: dam olish kunlari", city: "Samarqand", district: "2 kun · 1 kecha", days: 2, nights: 1, route: ["Toshkent", "Samarqand"], rating: 9.4, reviews: 864, price: 2100000, capacity: 20, art: "dome", hue: 198, free: true,
    amenities: ["hotel", "train", "guide", "tickets"], desc: "Shanba-yakshanba uchun: poyezd chiptalari, markazdagi mehmonxona va to'liq kunlik gid. Juma kechqurun bron qilsangiz ham ulguramiz.",
    itinerary: [["1-kun", "07:28 Afrosiyob poyezdi, Registon, Go'ri Amir, Siyob bozori, kechki nur-shou."], ["2-kun", "Shohi Zinda, Ulug'bek rasadxonasi, 17:00 Toshkentga qaytish."]] },
  { id: "p04", type: "tour", name: "Xorazm: Xiva va cho'l qal'alari", city: "Xiva", district: "3 kun · 2 kecha", days: 3, nights: 2, route: ["Urganch", "Xiva", "Ayozqal'a"], rating: 9.5, reviews: 203, price: 3200000, capacity: 12, art: "fortress", hue: 18, free: true,
    amenities: ["hotel", "transport", "guide", "meal", "tickets"], desc: "Ichan Qal'a va Qizilqumdagi qadimiy Xorazm qal'alari. Bir kecha cho'ldagi o'tovda, gulxan va yulduzli osmon ostida.",
    itinerary: [["1-kun · Xiva", "Urganchda kutib olish, Ichan Qal'a, Kalta Minor, Muhammad Aminxon madrasasi."], ["2-kun · Cho'l", "Tuproqqal'a, Ayozqal'a, kechki gulxan va o'tovda tunash."], ["3-kun · Xiva", "Quyosh chiqishini kuzatish, Xivaga qaytish, aeroportga transfer."]] },
  { id: "p05", type: "tour", name: "Farg'ona vodiysi: ipak va sopol yo'li", city: "Farg'ona", district: "3 kun · 2 kecha", days: 3, nights: 2, route: ["Toshkent", "Qo'qon", "Marg'ilon", "Rishton"], rating: 9.3, reviews: 147, price: 2900000, capacity: 14, art: "garden", hue: 310, free: true,
    amenities: ["hotel", "transport", "guide", "meal"], desc: "Qamchiq dovoni orqali vodiyga: Yodgorlik ipak fabrikasi, Rishton kulollari, Qo'qon xonligi saroyi va mahalliy oshxona.",
    itinerary: [["1-kun · Qo'qon", "Toshkentdan Qamchiq dovoni orqali. Xudoyorxon o'rdasi, Jome masjidi."], ["2-kun · Marg'ilon", "Yodgorlik ipak fabrikasi, Kumtepa bozori, atlas to'qish ustaxonasi."], ["3-kun · Rishton", "Kulollar ustaxonasi, o'z qo'lingiz bilan piyola yasash, Toshkentga qaytish."]] },
  { id: "p06", type: "tour", name: "Chimyon tog'lari va Chorvoq", city: "Chimyon", district: "2 kun · 1 kecha", days: 2, nights: 1, route: ["Toshkent", "Chimyon", "Chorvoq"], rating: 9.2, reviews: 391, price: 1650000, capacity: 30, art: "mountain", hue: 204, free: true,
    amenities: ["hotel", "transport", "meal"], desc: "Shahar shovqinidan ikki kunlik dam: kanat yo'li, tog' yurishi, Chorvoq bo'yida baliq va kechki gulxan.",
    itinerary: [["1-kun", "Toshkentdan olib ketish, Amirsoy kanat yo'li, Chimyon cho'qqisiga yurish, kurort mehmonxonasi."], ["2-kun", "Chorvoq qirg'og'ida qayiq sayri, tushlik, kechqurun Toshkentga qaytish."]] },
  { id: "p07", type: "tour", name: "Surxondaryo: Buddaviy yo'l", city: "Termiz", district: "3 kun · 2 kecha", days: 3, nights: 2, route: ["Termiz", "Fayoztepa", "Boysun"], rating: 9.1, reviews: 64, price: 3100000, capacity: 12, art: "stupa", hue: 42, free: true,
    amenities: ["hotel", "transport", "guide", "meal", "tickets"], desc: "Kushonlar davri yodgorliklari, Termiz arxeologiya muzeyi va YUNESKO ro'yxatidagi Boysun madaniyati.",
    itinerary: [["1-kun · Termiz", "Arxeologiya muzeyi, Al-Hakim at-Termiziy majmuasi, Sulton Saodat."], ["2-kun · Qadimiy Termiz", "Fayoztepa, Qoratepa, Zurmala stupasi, Kirk-Kiz qal'asi."], ["3-kun · Boysun", "Tog' qishlog'i, mahalliy oila bilan tushlik, folklor ansambli."]] },
  { id: "p08", type: "tour", name: "Incentive: Samarqanddagi gala-kecha", city: "Samarqand", district: "3 kun · 2 kecha, korporativ", days: 3, nights: 2, route: ["Toshkent", "Samarqand"], rating: 9.7, reviews: 58, price: 6500000, capacity: 120, art: "dome", hue: 220, free: false,
    amenities: ["hotel", "train", "transport", "guide", "meal", "tickets"], desc: "Xodimlarni mukofotlash uchun tayyor dastur: 5 yulduzli mehmonxona, Registon oldida yopiq gala-kecha, milliy liboslarda fotosessiya va mahorat darslari.",
    itinerary: [["1-kun · Kelish", "Maxsus vagon, VIP kutib olish, mehmonxona, xush kelibsiz kechki ovqat."], ["2-kun · Samarqand", "Registon ekskursiyasi, osh tayyorlash mahorat darsi, kechqurun gala-kecha va mukofotlash."], ["3-kun · Qaytish", "Konigil qog'oz ustaxonasi, suvenirlar, Toshkentga qaytish."]] },

  // ---- Bir kunlik ekskursiyalar ----
  { id: "t01", type: "tour", name: "Samarqand: Registon va Shohi Zinda", city: "Samarqand", district: "1 kun · 6 soat, piyoda", days: 1, route: ["Registon", "Bibixonim", "Shohi Zinda"], rating: 9.6, reviews: 1712, price: 350000, capacity: 30, art: "dome", hue: 202, free: true,
    amenities: ["guide", "tickets"], desc: "Registon, Bibixonim, Siyob bozori va Shohi Zinda. Gid o'zbek, rus va ingliz tillarida.",
    itinerary: [["09:00", "Registon maydoni, uchta madrasa ichki hovlilari."], ["11:30", "Bibixonim masjidi va Siyob bozori."], ["13:30", "Shohi Zinda maqbaralar ko'chasi."]] },
  { id: "t02", type: "tour", name: "Buxoro kechki sayr va milliy taomlar", city: "Buxoro", district: "1 kun · 3 soat, kechqurun", days: 1, route: ["Labi Hovuz", "Poi Kalon", "Oilaviy uy"], rating: 9.3, reviews: 601, price: 280000, old: 320000, capacity: 20, art: "minaret", hue: 36, free: true,
    amenities: ["guide", "meal"], desc: "Yoritilgan Poi Kalon, savdo gumbazlari va oilaviy uyda plov kechasi.",
    itinerary: [["18:00", "Labi Hovuz va savdo gumbazlari."], ["19:15", "Yoritilgan Poi Kalon ansambli."], ["20:00", "Oilaviy uyda Buxoro oshi."]] },
  { id: "t03", type: "tour", name: "Toshkent metrosi va Eski shahar", city: "Toshkent", district: "1 kun · 4 soat, piyoda", days: 1, route: ["Chorsu", "Hazrati Imom", "Metro"], rating: 9.0, reviews: 755, price: 220000, capacity: 25, art: "tower", hue: 182, free: true,
    amenities: ["guide", "tickets"], desc: "Eng chiroyli 8 ta metro bekati, Chorsu bozori, Hazrati Imom majmuasi.",
    itinerary: [["10:00", "Hazrati Imom majmuasi va Usmon Qur'oni."], ["11:30", "Chorsu bozori va Ko'kaldosh madrasasi."], ["12:30", "Kosmonavtlar, Alisher Navoiy va boshqa metro bekatlari."]] },
  { id: "t04", type: "tour", name: "Xiva: Ichan Qal'a to'liq ekskursiya", city: "Xiva", district: "1 kun · 5 soat", days: 1, route: ["Ota darvoza", "Kalta Minor", "Toshhovli"], rating: 9.5, reviews: 467, price: 300000, capacity: 25, art: "fortress", hue: 14, free: true,
    amenities: ["guide", "tickets"], desc: "Kalta Minor, Juma masjidi, Toshhovli saroyi va qal'a devoriga chiqish.",
    itinerary: [["09:30", "Ota darvoza, Kalta Minor, Ko'hna Ark."], ["11:30", "Juma masjidi, Islom Xo'ja minorasi."], ["13:00", "Toshhovli saroyi va qal'a devori."]] },
  { id: "t05", type: "tour", name: "Chimyon va Chorvoq: bir kunlik safar", city: "Chimyon", district: "1 kun · 10 soat, transport bilan", days: 1, route: ["Toshkent", "Chimyon", "Chorvoq"], rating: 9.1, reviews: 584, price: 540000, capacity: 40, art: "mountain", hue: 204, free: true,
    amenities: ["guide", "transport", "meal"], desc: "Toshkentdan olib ketish, kanat yo'li, Chorvoq bo'yida tushlik va qaytish.",
    itinerary: [["08:00", "Toshkentdan olib ketish."], ["10:00", "Kanat yo'li va tog'da sayr."], ["14:00", "Chorvoq bo'yida tushlik, 18:00 qaytish."]] },
  { id: "t06", type: "tour", name: "Shahrisabz: Amir Temur yurti", city: "Shahrisabz", district: "1 kun · Samarqanddan, 9 soat", days: 1, route: ["Samarqand", "Taxtaqoracha", "Shahrisabz"], rating: 9.2, reviews: 233, price: 490000, capacity: 18, art: "portal", hue: 190, free: true,
    amenities: ["guide", "transport", "meal"], desc: "Taxtaqoracha dovoni orqali Oqsaroy, Ko'k gumbaz va Dorus-saodat majmuasi.",
    itinerary: [["08:30", "Samarqanddan jo'nash, dovonda to'xtash."], ["11:00", "Oqsaroy, Ko'k gumbaz, Dorut-tilovat."], ["14:00", "Mahalliy oshxonada tushlik, qaytish."]] },
  { id: "t07", type: "tour", name: "Farg'ona hunarmandlari", city: "Farg'ona", district: "1 kun", days: 1, route: ["Marg'ilon", "Rishton", "Qo'qon"], rating: 9.4, reviews: 141, price: 420000, capacity: 15, art: "garden", hue: 310, free: true,
    amenities: ["guide", "transport", "meal"], desc: "Marg'ilon ipak fabrikasi, Rishton kulollari va Qo'qon Xudoyorxon o'rdasi.",
    itinerary: [["09:00", "Yodgorlik ipak fabrikasi."], ["12:00", "Rishton kulollari ustaxonasi."], ["15:00", "Qo'qon, Xudoyorxon o'rdasi."]] },
  { id: "t08", type: "tour", name: "Termiz: Buddaviy yodgorliklar", city: "Termiz", district: "1 kun · 7 soat", days: 1, route: ["Fayoztepa", "Qoratepa", "Zurmala"], rating: 9.0, reviews: 76, price: 380000, capacity: 20, art: "stupa", hue: 42, free: true,
    amenities: ["guide", "transport", "tickets"], desc: "Fayoztepa, Qoratepa, Zurmala stupasi va Al-Hakim at-Termiziy majmuasi.",
    itinerary: [["09:00", "Arxeologiya muzeyi."], ["11:00", "Fayoztepa va Qoratepa."], ["14:00", "Zurmala stupasi, Al-Hakim at-Termiziy."]] }
];

// Haqiqiy shahar suratlari: Wikimedia Commons (erkin litsenziyalar, mualliflari fayl sahifasida).
// Joy kartochkasida o'sha joy joylashgan shaharning surati ko'rsatiladi, mehmonxonaning o'zi emas.
window.BRON_PHOTOS = {
  "Toshkent": [
    { file: "Tashkent_skyline_2019.jpg", title: "Toshkent osmono'par binolari" },
    { file: "TashkentCity.jpg", title: "Tashkent City" },
    { file: "Minor_Mosque_Tashkent.jpg", title: "Minor masjidi" },
    { file: "Tashkent_TV_Tower_173.jpg", title: "Toshkent teleminorasi" }
  ],
  "Samarqand": [
    { file: "Registan_Samarkand_Uzbekistan.JPG", title: "Registon" },
    { file: "Registan_square_Samarkand,_Uzbekistan,_at_night.jpg", title: "Registon kechasi" },
    { file: "Samarkand_Shah-i_Zinda_general_view.JPG", title: "Shohi Zinda" },
    { file: "Gur_Emir_Mausoleum,_Samarkand_(4934602294).jpg", title: "Go'ri Amir" },
    { file: "Bibi-Khanym_Mosque_in_Samarkand,_Uzbekistan_(6134515470).jpg", title: "Bibixonim masjidi" },
    { file: "Ulugh_Beg_Madrasa_of_Registan_in_Samarkand_Uzbekistan.jpg", title: "Ulug'bek madrasasi" }
  ],
  "Buxoro": [
    { file: "Po-i-Kalyan_in_Bukhara.jpg", title: "Poi Kalon" },
    { file: "Kalon_Minaret,_Bukhara_(4933987001).jpg", title: "Minorai Kalon" },
    { file: "Lyabi-Hovuz_and_Nadir_Divanbegi_Khanqah.jpg", title: "Labi Hovuz" },
    { file: "Ark_Bukhara.jpg", title: "Ark qal'asi" },
    { file: "Bukhara_old_city_Uzbekistan_banner.jpg", title: "Buxoro eski shahri" }
  ],
  "Xiva": [
    { file: "Kalta_Minor,_Khiva,_Uzbekistan.jpg", title: "Kalta Minor" },
    { file: "Itchan_Kala_Khiva_2012.jpg", title: "Ichan Qal'a" },
    { file: "Xiva_kalta_minor.jpg", title: "Kalta Minor" }
  ],
  "Shahrisabz": [
    { file: "Aq-Saray_Shahrisabz.JPG", title: "Oqsaroy" },
    { file: "Ak_Serai_Palace,_Shakhrisabz_(490809).jpg", title: "Oqsaroy peshtoqi" }
  ],
  "Farg'ona": [
    { file: "Khudayar_Khan_Palace,_Kokand_01.JPG", title: "Xudoyorxon o'rdasi, Qo'qon" },
    { file: "Khudayar_Khan_Palace,_Kokand_(495581).jpg", title: "Xudoyorxon o'rdasi" },
    { file: "Street_Scene_with_Flowers_and_Passing_Woman_-_Fergana_-_Uzbekistan_(7535771060).jpg", title: "Farg'ona ko'chasi" }
  ],
  "Chimyon": [
    { file: "Uzbekistan_Chimgan_Mountains.jpg", title: "Chimyon tog'lari" },
    { file: "Greater_Chimgan_Mountain.JPG", title: "Katta Chimyon" },
    { file: "Chorvoq_Staumauer.JPG", title: "Chorvoq to'g'oni" }
  ],
  "Termiz": [
    { file: "Termiz,_Fayoz-Tepe_(6240998331).jpg", title: "Fayoztepa" }
  ]
};

// Shahar markazlari (xarita uchun). Joyda aniq lat/lng bo'lmasa, shu nuqta atrofida ko'rsatiladi.
window.BRON_GEO = {
  "Toshkent": [41.3111, 69.2797, 0.045], "Samarqand": [39.6548, 66.9757, 0.018], "Buxoro": [39.7758, 64.4142, 0.012],
  "Xiva": [41.3785, 60.3594, 0.006], "Shahrisabz": [39.0626, 66.8302, 0.01], "Farg'ona": [40.3842, 71.7843, 0.02],
  "Chimyon": [41.5536, 70.0270, 0.02], "Termiz": [37.2242, 67.2783, 0.02], "Urganch": [41.5506, 60.6317, 0.01],
  "Qo'qon": [40.5286, 70.9425, 0.01], "Marg'ilon": [40.4712, 71.7246, 0.01], "Rishton": [40.3569, 71.2847, 0.01],
  "Chorvoq": [41.6315, 70.0420, 0.01], "Ayozqal'a": [42.0000, 61.0700, 0.01], "Fayoztepa": [37.2617, 67.1878, 0.004], "Boysun": [38.2058, 67.1986, 0.01]
};

// ---- Transport: namuna jadval (haqiqiy chipta tizimlariga ulanmagan) ----
window.BRON_TRANSPORT = (function () {
  const AIRPORT = { "Toshkent": "TAS", "Samarqand": "SKD", "Buxoro": "BHK", "Urganch": "UGC", "Farg'ona": "FEG", "Termiz": "TMJ" };
  // [raqam, qayerdan, qayerga, jo'nash, davomiylik (daqiqa), narx]; qaytish reysi raqam+1 bilan avtomatik qo'shiladi
  const FL = [
    ["HY 051", "Toshkent", "Urganch", "07:10", 105, 890000], ["HY 055", "Toshkent", "Urganch", "18:40", 105, 820000],
    ["HY 061", "Toshkent", "Buxoro", "08:20", 80, 740000], ["HY 065", "Toshkent", "Buxoro", "19:50", 80, 690000],
    ["HY 031", "Toshkent", "Samarqand", "09:05", 60, 590000],
    ["HY 041", "Toshkent", "Termiz", "06:55", 85, 760000],
    ["HY 071", "Toshkent", "Farg'ona", "10:15", 55, 520000]
  ];
  const t2m = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  const m2t = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const avia = [];
  FL.forEach(([no, a, b, dep, dur, price]) => {
    avia.push({ id: no.replace(" ", ""), mode: "avia", carrier: "Uzbekistan Airways", no, from: a, to: b, fromCode: AIRPORT[a], toCode: AIRPORT[b], dep, arr: m2t(t2m(dep) + dur), dur, price, bag: "20 kg yuk" });
    const back = no.slice(0, 3) + String(+no.slice(3) + 1).padStart(3, "0");
    const bdep = m2t(t2m(dep) + dur + 70);
    avia.push({ id: back.replace(" ", ""), mode: "avia", carrier: "Uzbekistan Airways", no: back, from: b, to: a, fromCode: AIRPORT[b], toCode: AIRPORT[a], dep: bdep, arr: m2t(t2m(bdep) + dur), dur, price: Math.round(price * 0.95 / 1000) * 1000, bag: "20 kg yuk" });
  });

  // [poyezd, raqam, qayerdan, qayerga, jo'nash, davomiylik, {klass: narx}, tungi]
  const TR = [
    ["Afrosiyob", "762F", "Toshkent", "Samarqand", "07:28", 130, { ekonom: 270000, biznes: 450000, vip: 690000 }],
    ["Afrosiyob", "764F", "Toshkent", "Samarqand", "08:00", 130, { ekonom: 270000, biznes: 450000, vip: 690000 }],
    ["Afrosiyob", "766F", "Toshkent", "Buxoro", "18:30", 230, { ekonom: 390000, biznes: 640000, vip: 950000 }],
    ["Sharq", "010F", "Toshkent", "Buxoro", "08:45", 370, { ekonom: 190000, biznes: 310000 }],
    ["Sharq", "012F", "Toshkent", "Samarqand", "16:10", 215, { ekonom: 150000, biznes: 240000 }],
    ["Afrosiyob", "768F", "Samarqand", "Buxoro", "10:05", 95, { ekonom: 170000, biznes: 280000, vip: 420000 }],
    ["Xorazm", "056F", "Toshkent", "Xiva", "20:50", 870, { plaskart: 260000, kupe: 380000, SV: 640000 }, true],
    ["Surxon", "380F", "Toshkent", "Termiz", "19:10", 780, { plaskart: 230000, kupe: 340000, SV: 590000 }, true],
    ["Farg'ona", "054F", "Toshkent", "Farg'ona", "07:45", 300, { ekonom: 160000, biznes: 260000 }]
  ];
  const poyezd = [];
  TR.forEach(([name, no, a, b, dep, dur, classes, night]) => {
    poyezd.push({ id: no, mode: "poyezd", name, no, from: a, to: b, dep, arr: m2t(t2m(dep) + dur), dur, classes, night: !!night });
    const back = String(+no.slice(0, 3) + 1).padStart(3, "0") + "F";
    const bdep = m2t(t2m(dep) + dur + (night ? 180 : 120));
    poyezd.push({ id: back, mode: "poyezd", name, no: back, from: b, to: a, dep: bdep, arr: m2t(t2m(bdep) + dur), dur, classes, night: !!night });
  });

  // Haydovchili avtomobil: narx = masofa × km narxi (eng kam to'lov bilan)
  const vehicles = [
    { id: "sedan", name: "Sedan", model: "Chevrolet Malibu yoki shunga o'xshash", seats: 3, bags: 3, perKm: 2000, min: 150000 },
    { id: "miniven", name: "Miniven", model: "Kia Carnival yoki shunga o'xshash", seats: 6, bags: 6, perKm: 3200, min: 250000 },
    { id: "mikro", name: "Mikroavtobus", model: "Mercedes Sprinter, 16 o'rin", seats: 16, bags: 16, perKm: 5000, min: 450000 },
    { id: "avtobus", name: "Avtobus", model: "Yutong yoki shunga o'xshash, 45 o'rin", seats: 45, bags: 45, perKm: 8000, min: 900000 }
  ];
  const KM = { "Toshkent|Samarqand": 310, "Toshkent|Buxoro": 570, "Samarqand|Buxoro": 270, "Buxoro|Xiva": 450, "Toshkent|Xiva": 1000, "Toshkent|Farg'ona": 310,
    "Samarqand|Shahrisabz": 90, "Toshkent|Chimyon": 85, "Samarqand|Termiz": 370, "Toshkent|Termiz": 700, "Toshkent|Shahrisabz": 400, "Buxoro|Termiz": 480, "Urganch|Xiva": 35 };
  const km = (a, b) => a === b ? 25 : KM[`${a}|${b}`] || KM[`${b}|${a}`] || 0;
  const avto = [];
  const places = [...new Set(Object.keys(KM).flatMap((k) => k.split("|")))];
  places.forEach((a) => places.forEach((b) => {
    const d = km(a, b); if (!d) return;
    vehicles.forEach((v) => avto.push({ id: `${v.id}:${a}:${b}`, mode: "avto", vehicle: v.id, name: v.name, model: v.model, seats: v.seats, bags: v.bags, from: a, to: b, km: d,
      dur: Math.round(d / (v.seats > 16 ? 60 : 75) * 60), price: Math.max(v.min, Math.round(d * v.perKm / 10000) * 10000), transfer: a === b }));
  }));
  return { avia, poyezd, avto, vehicles, airports: AIRPORT };
})();
