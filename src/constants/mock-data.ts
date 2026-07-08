/**
 * Geçici (mock) veriler.
 * Bunlar Firebase (Firestore) + Claude API'den gelen gerçek verilerle değiştiriliyor.
 * Firebase yapılandırılana kadar uygulama bu verilere düşer (bkz. src/lib/recipes.ts).
 */

import type { AllergenKey, Diet } from '@/lib/plan';

export type Recipe = {
  id: string;
  title: string;
  image: string;
  kcal: number;
  minutes: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  category: string;
  /** Tarifin içerdiği alerjenler (filtreleme için). */
  allergens: AllergenKey[];
  /** Bu tarifin uygun olduğu diyetler. */
  suitableDiets: Diet[];
  /** Malzeme listesi (detay ekranı). */
  ingredients?: string[];
  /** Yapılış adımları (detay ekranı). */
  steps?: string[];
  /** Topluluk tarifi ise paylaşan kullanıcı bilgisi. */
  authorName?: string;
  /** Topluluk tarifi ise paylaşanın uid'i (takip için). */
  authorUid?: string;
  /** Beğenen kullanıcı uid'leri (topluluk tarifleri). */
  likedBy?: string[];
};

export const categories = [
  'Tümü',
  'Kahvaltı',
  'Düşük Kalori',
  'Yüksek Protein',
  'Vegan',
  'Atıştırmalık',
] as const;

