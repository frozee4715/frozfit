/**
 * Egzersiz gösterim kütüphanesi — "Egzersizler" sekmesi.
 *
 * Görseller TELİFSİZ "Free Exercise DB" (yuhonas/free-exercise-db, Unlicense / kamu malı)
 * kaynağından gelir; jsDelivr CDN üzerinden servis edilir. Her hareketin 0 (başlangıç) ve
 * 1 (bitiş) olmak üzere iki karesi vardır; bunları sırayla göstererek hareket animasyonu
 * (video benzeri) elde edilir. `tip` metinleri bize aittir (Türkçe, telif yok).
 *
 * Tüm `dbId` değerleri veri setinde DOĞRULANMIŞTIR (CDN 200).
 */

/** Free Exercise DB görsellerinin CDN kökü. */
export const EXDB_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

/** Bir hareketin kare (frame) görsel URL'i. 0 = başlangıç, 1 = bitiş pozisyonu. */
export function frameUrl(dbId: string, frame: 0 | 1): string {
  return `${EXDB_BASE}/${dbId}/${frame}.jpg`;
}

export type ExerciseMove = {
  id: string;
  name: string;
  /** Free Exercise DB klasör/ID adı (görseller buradan gelir). */
  dbId: string;
  /** Çalışan bölge / kısa açıklama. */
  target: string;
  /** Süre veya set/tekrar (örn. "45 sn", "3×12"). */
  amount: string;
  /** Kısa Türkçe yapılış ipucu (kendi metnimiz). */
  tip: string;
};

export type ExerciseGroup = {
  id: string;
  title: string;
  icon: string;
  color: 'primary' | 'accent' | 'protein' | 'carbs' | 'fat';
  moves: ExerciseMove[];
};

