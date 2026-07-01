/**
 * Günlük egzersiz/antrenman kaydı — Firestore'da `users/{uid}/workouts/{YYYY-MM-DD}`
 * dökümanında saklanır.
 *
 * - `useWorkoutLog(dateKey)` : ilgili günün antrenmanlarını canlı dinler + mutasyonlar.
 * - Yakılan kalori MET formülüyle tahmin edilir: kcal = MET × kg × saat.
 *   (Vücut ağırlığı profilden gelir; yoksa varsayılan 70 kg.)
 * - Beslenme tarafıyla aynı tarih anahtarını (dateKey) paylaşır; böylece "net kalori"
 *   = alınan − yakılan hesaplanabilir.
 *
 * Firebase yapılandırılmamışsa / oturum yoksa kayıt yalnızca bellekte tutulur (kalıcı değil).
 */
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { dateKey } from '@/lib/daily-log';

/** Vücut ağırlığı bilinmiyorsa kalori tahmininde kullanılan varsayılan (kg). */
export const DEFAULT_BODY_WEIGHT = 70;

export type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'sports';

/**
 * Egzersiz kütüphanesi — her tür için kabaca MET (Metabolic Equivalent) değeri.
 * Kaynak: Compendium of Physical Activities (yaklaşık değerler).
 */
export type ExerciseType = {
  id: string;
  name: string;
  category: ExerciseCategory;
  met: number;
  icon: string;
};

export const EXERCISE_LIBRARY: ExerciseType[] = [
  // Kardiyo
  { id: 'walk', name: 'Yürüyüş', category: 'cardio', met: 3.5, icon: 'walk-outline' },
  { id: 'run', name: 'Koşu', category: 'cardio', met: 9.8, icon: 'walk' },
  { id: 'cycling', name: 'Bisiklet', category: 'cardio', met: 7.5, icon: 'bicycle-outline' },
  { id: 'swim', name: 'Yüzme', category: 'cardio', met: 8.0, icon: 'water-outline' },
  { id: 'jump-rope', name: 'İp atlama', category: 'cardio', met: 11.0, icon: 'pulse-outline' },
  { id: 'elliptical', name: 'Eliptik', category: 'cardio', met: 5.0, icon: 'fitness-outline' },
  { id: 'rowing', name: 'Kürek', category: 'cardio', met: 7.0, icon: 'boat-outline' },
  { id: 'hiit', name: 'HIIT', category: 'cardio', met: 8.5, icon: 'flash-outline' },

  // Kuvvet
  { id: 'weights', name: 'Ağırlık antrenmanı', category: 'strength', met: 5.0, icon: 'barbell-outline' },
  { id: 'bodyweight', name: 'Vücut ağırlığı', category: 'strength', met: 4.3, icon: 'body-outline' },
  { id: 'crossfit', name: 'Crossfit', category: 'strength', met: 8.0, icon: 'flame-outline' },
  { id: 'calisthenics', name: 'Kalistenik', category: 'strength', met: 5.5, icon: 'accessibility-outline' },

  // Esneklik
  { id: 'yoga', name: 'Yoga', category: 'flexibility', met: 3.0, icon: 'leaf-outline' },
  { id: 'pilates', name: 'Pilates', category: 'flexibility', met: 3.5, icon: 'ellipse-outline' },
  { id: 'stretching', name: 'Esneme', category: 'flexibility', met: 2.3, icon: 'resize-outline' },

  // Spor
  { id: 'football', name: 'Futbol', category: 'sports', met: 7.0, icon: 'football-outline' },
  { id: 'basketball', name: 'Basketbol', category: 'sports', met: 6.5, icon: 'basketball-outline' },
  { id: 'tennis', name: 'Tenis', category: 'sports', met: 7.3, icon: 'tennisball-outline' },
  { id: 'dance', name: 'Dans', category: 'sports', met: 5.0, icon: 'musical-notes-outline' },
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  cardio: 'Kardiyo',
  strength: 'Kuvvet',
  flexibility: 'Esneklik',
  sports: 'Spor',
};

