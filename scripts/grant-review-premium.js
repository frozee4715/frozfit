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

async function main() {
  const user = await auth.getUserByEmail(EMAIL);

  // merge:true → onboarding'den gelen profil alanlarını (boy, kilo, hedef) ezme.
  await db.doc(`users/${user.uid}`).set(
    {
      isPremium: true,
      aiCredits: 500, // isPremium zaten krediyi baypas eder; bu yalnızca emniyet payı
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
