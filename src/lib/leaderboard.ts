/**
 * Liderlik tablosu — herkese açık `leaderboard` koleksiyonu.
 *
 * Güvenlik modeli: her kullanıcı YALNIZCA kendi skor dökümanını (`leaderboard/{uid}`)
 * yazabilir; giriş yapan herkes tüm tabloyu OKUyabilir. Böylece kullanıcıların özel
 * verisi (`users/{uid}`) gizli kalır; sadece buraya yazılan özet skor paylaşılır.
 *
 * Gerekli Firestore kuralı:
 *   match /leaderboard/{uid} {
 *     allow read: if request.auth != null;
 *     allow write: if request.auth != null && request.auth.uid == uid;
 *   }
 */
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/lib/firebase';

const LEADERBOARD = 'leaderboard';

export type LeaderboardEntry = {
  uid: string;
  name: string;
  points: number;
  streak: number;
  weeklyWorkouts: number;
};

/** Skoru bileşenlerden hesaplar (tek bir yerde tutulur ki tablo tutarlı olsun). */
export function computePoints(input: { streak: number; weekLoggedDays: number; weeklyWorkouts: number }): number {
  return input.streak * 10 + input.weekLoggedDays * 5 + input.weeklyWorkouts * 15;
}

function toEntry(uid: string, data: Record<string, any>): LeaderboardEntry {
  return {
    uid,
    name: String(data.name ?? 'FrozFit kullanıcısı'),
    points: Number(data.points ?? 0),
    streak: Number(data.streak ?? 0),
    weeklyWorkouts: Number(data.weeklyWorkouts ?? 0),
  };
}

export type UseLeaderboardResult = {
  entries: LeaderboardEntry[];
  loading: boolean;
};

/** En yüksek puanlı ilk `top` kullanıcıyı canlı dinler. */
export function useLeaderboard(top = 50): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(db));

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, LEADERBOARD), orderBy('points', 'desc'), limit(top));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => toEntry(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [top]);

  return { entries, loading };
}

export type PublishInput = {
  name: string;
  streak: number;
  weekLoggedDays: number;
  weeklyWorkouts: number;
};

/** Kullanıcının kendi skor dökümanını günceller (yalnızca kendi uid'sine yazabilir). */
export async function publishLeaderboardEntry(uid: string, input: PublishInput): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, LEADERBOARD, uid),
    {
      name: input.name,
      streak: input.streak,
      weeklyWorkouts: input.weeklyWorkouts,
      points: computePoints(input),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ).catch(() => {});
}
