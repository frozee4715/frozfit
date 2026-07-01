/**
 * Kilo takibi — Firestore'da `users/{uid}/weights/{YYYY-MM-DD}` dökümanlarında saklanır.
 * Her gün için tek kayıt (aynı güne tekrar girilirse üzerine yazar).
 */
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { dateKey } from '@/lib/daily-log';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';

export type WeightEntry = {
  date: string; // YYYY-MM-DD
  weight: number; // kg
};

export type UseWeightLogResult = {
  entries: WeightEntry[]; // tarihe göre artan sıralı
  latest: WeightEntry | null;
  loading: boolean;
};

/** Kullanıcının kilo kayıtlarını canlı dinler (tarihe göre artan). */
export function useWeightLog(): UseWeightLogResult {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(db && user));

  useEffect(() => {
    if (!db || !user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'weights'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ date: String(d.id), weight: Number(d.data().weight ?? 0) }))
          .filter((e) => e.weight > 0)
          .sort((a, b) => a.date.localeCompare(b.date));
        setEntries(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  return { entries, latest: entries.length ? entries[entries.length - 1] : null, loading };
}

/** Belirli güne kilo kaydı yazar (varsayılan bugün). */
export async function logWeight(
  uid: string,
  weight: number,
  date: string = dateKey(),
): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  await setDoc(
    doc(db, 'users', uid, 'weights', date),
    { weight, date, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