export const recipes: Recipe[] = [
  {
    id: 'r1',
    title: 'Avokadolu Tam Buğday Tost',
    image:
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=70',
    kcal: 320,
    minutes: 10,
    protein: 12,
    carbs: 30,
    fat: 18,
    tags: ['Kahvaltı', 'Hızlı'],
    category: 'Kahvaltı',
    allergens: ['gluten'],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '2 dilim tam buğday ekmeği',
      '1 olgun avokado',
      '1 çay kaşığı limon suyu',
      'Tuz, karabiber, pul biber',
      'İsteğe bağlı: çeri domates',
    ],
    steps: [
      'Ekmek dilimlerini kızartın.',
      'Avokadoyu ezip limon, tuz ve baharatla karıştırın.',
      'Ekmeklerin üzerine sürün, domatesle süsleyip servis edin.',
    ],
  },
  {
    id: 'r2',
    title: 'Izgara Tavuklu Kinoa Bowl',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=70',
    kcal: 450,
    minutes: 25,
    protein: 38,
    carbs: 40,
    fat: 12,
    tags: ['Yüksek Protein', 'Öğle'],
    category: 'Yüksek Protein',
    allergens: [],
    suitableDiets: ['omnivore'],
    ingredients: [
      '150 g tavuk göğsü',
      '1 su bardağı haşlanmış kinoa',
      'Avokado, salatalık, kiraz domates',
      'Zeytinyağı, limon, tuz',
      'Taze nane veya maydanoz',
    ],
    steps: [
      'Tavuğu baharatlayıp ızgarada pişirin, dinlendirip dilimleyin.',
      'Kinoa ve sebzeleri bir kaseye alın.',
      'Üzerine tavuğu ekleyin, zeytinyağı-limon sosuyla harmanlayın.',
    ],
  },
  {
    id: 'r3',
    title: 'Akdeniz Usulü Mevsim Salatası',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=70',
    kcal: 210,
    minutes: 15,
    protein: 8,
    carbs: 18,
    fat: 11,
    tags: ['Düşük Kalori', 'Vegan'],
    category: 'Düşük Kalori',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      'Marul, roka, kiraz domates',
      'Salatalık, kırmızı soğan',
      'Siyah zeytin',
      'Zeytinyağı, nar ekşisi, tuz',
    ],
    steps: [
      'Sebzeleri yıkayıp doğrayın.',
      'Geniş bir kaseye alıp zeytinleri ekleyin.',
      'Zeytinyağı ve nar ekşisiyle harmanlayıp servis edin.',
    ],
  },
  {
    id: 'r4',
    title: 'Yulaflı Çilekli Smoothie Bowl',
    image:
      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=800&q=70',
    kcal: 280,
    minutes: 8,
    protein: 14,
    carbs: 42,
    fat: 6,
    tags: ['Kahvaltı', 'Vegan'],
    category: 'Vegan',
    allergens: ['gluten'],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1/2 su bardağı yulaf',
      '1 muz',
      '1 avuç çilek',
      '1 su bardağı bitkisel süt',
      'Üzeri için: çia tohumu, hindistan cevizi',
    ],
    steps: [
      'Yulaf, muz ve sütü blenderdan geçirin.',
      'Karışımı kaseye dökün.',
      'Üzerine çilek ve tohumları dizip servis edin.',
    ],
  },
  {
    id: 'r5',
    title: 'Fırında Somon ve Sebze',
    image:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=70',
    kcal: 480,
    minutes: 30,
    protein: 42,
    carbs: 14,
    fat: 26,
    tags: ['Yüksek Protein', 'Akşam'],
    category: 'Yüksek Protein',
    allergens: ['seafood'],
    suitableDiets: ['omnivore', 'pescatarian'],
    ingredients: [
      '1 somon fileto (150 g)',
      'Brokoli, kabak, havuç',
      'Zeytinyağı, kekik, tuz',
      '1/2 limon',
    ],
    steps: [
      'Fırını 200°C ısıtın.',
      'Sebzeleri ve somonu yağlayıp baharatlayın.',
      'Fırın tepsisinde 20-25 dk pişirin, limonla servis edin.',
    ],
  },
  {
    id: 'r6',
    title: 'Humuslu Sebze Çubukları',
    image:
      'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=70',
    kcal: 160,
    minutes: 5,
    protein: 6,
    carbs: 20,
    fat: 7,
    tags: ['Atıştırmalık', 'Vegan'],
    category: 'Atıştırmalık',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1 kase hazır humus',
      'Havuç, salatalık, kereviz sapı',
      'Kırmızı/sarı biber',
      'Üzeri için zeytinyağı ve kırmızı biber',
    ],
    steps: [
      'Sebzeleri çubuk şeklinde doğrayın.',
      'Humusu kaseye alıp üzerine zeytinyağı gezdirin.',
      'Sebze çubuklarını humusa banarak tüketin.',
    ],
  },
  {
    id: 'r7',
    title: 'Menemen',
    image:
      'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=70',
    kcal: 240,
    minutes: 15,
    protein: 14,
    carbs: 10,
    fat: 16,
    tags: ['Kahvaltı', 'Hızlı'],
    category: 'Kahvaltı',
    allergens: ['egg'],
    suitableDiets: ['omnivore', 'vegetarian'],
    ingredients: [
      '3 yumurta',
      '2 domates',
      '2 yeşil biber',
      '1 yemek kaşığı zeytinyağı',
      'Tuz, karabiber, pul biber',
    ],
    steps: [
      'Biberleri zeytinyağında 2-3 dk soteleyin.',
      'Rendelenmiş domatesi ekleyip suyunu çekene kadar pişirin.',
      'Yumurtaları kırıp karıştırın, baharatlayıp ocaktan alın.',
    ],
  },
  {
    id: 'r8',
    title: 'Muzlu Fırın Yulaf',
    image:
      'https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&w=800&q=70',
    kcal: 310,
    minutes: 30,
    protein: 11,
    carbs: 52,
    fat: 8,
    tags: ['Kahvaltı', 'Tatlı'],
    category: 'Kahvaltı',
    allergens: ['gluten'],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1 su bardağı yulaf',
      '1 olgun muz',
      '1 su bardağı bitkisel süt',
      '1 çay kaşığı tarçın',
      'Üzeri için ceviz veya meyve',
    ],
    steps: [
      'Muzu ezip tüm malzemeyle karıştırın.',
      'Fırın kabına dökün.',
      '180°C fırında 20-25 dk pişirin.',
    ],
  },
  {
    id: 'r9',
    title: 'Yoğurtlu Meyveli Parfe',
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=70',
    kcal: 260,
    minutes: 5,
    protein: 15,
    carbs: 34,
    fat: 7,
    tags: ['Kahvaltı', 'Hızlı'],
    category: 'Kahvaltı',
    allergens: ['lactose'],
    suitableDiets: ['omnivore', 'vegetarian', 'pescatarian'],
    ingredients: [
      '200 g süzme yoğurt',
      '1 avuç yaban mersini ve çilek',
      '2 yemek kaşığı granola',
      '1 çay kaşığı bal',
    ],
    steps: [
      'Bardağa kat kat yoğurt, meyve ve granola dizin.',
      'Üzerine bal gezdirip hemen servis edin.',
    ],
  },
  {
    id: 'r10',
    title: 'Sebzeli Beyaz Peynirli Omlet',
    image:
      'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=70',
    kcal: 290,
    minutes: 12,
    protein: 20,
    carbs: 6,
    fat: 20,
    tags: ['Kahvaltı', 'Yüksek Protein'],
    category: 'Kahvaltı',
    allergens: ['egg', 'lactose'],
    suitableDiets: ['omnivore', 'vegetarian'],
    ingredients: [
      '3 yumurta',
      '30 g beyaz peynir',
      'Ispanak, mantar, kırmızı biber',
      '1 çay kaşığı zeytinyağı',
    ],
    steps: [
      'Sebzeleri küçük doğrayıp hafifçe soteleyin.',
      'Çırpılmış yumurtayı dökün, peyniri serpin.',
      'Kapağı kapatıp kısık ateşte 3-4 dk pişirin.',
    ],
  },
  {
    id: 'r11',
    title: 'Izgara Köfte ve Bulgur Pilavı',
    image:
      'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=70',
    kcal: 520,
    minutes: 35,
    protein: 36,
    carbs: 44,
    fat: 22,
    tags: ['Yüksek Protein', 'Akşam'],
    category: 'Yüksek Protein',
    allergens: ['gluten'],
    suitableDiets: ['omnivore'],
    ingredients: [
      '150 g yağsız dana kıyma',
      '1/2 soğan (rendelenmiş)',
      'Maydanoz, kimyon, karabiber',
      '1/2 su bardağı bulgur',
      'Yanına közlenmiş biber-domates',
    ],
    steps: [
      'Kıymayı baharat ve soğanla yoğurup köfte yapın.',
      'Izgarada veya döküm tavada çevirerek pişirin.',
      'Bulguru haşlayıp köftelerle servis edin.',
    ],
  },
  {
    id: 'r12',
    title: 'Ton Balıklı Kuru Fasulye Salatası',
    image:
      'https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=800&q=70',
    kcal: 330,
    minutes: 10,
    protein: 28,
    carbs: 26,
    fat: 12,
    tags: ['Yüksek Protein', 'Hızlı'],
    category: 'Yüksek Protein',
    allergens: ['seafood'],
    suitableDiets: ['omnivore', 'pescatarian'],
    ingredients: [
      '1 kutu ton balığı (suda)',
      '1 su bardağı haşlanmış fasulye',
      'Kırmızı soğan, maydanoz',
      'Limon suyu, zeytinyağı',
    ],
    steps: [
      'Tüm malzemeyi geniş bir kasede birleştirin.',
      'Limon ve zeytinyağıyla harmanlayıp servis edin.',
    ],
  },
  {
    id: 'r13',
    title: 'Izgara Tavuklu Wrap',
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=70',
    kcal: 430,
    minutes: 20,
    protein: 34,
    carbs: 38,
    fat: 15,
    tags: ['Yüksek Protein', 'Öğle'],
    category: 'Yüksek Protein',
    allergens: ['gluten'],
    suitableDiets: ['omnivore'],
    ingredients: [
      '1 tam buğday lavaş',
      '120 g ızgara tavuk göğsü',
      'Marul, domates, salatalık',
      '1 yemek kaşığı yoğurtlu sos',
    ],
    steps: [
      'Tavuğu baharatlayıp ızgarada pişirin, şerit doğrayın.',
      'Lavaşa sebzeler ve tavuğu yerleştirin.',
      'Sosu ekleyip sıkıca sarın; ikiye bölerek servis edin.',
    ],
  },
  {
    id: 'r14',
    title: 'Mercimek Köftesi',
    image:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=70',
    kcal: 310,
    minutes: 30,
    protein: 14,
    carbs: 48,
    fat: 8,
    tags: ['Vegan', 'Öğle'],
    category: 'Vegan',
    allergens: ['gluten'],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1 su bardağı kırmızı mercimek',
      '1/2 su bardağı ince bulgur',
      '1 soğan, salça, zeytinyağı',
      'Yeşil soğan, maydanoz, marul',
    ],
    steps: [
      'Mercimeği haşlayın, sıcakken bulguru ekleyip demlendirin.',
      'Soğanı salçayla kavurup karışıma katın.',
      'Yeşillikleri ekleyip şekil verin, marul yaprağında servis edin.',
    ],
  },
  {
    id: 'r15',
    title: 'Sebze Çorbası',
    image:
      'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=70',
    kcal: 140,
    minutes: 25,
    protein: 5,
    carbs: 22,
    fat: 4,
    tags: ['Düşük Kalori', 'Akşam'],
    category: 'Düşük Kalori',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      'Havuç, kabak, patates, kereviz',
      '1 soğan, 1 diş sarımsak',
      '1 yemek kaşığı zeytinyağı',
      'Sebze suyu, tuz, karabiber',
    ],
    steps: [
      'Soğan ve sarımsağı zeytinyağında soteleyin.',
      'Doğranmış sebzeleri ve suyu ekleyin.',
      'Sebzeler yumuşayınca blenderdan geçirip servis edin.',
    ],
  },
  {
    id: 'r16',
    title: 'Zeytinyağlı Enginar',
    image:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70',
    kcal: 150,
    minutes: 35,
    protein: 4,
    carbs: 18,
    fat: 8,
    tags: ['Düşük Kalori', 'Vegan'],
    category: 'Düşük Kalori',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '2 enginar çanağı',
      '1 havuç, 1/2 su bardağı bezelye',
      '1 küçük patates',
      'Zeytinyağı, limon, dereotu',
    ],
    steps: [
      'Sebzeleri küp doğrayıp enginarların içine paylaştırın.',
      'Zeytinyağı, limon ve az suyla kısık ateşte pişirin.',
      'Dereotu serperek soğuk servis edin.',
    ],
  },
  {
    id: 'r17',
    title: 'Çıtır Nohutlu Yeşil Salata',
    image:
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=70',
    kcal: 240,
    minutes: 20,
    protein: 10,
    carbs: 30,
    fat: 9,
    tags: ['Düşük Kalori', 'Vegan'],
    category: 'Düşük Kalori',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1 su bardağı haşlanmış nohut',
      'Toz kırmızı biber, kimyon',
      'Roka, marul, salatalık',
      'Limon-zeytinyağı sos',
    ],
    steps: [
      'Nohudu baharatlayıp fırında 15 dk çıtırlaştırın.',
      'Yeşillikleri doğrayıp sosla harmanlayın.',
      'Üzerine çıtır nohutları serpip servis edin.',
    ],
  },
  {
    id: 'r18',
    title: 'Nohutlu Ispanak Yemeği',
    image:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=70',
    kcal: 280,
    minutes: 25,
    protein: 13,
    carbs: 36,
    fat: 10,
    tags: ['Vegan', 'Akşam'],
    category: 'Vegan',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '500 g ıspanak',
      '1 su bardağı haşlanmış nohut',
      '1 soğan, salça, zeytinyağı',
      'Pirinç (isteğe bağlı 2 yemek kaşığı)',
    ],
    steps: [
      'Soğanı zeytinyağında kavurup salçayı ekleyin.',
      'Ispanak ve nohudu ilave edin.',
      'Az su ekleyip 15 dk pişirin.',
    ],
  },
  {
    id: 'r19',
    title: 'Sebzeli Kinoa Pilavı',
    image:
      'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=70',
    kcal: 340,
    minutes: 25,
    protein: 12,
    carbs: 50,
    fat: 10,
    tags: ['Vegan', 'Öğle'],
    category: 'Vegan',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1 su bardağı kinoa',
      'Kabak, havuç, kırmızı biber',
      '1 soğan, zeytinyağı',
      'Tuz, karabiber, kekik',
    ],
    steps: [
      'Kinoayı yıkayıp 2 kat suyla haşlayın.',
      'Sebzeleri küçük doğrayıp soteleyin.',
      'Kinoayla karıştırıp baharatlayarak servis edin.',
    ],
  },
  {
    id: 'r20',
    title: 'Tatlı Patates & Fasulye Bowl',
    image:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=70',
    kcal: 390,
    minutes: 35,
    protein: 14,
    carbs: 62,
    fat: 11,
    tags: ['Vegan', 'Akşam'],
    category: 'Vegan',
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1 orta boy tatlı patates',
      '1 su bardağı haşlanmış barbunya',
      'Avokado, mısır, kırmızı lahana',
      'Limonlu tahin sos',
    ],
    steps: [
      'Tatlı patatesi küp doğrayıp fırında 25 dk pişirin.',
      'Tüm malzemeyi kasede gruplar halinde dizin.',
      'Tahin sosu gezdirerek servis edin.',
    ],
  },
  {
    id: 'r21',
    title: 'Fıstık Ezmeli Elma Dilimleri',
    image:
      'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=70',
    kcal: 180,
    minutes: 5,
    protein: 5,
    carbs: 22,
    fat: 9,
    tags: ['Atıştırmalık', 'Hızlı'],
    category: 'Atıştırmalık',
    allergens: ['nuts'],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '1 elma',
      '1 yemek kaşığı şekersiz fıstık ezmesi',
      'Tarçın, chia tohumu (isteğe bağlı)',
    ],
    steps: [
      'Elmayı dilimleyin.',
      'Fıstık ezmesi sürüp tarçın serperek tüketin.',
    ],
  },
  {
    id: 'r22',
    title: 'Haşlanmış Yumurta & Havuç Çubukları',
    image:
      'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=800&q=70',
    kcal: 140,
    minutes: 12,
    protein: 10,
    carbs: 8,
    fat: 8,
    tags: ['Atıştırmalık', 'Yüksek Protein'],
    category: 'Atıştırmalık',
    allergens: ['egg'],
    suitableDiets: ['omnivore', 'vegetarian'],
    ingredients: ['2 yumurta', '1 havuç', 'Tuz, karabiber'],
    steps: [
      'Yumurtaları 8-10 dk haşlayın.',
      'Havucu çubuk doğrayın.',
      'Baharatlayıp birlikte tüketin.',
    ],
  },
  {
    id: 'r23',
    title: 'Kefirli Chia Puding',
    image:
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=70',
    kcal: 210,
    minutes: 5,
    protein: 11,
    carbs: 20,
    fat: 10,
    tags: ['Atıştırmalık', 'Tatlı'],
    category: 'Atıştırmalık',
    allergens: ['lactose'],
    suitableDiets: ['omnivore', 'vegetarian', 'pescatarian'],
    ingredients: [
      '1 su bardağı kefir',
      '2 yemek kaşığı chia tohumu',
      '1 çay kaşığı bal',
      'Üzeri için meyve',
    ],
    steps: [
      'Kefir, chia ve balı karıştırın.',
      'Buzdolabında en az 2 saat bekletin.',
      'Meyvelerle süsleyip servis edin.',
    ],
  },
  {
    id: 'r24',
    title: 'Hurmalı Enerji Topları',
    image:
      'https://images.unsplash.com/photo-1455853828816-0c301a011711?auto=format&fit=crop&w=800&q=70',
    kcal: 190,
    minutes: 15,
    protein: 5,
    carbs: 26,
    fat: 8,
    tags: ['Atıştırmalık', 'Vegan'],
    category: 'Atıştırmalık',
    allergens: ['nuts', 'gluten'],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: [
      '8 hurma (çekirdeksiz)',
      '1 su bardağı yulaf',
      '2 yemek kaşığı ceviz',
      '1 yemek kaşığı kakao',
    ],
    steps: [
      'Tüm malzemeyi mutfak robotunda çekin.',
      'Karışımdan ceviz büyüklüğünde toplar yuvarlayın.',
      'Buzdolabında 30 dk dinlendirip tüketin.',
    ],
  },
];

