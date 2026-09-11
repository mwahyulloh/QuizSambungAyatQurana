// Memetakan nama surat ke Nomor Surat di API
const surahsData = {
  // Jilid 1
  "Al-Fatihah": { number: 1, arabic: "الفاتحة" },
  "An-Naas": { number: 114, arabic: "الناس" },
  "Al-Falaq": { number: 113, arabic: "الفلق" },
  "Al-Ikhlas": { number: 112, arabic: "الإخلاص" },
  "Al-Lahab": { number: 111, arabic: "اللهب" },
  
  // Jilid 2
  "An-Nashr": { number: 110, arabic: "النصر" },
  "Al-Kafirun": { number: 109, arabic: "الكافرون" },
  "Al-Kautsar": { number: 108, arabic: "الكوثر" },

  // Jilid 3
  "Al-Ma’un": { number: 107, arabic: "الماعون" },
  "Al-Quraisy": { number: 106, arabic: "قريش" },
  "Al-Fil": { number: 105, arabic: "الفيل" },

  // Jilid 4
  "Al-Humazah": { number: 104, arabic: "الهمزة" },
  "Al-‘Ashr": { number: 103, arabic: "العصر" },
  "At-Takatsur": { number: 102, arabic: "التكاثر" },

  // Jilid 5
  "Al-Qari’ah": { number: 101, arabic: "القارعة" },
  "Al-‘Adiyat": { number: 100, arabic: "العاديات" },

  // Jilid 6
  "Az-Zalzalah": { number: 99, arabic: "الزلزلة" },
  "Al-Bayyinah": { number: 98, arabic: "البينة" },

  // Al-Qur'an 1
  "Al-Qadr": { number: 97, arabic: "القدر" },
  "Al-‘Alaq": { number: 96, arabic: "العلق" },

  // Al-Qur'an 2
  "At-Tin": { number: 95, arabic: "التين" },
  "Al-Insyirah": { number: 94, arabic: "الشرح" },
  "Ad-Dhuha": { number: 93, arabic: "الضحى" }
};

const classCatalog = {
  "JILID 1": ["Al-Fatihah", "An-Naas", "Al-Falaq", "Al-Ikhlas", "Al-Lahab"],
  "JILID 2": ["An-Nashr", "Al-Kafirun", "Al-Kautsar"],
  "JILID 3": ["Al-Ma’un", "Al-Quraisy", "Al-Fil"],
  "JILID 4": ["Al-Humazah", "Al-‘Ashr", "At-Takatsur"],
  "JILID 5": ["Al-Qari’ah", "Al-‘Adiyat"],
  "JILID 6": ["Az-Zalzalah", "Al-Bayyinah"],
  "AL-QUR'AN 1": ["Al-Qadr", "Al-‘Alaq"],
  "AL-QUR'AN 2": ["At-Tin", "Al-Insyirah", "Ad-Dhuha"]
};