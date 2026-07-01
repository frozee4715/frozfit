/**
 * Takip geçmişi — `users/{uid}/days` koleksiyonundaki tüm günleri okur,
 * günlük totalleri çıkarır ve gerçek "seri" (streak) hesaplar.
 */
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { computeTotals, dateKey, type DailyTotals, type LoggedMeal } from '@/lib/daily-log';
import { db } from '@/lib/firebase';

export type HistoryDay = {
  date: string; // YYYY-MM-DD
  totals: DailyTotals;
  mealCount: number;
  water: number;
};

/** Loglu günlerden (en az 1 öğün) bugünden geriye doğru ardışık seri sayısı. */
function computeStreak(loggedDates: Set<string>): number {
  let streak = 0;
  const d = new Date();
  // Bugün henüz loglanmadıysa seriyi dünden başlat (gün dolmadan kırılmasın).
  if (!loggedDates.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (loggedDates.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export type UseTrackingHistoryResult = {
  days: HistoryDay[]; // tarihe göre azalan (en yeni önce)
  streak: number;
  loading: boolean;
};

export function useTrackingHistory(): UseTrackingHistoryResult {
  const { user } = useAuth();
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState<boolean>(Boolean(db && user));

  useEffect(() => {
    if (!db || !user) {
      setDays([]);
      setStreak(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'days'),
      (snap) => {
        const list: HistoryDay[] = snap.docs.map((doc) => {
          const data = doc.data();
          const meals = Array.isArray(data.meals) ? (data.meals as LoggedMeal[]) : [];
          return {
            date: String(doc.id),
            totals: computeTotals(meals),
            mealCount: meals.length,
            water: Number(data.water ?? 0),
          };
        });
        list.sort((a, b) => b.date.localeCompare(a.date));
        const loggedDates = new Set(list.filter((d) => d.mealCount > 0).map((d) => d.date));
        setDays(list);
        setStreak(computeStreak(loggedDates));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  return { days, streak, loading };
}
