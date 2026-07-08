/**
 * FrozFit — App Store Review için ÖNCEDEN DOĞRULANMIŞ demo hesabı oluşturur.
 *
 * Neden gerekli: Uygulama e-posta/şifre ile kayıtta e-posta doğrulama zorunlu
 * kılıyor. App Store reviewer'ı doğrulama e-postasını alamaz; bu yüzden hesabı
 * `emailVerified: true` olarak Admin SDK ile oluşturuyoruz. Reviewer doğrudan
 * giriş yapar, duvara takılmaz.
 *
 * KULLANIM (frozfit/ klasöründe):
 *   node scripts/create-review-account.js
 *   # İsteğe bağlı özel bilgi:
 *   REVIEW_EMAIL=review@frozfit.app REVIEW_PASSWORD='Guclu!Parola1' node scripts/create-review-account.js
 *
 * Çıktıdaki e-posta + şifreyi App Store Connect → App Review Information →
 * Sign-In Required bölümüne gir.
 *
 * NOT: serviceAccountKey.json gerekir (bkz. reset-all-data.js kurulum notu).
 */

'use strict';

const path = require('path');

const EMAIL = process.env.REVIEW_EMAIL || 'review@frozfit.app';
const PASSWORD = process.env.REVIEW_PASSWORD || 'FrozFit!Review2026';
const DISPLAY_NAME = 'App Review';

let initializeApp, cert, getAuth;
try {
  ({ initializeApp, cert } = require('firebase-admin/app'));
  ({ getAuth } = require('firebase-admin/auth'));
} catch {
  console.error('\n❌ firebase-admin kurulu değil. Önce:  npm i firebase-admin\n');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
} catch {
  console.error(
    '\n❌ serviceAccountKey.json bulunamadı (scripts/ klasörüne koy).\n',
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    // Zaten varsa: şifreyi güncelle + doğrulanmış yap.
    user = await auth.updateUser(user.uid, {
      password: PASSWORD,
      emailVerified: true,
      displayName: DISPLAY_NAME,
      disabled: false,
    });
    console.log('ℹ️  Mevcut hesap güncellendi.');
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') {
      user = await auth.createUser({
        email: EMAIL,
        password: PASSWORD,
        emailVerified: true,
        displayName: DISPLAY_NAME,
      });
      console.log('✅ Yeni demo hesabı oluşturuldu.');
    } else {
      throw e;
    }
  }

  console.log('\n──────────────────────────────────────────────');
  console.log('  App Store Connect → App Review Information');
  console.log('──────────────────────────────────────────────');
  console.log('  E-posta : ' + EMAIL);
  console.log('  Şifre   : ' + PASSWORD);
  console.log('  UID     : ' + user.uid);
  console.log('  Doğrulanmış: ' + user.emailVerified);
  console.log('──────────────────────────────────────────────\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Hata:', err.message || err);
  process.exit(1);
});
