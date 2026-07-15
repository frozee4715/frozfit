/**
 * FrozFit — inceleme (review) hesabına Premium verir.
 *
 * NEDEN GEREKLİ:
 * Ücretsiz kullanıcı 5 AI kredisiyle başlar (bkz. src/lib/ai-credits.tsx).
 * Google Play / App Store incelemecisi AI Şef + buzdolabı tarama + AI Koç +
 * öğün planını denerken bu kredi biter ve "Pro'ya geç" duvarına takılır —
 * yani uygulamanın bir bölümünü inceleyemez ve reddedebilir.
 *
 * NASIL ÇALIŞIR:
 * `usePremium` iki kaynağı OR'lar: RevenueCat entitlement VEYA Firestore'daki
 * `users/{uid}.isPremium` (bkz. src/lib/premium.tsx). İstemci bu alanı yazamaz
 * (Firestore kuralı), ama Admin SDK yazabilir. Sahte satın alma gerekmez.
 *
 * KULLANIM (frozfit/ klasöründe):
 *   node scripts/create-review-account.js   # önce hesabı oluştur
 *   node scripts/grant-review-premium.js    # sonra premium ver
 *
 * NOT: scripts/serviceAccountKey.json gerekir (gizli — git'e KOYMA).
 */

'use strict';

const path = require('path');

const EMAIL = process.env.REVIEW_EMAIL || 'review@frozfit.app';

let initializeApp, cert, getAuth, getFirestore;
try {
  ({ initializeApp, cert } = require('firebase-admin/app'));
  ({ getAuth } = require('firebase-admin/auth'));
  ({ getFirestore } = require('firebase-admin/firestore'));
} catch {
  console.error('\n❌ firebase-admin kurulu değil. Önce:  npm i firebase-admin\n');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
} catch {
  console.error('\n❌ scripts/serviceAccountKey.json bulunamadı.\n');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

// İnceleme hesabı onboarding'i atladığı için Firestore'da plan/tercih alanları
// olmayabilir. Bunlar olmadan tab ekranları (Profil, Takip, Şef...) çöker
// (profile.plan.calorieGoal undefined). Bu yüzden tam ve tutarlı bir profil yazıyoruz.
// Değerler makul bir örnek kullanıcıdır; App Store incelemecisi dolu bir ekran görür.
const REVIEW_PROFILE = {
  name: 'App Review',
  gender: 'male',
  age: 30,
  height: 178,
  weight: 78,
  targetWeight: 74,
  goal: 'lose',
  activity: 'moderate',
  diet: 'omnivore',
  allergies: [],
  mealsPerDay: 3,
  cookingTime: 'medium',
  dislikes: [],
  // computePlan(gender=male,age=30,h=178,w=78,goal=lose,activity=moderate) çıktısıyla uyumlu.
  plan: {
    calorieGoal: 2209,
    protein: 140,
    carbs: 275,
    fat: 61,
    waterGoal: 11,
    bmi: 24.6,
  },
  onboardedAt: Date.now(),
};

async function main() {
  const user = await auth.getUserByEmail(EMAIL);

  // merge:true → yalnızca eksik alanları tamamlar. Zaten onboarding yapılmışsa
  // gerçek değerleri korumak istersen bu betiği çalıştırmadan önce hesabı sıfırlama.
  await db.doc(`users/${user.uid}`).set(
    {
      isPremium: true,
      aiCredits: 500, // isPremium zaten krediyi baypas eder; bu yalnızca emniyet payı
      ...REVIEW_PROFILE,
    },
    { merge: true },
  );

  const snap = await db.doc(`users/${user.uid}`).get();
  const data = snap.data() || {};

  console.log('\n──────────────────────────────────────────────');
  console.log('  İnceleme hesabı — Premium verildi');
  console.log('──────────────────────────────────────────────');
  console.log('  E-posta   : ' + EMAIL);
  console.log('  UID       : ' + user.uid);
  console.log('  isPremium : ' + data.isPremium);
  console.log('  aiCredits : ' + data.aiCredits);
  console.log('──────────────────────────────────────────────\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Hata:', err.message || err);
  process.exit(1);
});