/** Günün öne çıkan tarifi (Keşfet üst kart). */
export const featuredRecipe = recipes[1];

/** Kullanıcının günlük beslenme hedefi ve şu ana kadarki tüketimi. */
export const dailyNutrition = {
  calorieGoal: 2100,
  caloriesConsumed: 1280,
  protein: { current: 86, goal: 140 },
  carbs: { current: 130, goal: 230 },
  fat: { current: 42, goal: 70 },
  water: { current: 5, goal: 8 }, // bardak
};

export type LoggedMeal = {
  id: string;
  name: string;
  kcal: number;
  portion: string;
};

export type MealSection = {
  id: string;
  title: string;
  icon: string; // Ionicons adı
  items: LoggedMeal[];
};

export const mealSections: MealSection[] = [
  {
    id: 'breakfast',
    title: 'Kahvaltı',
    icon: 'sunny-outline',
    items: [
      { id: 'm1', name: 'Avokadolu tost', kcal: 320, portion: '1 dilim' },
      { id: 'm2', name: 'Yeşil çay', kcal: 0, portion: '1 fincan' },
    ],
  },
  {
    id: 'lunch',
    title: 'Öğle',
    icon: 'partly-sunny-outline',
    items: [{ id: 'm3', name: 'Tavuklu kinoa bowl', kcal: 450, portion: '1 kase' }],
  },
  {
    id: 'dinner',
    title: 'Akşam',
    icon: 'moon-outline',
    items: [],
  },
  {
    id: 'snack',
    title: 'Atıştırmalık',
    icon: 'nutrition-outline',
    items: [{ id: 'm4', name: 'Badem', kcal: 160, portion: '1 avuç' }],
  },
];

export const userProfile = {
  name: 'Veysi',
  goal: 'Kilo verme',
  weight: 78,
  targetWeight: 72,
  height: 178,
  streak: 12, // kaç gündür düzenli takip
};

/** Profil ekranı — toplam aktivite özeti. */
export const activityStats = {
  workouts: 142, // toplam antrenman
  workoutsThisWeek: 5, // bu hafta tamamlanan
  totalHours: 86, // toplam aktif saat
  caloriesBurned: 45000, // toplam yakılan kalori
};

export type DailyActivity = {
  /** Kısa gün etiketi (Pzt, Sal, ...). */
  day: string;
  /** O günkü aktif dakika. */
  minutes: number;
};

/** Son 7 günlük aktivite — haftalık ilerleme grafiği için. */
export const weeklyActivity: DailyActivity[] = [
  { day: 'Pzt', minutes: 35 },
  { day: 'Sal', minutes: 50 },
  { day: 'Çar', minutes: 28 },
  { day: 'Per', minutes: 65 },
  { day: 'Cum', minutes: 45 },
  { day: 'Cts', minutes: 72 },
  { day: 'Paz', minutes: 40 },
];
