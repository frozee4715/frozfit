/**
 * Günlük beslenme kaydı — Firestore'da `users/{uid}/days/{YYYY-MM-DD}` dökümanında saklanır.
 *
 * - `useDailyLog(dateKey)` : ilgili günün kaydını canlı dinler ve mutasyon fonksiyonları döndürür.
 * - Eklenen her öğün (kcal + makro) o günün totaline yansır; Takip ekranı bunu okur.
 * - Su sayacı da burada kalıcıdır.
 *
 * Firebase yapılandırılmamışsa (db yok) veya oturum yoksa kayıt yalnızca o oturum
 * boyunca bellekte tutulur (kalıcı değildir) — uygulama yine de çalışır.
 */
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: { value: MealType; title: string; icon: string }[] = [
  { value: 'breakfast', title: 'Kahvaltı', icon: 'sunny-outline' },
  { value: 'lunch', title: 'Öğle', icon: 'partly-sunny-outline' },
  { value: 'dinner', title: 'Akşam', icon: 'moon-outline' },
  { value: 'snack', title: 'Atıştırmalık', icon: 'nutrition-outline' },
];

export type LoggedMeal = {
  id: string;
  name: string;
  mealType: MealType;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  /** Tariften eklendiyse tarifin id'si. */
  recipeId?: string;
};

export type DailyLog = {
  date: string; // YYYY-MM-DD
  meals: LoggedMeal[];
  water: number; // bardak
};

export type DailyTotals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Yerel saate göre 'YYYY-MM-DD' anahtarı üretir. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyLog(date: string): DailyLog {
  return { date, meals: [], water: 0 };
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Öğün listesinden günlük totalleri hesaplar. */
export function computeTotals(meals: LoggedMeal[]): DailyTotals {
  return meals.reduce<DailyTotals>(
    (acc, m) => ({
      kcal: acc.kcal + (m.kcal || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export type UseDailyLogResult = {
  log: DailyLog;
  totals: DailyTotals;
  loading: boolean;
  addMeal: (meal: Omit<LoggedMeal, 'id'>) => void;
  removeMeal: (id: string) => void;
  setWater: (cups: number) => void;
};

export function useDailyLog(date: string = dateKey()): UseDailyLogResult {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyLog>(() => emptyLog(date));
  const [loading, setLoading] = useState<boolean>(Boolean(db && user));

  useEffect(() => {
    setLog(emptyLog(date));
    if (!db || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, 'users', user.uid, 'days', date);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setLog({
            date,
            meals: Array.isArray(d.meals) ? (d.meals as LoggedMeal[]) : [],
            water: Number(d.water ?? 0),
          });
        } else {
          setLog(emptyLog(date));
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user, date]);

  const persist = useCallback(
    (next: DailyLog) => {
      if (!db || !user) return;
      void setDoc(
        doc(db, 'users', user.uid, 'days', date),
        { meals: next.meals, water: next.water, updatedAt: serverTimestamp() },
        { merge: true },
      ).catch(() => {});
    },
    [user, date],
  );

  const addMeal = useCallback(
    (meal: Omit<LoggedMeal, 'id'>) => {
      const full: LoggedMeal = { ...meal, id: genId() };
      setLog((prev) => {
        const next = { ...prev, meals: [...prev.meals, full] };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeMeal = useCallback(
    (id: string) => {
      setLog((prev) => {
        const next = { ...prev, meals: prev.meals.filter((m) => m.id !== id) };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setWater = useCallback(
    (cups: number) => {
      setLog((prev) => {
        const next = { ...prev, water: Math.max(0, cups) };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return { log, totals: computeTotals(log.meals), loading, addMeal, removeMeal, setWater };
}
