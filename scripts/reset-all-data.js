/**
 * FrozFit — TÜM kullanıcıları ve verileri sıfırlar (YAYIN ÖNCESİ temiz başlangıç).
 *
 * ⚠️  BU İŞLEM GERİ ALINAMAZ. Silinen hesaplar ve veriler kurtarılamaz.
 *
 * NE SİLER (aşağıdaki DELETE_* bayraklarına göre):
 *   - DELETE_AUTH_USERS: Firebase Authentication'daki TÜM hesaplar
 *   - DELETE_FIRESTORE : Aşağıdaki FIRESTORE_COLLECTIONS koleksiyonları (alt
 *                        koleksiyonlar dahil: users/{uid}/days, weights, workouts)
 *
 * KURULUM (bir kez):
 *   1) Firebase Console → ⚙ Proje ayarları → "Hizmet hesapları" (Service accounts)
 *      → "Yeni özel anahtar oluştur" → inen JSON'u bu klasöre
 *      "serviceAccountKey.json" adıyla kaydet.
 *   2) Terminalde (frozfit/ klasöründe):  npm i firebase-admin
 *
 * ÇALIŞTIRMA (silmeyi gerçekten yapmak için CONFIRM=RESET şart):
 *   # Önce KURU ÇALIŞMA (hiçbir şey silmez, sadece ne sileceğini gösterir):
 *   node scripts/reset-all-data.js
 *   # Gerçekten silmek için:
 *   CONFIRM=RESET node scripts/reset-all-data.js        (macOS/Linux)
 *   $env:CONFIRM="RESET"; node scripts/reset-all-data.js  (Windows PowerShell)
 *
 * NOT: serviceAccountKey.json GİZLİ bir dosyadır — asla commit etme, kimseyle
 * paylaşma. İşin bitince silebilirsin. (.gitignore'a eklemen önerilir.)
 */

'use strict';

const path = require('path');

// ── AYARLAR ──────────────────────────────────────────────────────────────────
const DELETE_AUTH_USERS = true; // Authentication hesaplarını sil
const DELETE_FIRESTORE = true;  // Firestore verilerini sil

// Silinecek Firestore koleksiyonları (alt koleksiyonlar otomatik dahil).
const FIRESTORE_COLLECTIONS = [
  'users',             // profiller + days/weights/workouts alt koleksiyonları
  'community_recipes', // topluluk tarifleri
  'leaderboard',       // liderlik tablosu
  'recipes',           // (varsa) seed tarifleri
];
// ─────────────────────────────────────────────────────────────────────────────

const CONFIRMED = process.env.CONFIRM === 'RESET';

// firebase-admin v14+ namespaced API'yi (admin.auth()) kaldırdı; modüler
// alt-yol importları kullanılır.
let initializeApp, cert, getAuth, getFirestore;
try {
  ({ initializeApp, cert } = require('firebase-admin/app'));
  ({ getAuth } = require('firebase-admin/auth'));
  ({ getFirestore } = require('firebase-admin/firestore'));
} catch {
  console.error('\n❌ firebase-admin kurulu değil. Önce çalıştır:  npm i firebase-admin\n');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
} catch {
  console.error(
    '\n❌ serviceAccountKey.json bulunamadı.\n' +
      '   Firebase Console → Proje ayarları → Hizmet hesapları → "Yeni özel anahtar oluştur"\n' +
      '   ile inen dosyayı scripts/ klasörüne serviceAccountKey.json adıyla koy.\n',
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

async function deleteAllAuthUsers() {
  let deleted = 0;
  let pageToken;
  do {
    const list = await auth.listUsers(1000, pageToken);
    pageToken = list.pageToken;
    const uids = list.users.map((u) => u.uid);
    if (uids.length === 0) break;
    if (CONFIRMED) {
      const res = await auth.deleteUsers(uids);
      deleted += res.successCount;
      if (res.failureCount > 0) {
        console.warn(`   ⚠ ${res.failureCount} hesap silinemedi.`);
      }
    } else {
      deleted += uids.length; // kuru çalışmada sadece say
    }
  } while (pageToken);
  return deleted;
}

async function deleteFirestore() {
  for (const name of FIRESTORE_COLLECTIONS) {
    const col = db.collection(name);
    if (CONFIRMED) {
      // recursiveDelete alt koleksiyonları da temizler (admin SDK v10+).
      await db.recursiveDelete(col);
      console.log(`   🗑  "${name}" koleksiyonu silindi (alt koleksiyonlar dahil).`);
    } else {
      const snap = await col.limit(1).get();
      console.log(`   • "${name}" koleksiyonu ${snap.empty ? 'boş görünüyor' : 'veri içeriyor'} → silinecek.`);
    }
  }
}

async function main() {
  console.log('\n=== FrozFit veri sıfırlama ===');
  console.log(`Proje: ${serviceAccount.project_id}`);
  console.log(`Mod  : ${CONFIRMED ? '⚠️  GERÇEK SİLME (CONFIRM=RESET)' : '🔍 KURU ÇALIŞMA (hiçbir şey silinmez)'}\n`);

  if (DELETE_AUTH_USERS) {
    console.log('▶ Authentication hesapları...');
    const n = await deleteAllAuthUsers();
    console.log(`  ${CONFIRMED ? '✅ Silindi' : 'Bulundu'}: ${n} hesap\n`);
  }

  if (DELETE_FIRESTORE) {
    console.log('▶ Firestore verileri...');
    await deleteFirestore();
    console.log('');
  }

  if (!CONFIRMED) {
    console.log('ℹ️  Bu bir KURU ÇALIŞMAYDI, hiçbir şey silinmedi.');
    console.log('    Gerçekten silmek için:  CONFIRM=RESET node scripts/reset-all-data.js');
    console.log('    (Windows PowerShell:    $env:CONFIRM="RESET"; node scripts/reset-all-data.js )\n');
  } else {
    console.log('✅ Sıfırlama tamamlandı. Temiz başlangıç hazır.\n');
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Hata:', e && e.message ? e.message : e);
  process.exit(1);
});
