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
      'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?auto=format&fit=crop&w=800&q=70',
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

/** AI Şef ekranında "dolaptan tarif" örnek sonucu. */
export const aiSuggestedRecipes: Recipe[] = [recipes[2], recipes[5]];

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