export type LoggedExercise = {
  id: string;
  /** Kütüphane id'si (özel egzersizde 'custom'). */
  typeId: string;
  name: string;
  category: ExerciseCategory;
  /** Süre (dakika). */
  minutes: number;
  /** Yakılan tahmini kalori. */
  kcal: number;
};

export type WorkoutLog = {
  date: string;
  exercises: LoggedExercise[];
};

/** MET formülüyle yakılan kaloriyi hesaplar: MET × kg × saat. */
export function estimateBurn(met: number, minutes: number, bodyWeightKg: number = DEFAULT_BODY_WEIGHT): number {
  const hours = minutes / 60;
  return Math.round(met * (bodyWeightKg || DEFAULT_BODY_WEIGHT) * hours);
}

/** Bir günün toplam yakılan kalorisi + toplam dakikası. */
export function computeWorkoutTotals(exercises: LoggedExercise[]): { kcal: number; minutes: number } {
  return exercises.reduce(
    (acc, e) => ({ kcal: acc.kcal + (e.kcal || 0), minutes: acc.minutes + (e.minutes || 0) }),
    { kcal: 0, minutes: 0 },
  );
}

function emptyLog(date: string): WorkoutLog {
  return { date, exercises: [] };
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type UseWorkoutLogResult = {
  log: WorkoutLog;
  totals: { kcal: number; minutes: number };
  loading: boolean;
  addExercise: (exercise: Omit<LoggedExercise, 'id'>) => void;
  removeExercise: (id: string) => void;
};

export function useWorkoutLog(date: string = dateKey()): UseWorkoutLogResult {
  const { user } = useAuth();
  const [log, setLog] = useState<WorkoutLog>(() => emptyLog(date));
  const [loading, setLoading] = useState<boolean>(Boolean(db && user));

  useEffect(() => {
    setLog(emptyLog(date));
    if (!db || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, 'users', user.uid, 'workouts', date);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setLog({
            date,
            exercises: Array.isArray(d.exercises) ? (d.exercises as LoggedExercise[]) : [],
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
    (next: WorkoutLog) => {
      if (!db || !user) return;
      void setDoc(
        doc(db, 'users', user.uid, 'workouts', date),
        { exercises: next.exercises, updatedAt: serverTimestamp() },
        { merge: true },
      ).catch(() => {});
    },
    [user, date],
  );

  const addExercise = useCallback(
    (exercise: Omit<LoggedExercise, 'id'>) => {
      const full: LoggedExercise = { ...exercise, id: genId() };
      setLog((prev) => {
        const next = { ...prev, exercises: [...prev.exercises, full] };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeExercise = useCallback(
    (id: string) => {
      setLog((prev) => {
        const next = { ...prev, exercises: prev.exercises.filter((e) => e.id !== id) };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return { log, totals: computeWorkoutTotals(log.exercises), loading, addExercise, removeExercise };
}

export type WorkoutHistoryDay = {
  date: string; // YYYY-MM-DD
  kcal: number;
  minutes: number;
  count: number;
};

export type UseWorkoutHistoryResult = {
  days: WorkoutHistoryDay[]; // tarihe göre azalan (en yeni önce)
  loading: boolean;
};

/** Tüm `users/{uid}/workouts` günlerini okur (meydan okuma/özet hesapları için). */
export function useWorkoutHistory(): UseWorkoutHistoryResult {
  const { user } = useAuth();
  const [days, setDays] = useState<WorkoutHistoryDay[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(db && user));

  useEffect(() => {
    if (!db || !user) {
      setDays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'workouts'),
      (snap) => {
        const list: WorkoutHistoryDay[] = snap.docs.map((d) => {
          const data = d.data();
          const exercises = Array.isArray(data.exercises) ? (data.exercises as LoggedExercise[]) : [];
          const t = computeWorkoutTotals(exercises);
          return { date: String(d.id), kcal: t.kcal, minutes: t.minutes, count: exercises.length };
        });
        list.sort((a, b) => b.date.localeCompare(a.date));
        setDays(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  return { days, loading };
}