export const EXERCISE_GROUPS: ExerciseGroup[] = [
  {
    id: 'fullbody',
    title: 'Tüm vücut',
    icon: 'body-outline',
    color: 'primary',
    moves: [
      { id: 'star-jump', name: 'Yıldız Sıçrama', dbId: 'Star_Jump', target: 'Isınma · tüm vücut', amount: '45 sn', tip: 'Çömelip yıldız gibi açılarak zıpla; yumuşak iniş yap.' },
      { id: 'mountain-climber', name: 'Dağcı', dbId: 'Mountain_Climbers', target: 'Karın · kardiyo', amount: '40 sn', tip: 'Şınav pozisyonunda dizleri sırayla göğse çek; kalça sabit.' },
      { id: 'jump-squat', name: 'Sıçrayarak Squat', dbId: 'Freehand_Jump_Squat', target: 'Bacak · patlayıcı güç', amount: '3×12', tip: 'Squat’a in, yukarı patlayarak zıpla, dizleri bükerek in.' },
      { id: 'plyo-pushup', name: 'Patlayıcı Şınav', dbId: 'Plyo_Push-up', target: 'Göğüs · güç', amount: '3×8', tip: 'Şınavın altından yukarı iterek elleri yerden kaldır.' },
    ],
  },
  {
    id: 'abs',
    title: 'Karın',
    icon: 'fitness-outline',
    color: 'accent',
    moves: [
      { id: 'crunch', name: 'Mekik', dbId: 'Crunches', target: 'Üst karın', amount: '3×15', tip: 'Beli yere yapıştır; sadece omuzları kaldır, boynu zorlama.' },
      { id: 'plank', name: 'Plank', dbId: 'Plank', target: 'Tüm core', amount: '45 sn', tip: 'Vücut düz bir çizgi; kalçayı ne düşür ne kaldır.' },
      { id: 'reverse-crunch', name: 'Ters Mekik', dbId: 'Reverse_Crunch', target: 'Alt karın', amount: '3×12', tip: 'Dizleri göğse çekerek kalçayı hafifçe yerden kaldır.' },
      { id: 'russian-twist', name: 'Rus Twisti', dbId: 'Russian_Twist', target: 'Yan karın (oblik)', amount: '3×20', tip: 'Geriye hafif yaslan, gövdeyi iki yana döndür.' },
      { id: 'cross-crunch', name: 'Çapraz Mekik', dbId: 'Cross-Body_Crunch', target: 'Karın · oblik', amount: '40 sn', tip: 'Dirseği karşı dize değdir; bisiklet sürer gibi.' },
      { id: 'side-plank', name: 'Yan Plank', dbId: 'Side_Bridge', target: 'Yan karın', amount: '30 sn', tip: 'Dirsek omuz altında; vücut düz, kalça yukarıda.' },
    ],
  },
  {
    id: 'legs',
    title: 'Bacak & Kalça',
    icon: 'walk-outline',
    color: 'protein',
    moves: [
      { id: 'squat', name: 'Squat', dbId: 'Bodyweight_Squat', target: 'Bacak · kalça', amount: '3×15', tip: 'Topuklar yerde, dizler parmak ucunu geçmesin, sırt dik.' },
      { id: 'lunge', name: 'Yürüyen Lunge', dbId: 'Bodyweight_Walking_Lunge', target: 'Bacak · denge', amount: '3×12', tip: 'Öne adım at, arka diz yere yaklaşsın, gövde dik.' },
      { id: 'glute-bridge', name: 'Kalça Köprüsü', dbId: 'Butt_Lift_Bridge', target: 'Kalça · hamstring', amount: '3×15', tip: 'Sırt üstü yat, kalçayı sıkarak yukarı kaldır.' },
      { id: 'single-glute-bridge', name: 'Tek Bacak Köprü', dbId: 'Single_Leg_Glute_Bridge', target: 'Kalça', amount: '3×10', tip: 'Bir bacak havada; kalçayı sıkarak köprü yap.' },
      { id: 'glute-kickback', name: 'Kalça Tekmesi', dbId: 'Glute_Kickback', target: 'Kalça', amount: '3×15', tip: 'Dört ayak üstünde bir bacağı geriye-yukarı uzat.' },
      { id: 'split-squat', name: 'Bölünmüş Squat', dbId: 'Split_Squats', target: 'Bacak · denge', amount: '3×12', tip: 'Bir ayak önde sabit; dikine in-çık.' },
    ],
  },
  {
    id: 'upper',
    title: 'Üst vücut',
    icon: 'barbell-outline',
    color: 'carbs',
    moves: [
      { id: 'pushup', name: 'Şınav', dbId: 'Pushups', target: 'Göğüs · kol', amount: '3×12', tip: 'Vücut düz; göğsü yere yaklaştır, dirsekler ~45°.' },
      { id: 'incline-pushup', name: 'Eğik Şınav (kolay)', dbId: 'Incline_Push-Up', target: 'Göğüs', amount: '3×12', tip: 'Elleri yüksek bir yere koy; yeni başlayanlar için ideal.' },
      { id: 'decline-pushup', name: 'Eğik Şınav (omuz)', dbId: 'Decline_Push-Up', target: 'Omuz · üst göğüs', amount: '3×10', tip: 'Ayakları yüksekte tut; omuza yüklenir.' },
      { id: 'bench-dips', name: 'Bench Dips', dbId: 'Bench_Dips', target: 'Arka kol (triceps)', amount: '3×12', tip: 'Sandalye kenarına tutun; dirsekleri bükerek in-çık.' },
      { id: 'pushup-sideplank', name: 'Şınav + Yan Plank', dbId: 'Push_Up_to_Side_Plank', target: 'Göğüs · core', amount: '3×8', tip: 'Şınav yap, sonra bir kolu açıp yan plank’a dön.' },
      { id: 'superman', name: 'Superman', dbId: 'Superman', target: 'Sırt · bel', amount: '3×15', tip: 'Yüzükoyun yat; kol ve bacakları aynı anda kaldır.' },
    ],
  },
  {
    id: 'cardio',
    title: 'Kardiyo',
    icon: 'flash-outline',
    color: 'fat',
    moves: [
      { id: 'knee-tuck-jump', name: 'Diz Çekme Sıçrama', dbId: 'Knee_Tuck_Jump', target: 'Kardiyo · bacak', amount: '40 sn', tip: 'Zıpla ve dizleri göğse çek; yumuşak in.' },
      { id: 'scissors-jump', name: 'Makas Sıçrama', dbId: 'Scissors_Jump', target: 'Kardiyo · bacak', amount: '40 sn', tip: 'Lunge pozisyonunda zıplayıp ayak değiştir.' },
      { id: 'split-jump', name: 'Sıçrayan Lunge', dbId: 'Split_Jump', target: 'Kardiyo · güç', amount: '3×12', tip: 'Lunge’dan zıplayarak bacak değiştir.' },
      { id: 'rocket-jump', name: 'Roket Sıçrama', dbId: 'Rocket_Jump', target: 'Kardiyo · patlayıcı', amount: '3×10', tip: 'Çömel, kolları yukarı uzatarak dikine zıpla.' },
    ],
  },
  {
    id: 'stretch',
    title: 'Esneme & Mobilite',
    icon: 'leaf-outline',
    color: 'primary',
    moves: [
      { id: 'cat-cow', name: 'Kedi-Deve', dbId: 'Cat_Stretch', target: 'Omurga mobilitesi', amount: '60 sn', tip: 'Dört ayak üstünde sırtı yukarı-aşağı yuvarla.' },
      { id: 'child-pose', name: 'Çocuk Pozu', dbId: 'Childs_Pose', target: 'Sırt · rahatlama', amount: '60 sn', tip: 'Dizler açık, kalçayı topuklara götür, kollar ileride.' },
      { id: 'hamstring-stretch', name: 'Arka Bacak Esnemesi', dbId: 'Hamstring_Stretch', target: 'Hamstring', amount: '45 sn', tip: 'Bir bacağı uzat, gövdeyi öne eğ; nazikçe.' },
      { id: 'quad-stretch', name: 'Ön Bacak Esnemesi', dbId: 'Quad_Stretch', target: 'Quadriceps', amount: '45 sn', tip: 'Ayak bileğini tutup topuğu kalçaya çek; dengeni koru.' },
      { id: 'shoulder-stretch', name: 'Omuz Esnemesi', dbId: 'Shoulder_Stretch', target: 'Omuz', amount: '30 sn', tip: 'Bir kolu göğüs önünde çapraz tut, diğer kolla bastır.' },
      { id: 'spinal-stretch', name: 'Omurga Esnemesi', dbId: 'Spinal_Stretch', target: 'Sırt · bel', amount: '45 sn', tip: 'Sırt üstü yat, dizleri bir yana indir, omuzlar yerde.' },
    ],
  },
];

/** Tüm hareketlerin düz listesi. */
export const ALL_MOVES: ExerciseMove[] = EXERCISE_GROUPS.flatMap((g) => g.moves);

/**
 * Günün antrenmanı — haftanın gününe göre dönen bir grup + ısınma (yıldız sıçrama)
 * ve esneme (çocuk pozu). Her gün farklı bir set gelir.
 */
export function dailyWorkout(date: Date = new Date()): { groupTitle: string; moves: ExerciseMove[] } {
  const rotation = EXERCISE_GROUPS.filter((g) => g.id !== 'stretch');
  const group = rotation[date.getDay() % rotation.length];
  const warmup = ALL_MOVES.find((m) => m.id === 'star-jump');
  const cooldown = ALL_MOVES.find((m) => m.id === 'child-pose');
  const moves = [
    ...(warmup ? [warmup] : []),
    ...group.moves.filter((m) => m.id !== 'star-jump').slice(0, 4),
    ...(cooldown ? [cooldown] : []),
  ];
  return { groupTitle: group.title, moves };
}
