/**
 * Davet sistemi — viral döngü.
 *
 * Model:
 *   users/{uid}.referralCode        → kullanıcının kendi kodu
 *   users/{uid}.referralCount       → kaç kişiyi getirdi (ödüllendirilen)
 *   referral_codes/{KOD}            → { uid }  (kod → sahibi; kod aramak için)
 *   referral_redemptions/{uid}      → { code, referrerUid }  (KULLANICI BAŞINA BİR KEZ)
 *
 * Güvenlik: ödül kredisini yalnızca sunucu verir (istemci Firestore kuralı gereği
 * krediyi artıramaz). Bozdurma kaydı ile kredi artışları AYNI atomik commit'te
 * yapılır ve kayıt "yalnızca yoksa oluştur" kısıtıyla yazılır → aynı kullanıcı
 * ikinci kez bozduramaz, yarış koşulunda bile.
 */
import { commit, getDoc, increment, setFields } from './firestore.js';

/** Her iki tarafa verilen kredi. */
export const REFERRAL_REWARD = 10;

/** Bir kullanıcı en fazla bu kadar davet için ödül alır (çiftlik kurmayı sınırlar). */
const MAX_REWARDED_INVITES = 20;

// Karıştırılabilir karakterler (0/O, 1/I) yok: kod elle yazılıp okunacak.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 6;

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LEN));
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/**
 * Kullanıcının davet kodunu döndürür; yoksa üretip kaydeder.
 * Kod çakışırsa (aynı kod başkasında) yeniden dener.
 */
export async function getOrCreateCode(env, uid) {
  const user = await getDoc(env, `users/${uid}`);
  if (user?.referralCode) {
    return { code: user.referralCode, count: user.referralCount || 0 };
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      await commit(env, [
        // Kod belgesi yalnızca YOKSA oluşturulur → çakışma atomik yakalanır.
        setFields(env, `referral_codes/${code}`, { uid }, true),
        setFields(env, `users/${uid}`, { referralCode: code }),
      ]);
      return { code, count: user?.referralCount || 0 };
    } catch (e) {
      if (!e.conflict) throw e;
      // kod tutulmuş → başka kod dene
    }
  }
  throw new Error('code_generation_failed');
}

/**
 * Bir davet kodunu bozdurur: hem daveti eden hem edilen kredi kazanır.
 * Tek atomik commit → iki kez bozdurma imkânsız.
 */
export async function claimCode(env, uid, rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    const err = new Error('Davet kodu boş olamaz.');
    err.status = 400;
    throw err;
  }

  const owner = await getDoc(env, `referral_codes/${code}`);
  if (!owner?.uid) {
    const err = new Error('Bu davet kodu geçersiz.');
    err.status = 404;
    throw err;
  }

  const referrerUid = owner.uid;
  if (referrerUid === uid) {
    const err = new Error('Kendi davet kodunu kullanamazsın.');
    err.status = 400;
    throw err;
  }

  // Daveti eden ödül tavanını doldurduysa yalnızca yeni kullanıcı ödüllendirilir.
  const referrer = await getDoc(env, `users/${referrerUid}`);
  const rewardReferrer = (referrer?.referralCount || 0) < MAX_REWARDED_INVITES;

  const writes = [
    // Bozdurma kaydı: yalnızca yoksa oluşturulur. Kullanıcı ömrü boyunca bir kez.
    setFields(env, `referral_redemptions/${uid}`, { code, referrerUid }, true),
    increment(env, `users/${uid}`, { aiCredits: REFERRAL_REWARD }),
  ];
  if (rewardReferrer) {
    writes.push(increment(env, `users/${referrerUid}`, { aiCredits: REFERRAL_REWARD, referralCount: 1 }));
  }

  try {
    await commit(env, writes);
  } catch (e) {
    if (e.conflict) {
      const err = new Error('Zaten bir davet kodu kullanmışsın.');
      err.status = 409;
      throw err;
    }
    throw e;
  }

  return { reward: REFERRAL_REWARD };
}
