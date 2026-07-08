/**
 * Hesap silme öncesi Firestore'daki kullanıcı verilerini temizler.
 *
 * Silinenler:
 *  - users/{uid} belgesi + bilinen alt koleksiyonları (days, workouts, weights)
 *  - leaderboard/{uid}
 *  - kullanıcının oluşturduğu recipes / community_recipes / reviews belgeleri
 *
 * En iyi çaba (best-effort) çalışır: tek tek hatalar tüm süreci durdurmaz;
 * kurallar gereği silinemeyen bir şey kalırsa bile Auth hesabı silinince
 * verilere erişim tamamen kapanır.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

const USER_SUBCOLLECTIONS = ['days', 'workouts', 'weights'] as const;
const OWNED_COLLECTIONS = ['recipes', 'community_recipes', 'reviews'] as const;

/** Bir koleksiyondaki belgeleri parti parti siler. */
async function deleteInBatches(getBatchDocs: () => Promise<{ ref: any }[]>): Promise<void> {
  if (!db) return;
  // Sonsuz döngüye karşı üst sınır (400 x 100 = 40k belge fazlasıyla yeter).
  for (let round = 0; round < 400; round++) {
    const docs = await getBatchDocs();
    if (docs.length === 0) return;
    const batch = writeBatch(db);
    docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (docs.length < 100) return;
  }
}

export async function deleteAllUserData(uid: string): Promise<void> {
  if (!db) return;
  const database = db;

  // Alt koleksiyonlar (users/{uid}/days vb.)
  for (const sub of USER_SUBCOLLECTIONS) {
    try {
      await deleteInBatches(async () => {
        const snap = await getDocs(query(collection(database, 'users', uid, sub), limit(100)));
        return snap.docs;
      });
    } catch {
      // en iyi çaba — devam et
    }
  }

  // Kullanıcının sahibi olduğu üst düzey belgeler
  for (const col of OWNED_COLLECTIONS) {
    try {
      await deleteInBatches(async () => {
        const snap = await getDocs(query(collection(database, col), where('uid', '==', uid), limit(100)));
        return snap.docs;
      });
    } catch {
      // en iyi çaba — devam et
    }
  }

  // Liderlik tablosu kaydı + ana profil belgesi
  try {
    await deleteDoc(doc(database, 'leaderboard', uid));
  } catch {
    /* yoksay */
  }
  try {
    await deleteDoc(doc(database, 'users', uid));
  } catch {
    /* yoksay */
  }
}
