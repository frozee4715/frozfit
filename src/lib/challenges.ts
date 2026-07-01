/**
 * Haftalık meydan okumalar — kullanıcının KENDİ verisinden (öğün geçmişi + egzersiz
 * geçmişi + plan) bu haftaya ait ilerleme hesaplanır. Sunucuya hiçbir ek veri yazılmaz,
 * yeni güvenlik kuralı gerektirmez.
 *
 * Hafta = Pazartesi 00:00'dan başlayan 7 günlük dilim (yerel saat).
 */
import { useMemo } from 'react';

import { dateKey } from '@/lib/daily-log';
import { useTrackingHistory } from '@/lib/tracking-history';
import { useUserProfile } from '@/lib/user-profile';
import { useWorkoutHistory } from '@/lib/workout-log';

export type Challenge = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  /** Hedef değer. */
  target: number;
  /** Şu anki ilerleme (0..target+). */
  current: number;
  /** Birim etiketi (örn. "antrenman", "gün", "dk"). */
  unit: string;
};

/** Bu haftanın (Pazartesi başlangıçlı) tarih anahtarları kümesi. */
export function thisWeekKeys(): Set<string> {
  const now = new Date();
  // getDay: 0=Pazar..6=Cumartesi → Pazartesi'ye kaydır.
  const offset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - offset);
  const keys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    keys.add(dateKey(d));
  }
  return keys;
}

export type UseChallengesResult = {
  challenges: Challenge[];
  completedCount: number;
  loading: boolean;
};

export function useChallenges(): UseChallengesResult {
  const { days, loading: daysLoading } = useTrackingHistory();
  const { days: workoutDays, loading: woLoading } = useWorkoutHistory();
  const { profile } = useUserProfile();

  const challenges = useMemo<Challenge[]>(() => {
    const week = thisWeekKeys();
    const weekDays = days.filter((d) => week.has(d.date));
    const weekWorkouts = workoutDays.filter((d) => week.has(d.date));

    const waterGoal = profile?.plan?.waterGoal ?? 8;
    const proteinGoal = profile?.plan?.protein ?? 0;

    const loggedDayCount = weekDays.filter((d) => d.mealCount > 0).length;
    const workoutDayCount = weekWorkouts.filter((d) => d.count > 0).length;
    const workoutMinutes = weekWorkouts.reduce((s, d) => s + d.minutes, 0);
    const waterGoalDays = weekDays.filter((d) => d.water >= waterGoal).length;
    const proteinGoalDays =
      proteinGoal > 0 ? weekDays.filter((d) => d.totals.protein >= proteinGoal).length : 0;

    return [
      {
        id: 'workouts',
        title: 'Hareketli hafta',
        desc: 'Bu hafta 4 antrenman tamamla',
        icon: 'barbell-outline',
        target: 4,
        current: workoutDayCount,
        unit: 'antrenman',
      },
      {
        id: 'active-minutes',
        title: '150 dakika hareket',
        desc: 'WHO önerisi: haftada 150 dk aktivite',
        icon: 'timer-outline',
        target: 150,
        current: workoutMinutes,
        unit: 'dk',
      },
      {
        id: 'logging',
        title: 'Takipte kal',
        desc: 'Bu hafta 7 gün öğün kaydet',
        icon: 'create-outline',
        target: 7,
        current: loggedDayCount,
        unit: 'gün',
      },
      {
        id: 'water',
        title: 'Su kahramanı',
        desc: `Günlük su hedefini (${waterGoal} bardak) 5 gün tut`,
        icon: 'water-outline',
        target: 5,
        current: waterGoalDays,
        unit: 'gün',
      },
      {
        id: 'protein',
        title: 'Protein hedefi',
        desc: 'Protein hedefini 5 gün yakala',
        icon: 'fitness-outline',
        target: 5,
        current: proteinGoalDays,
        unit: 'gün',
      },
    ];
  }, [days, workoutDays, profile]);

  const completedCount = challenges.filter((c) => c.current >= c.target).length;

  return { challenges, completedCount, loading: daysLoading || woLoading };
}
