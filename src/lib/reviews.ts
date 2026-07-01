/**
 * Tarif değerlendirmeleri (yorum + puan) — `reviews` koleksiyonunda saklanır.
 * Döküman id'si `${recipeId}__${uid}` → her kullanıcı bir tarife TEK değerlendirme
 * yapar, tekrar gönderince kendi değerlendirmesini günceller.
 *
 * Sorgu yalnızca `recipeId` eşitliğiyle yapılır (composite index gerekmez);
 * sıralama istemci tarafında.
 */
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '@/lib/firebase';

export type Review = {
  id: string;
  recipeId: string;
  uid: string;
  authorName: string;
  rating: number; // 1-5
  text: string;
  createdAtMs: number;
};

export type UseReviewsResult = {
  reviews: Review[]; // en yeni önce
  average: number; // 0 ise henüz puan yok
  count: number;
  loading: boolean;
};

export function useReviews(recipeId: string | undefined): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(db && recipeId));

  useEffect(() => {
    if (!db || !recipeId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'reviews'), where('recipeId', '==', recipeId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Review[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            recipeId: String(data.recipeId ?? ''),
            uid: String(data.uid ?? ''),
            authorName: String(data.authorName ?? 'Kullanıcı'),
            rating: Number(data.rating ?? 0),
            text: String(data.text ?? ''),
            createdAtMs: data.createdAt?.toMillis?.() ?? 0,
          };
        });
        list.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setReviews(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [recipeId]);

  const { average, count } = useMemo(() => {
    if (reviews.length === 0) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
  }, [reviews]);

  return { reviews, average, count, loading };
}

/** Kullanıcının bir tarife değerlendirmesini ekler/günceller. */
export async function submitReview(
  recipeId: string,
  uid: string,
  authorName: string,
  rating: number,
  text: string,
): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  await setDoc(
    doc(db, 'reviews', `${recipeId}__${uid}`),
    {
      recipeId,
      uid,
      authorName,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      text: text.trim(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
