/**
 * Kullanıcı profili — Firestore'da `users/{uid}` dökümanında saklanır.
 *
 * - `useUserProfile()` : oturum açan kullanıcının profilini canlı dinler.
 * - `saveOnboarding()` : onboarding cevaplarını + hesaplanan planı kaydeder.
 * - Misafir (anonim) kullanıcılar için deneme süresi limiti (GUEST_TRIAL_DAYS).
 */
import { arrayRemove, arrayUnion, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import {
  computePlan,
  DEFAULT_PREFERENCES,
  type NutritionPlan,
  type PlanInput,
  type Preferences,
} from '@/lib/plan';

/** Misafir hesaplarının deneme süresi (gün). */
export const GUEST_TRIAL_DAYS = 7;

export type UserProfile = PlanInput &
  Preferences & {
    name: string;
    plan: NutritionPlan;
    /** Onboarding tamamlandıysa zaman damgası (ms); aksi halde null. */
    onboardedAt: number | null;
    isGuest: boolean;
    /** Misafir hesabın oluşturulma zamanı (ms) — deneme süresi hesabı için. */
    guestStartedAt: number | null;
    /** Favori/kaydedilen tarif id'leri. */
    favorites: string[];
    /** Takip edilen kullanıcı uid'leri. */
    following: string[];
  };

const USERS = 'users';

function toProfile(data: Record<string, any>): UserProfile {
  return {
    name: String(data.name ?? ''),
    gender: data.gender ?? 'male',
    age: Number(data.age ?? 0),
    height: Number(data.height ?? 0),
    weight: Number(data.weight ?? 0),
    targetWeight: Number(data.targetWeight ?? 0),
    goal: data.goal ?? 'maintain',
    activity: data.activity ?? 'moderate',
    plan: data.plan as NutritionPlan,
    diet: data.diet ?? DEFAULT_PREFERENCES.diet,
    allergies: Array.isArray(data.allergies) ? data.allergies : DEFAULT_PREFERENCES.allergies,
    mealsPerDay: Number(data.mealsPerDay ?? DEFAULT_PREFERENCES.mealsPerDay),
    cookingTime: data.cookingTime ?? DEFAULT_PREFERENCES.cookingTime,
    dislikes: Array.isArray(data.dislikes) ? data.dislikes : DEFAULT_PREFERENCES.dislikes,
    onboardedAt: data.onboardedAt ?? null,
    isGuest: Boolean(data.isGuest),
    guestStartedAt: data.guestStartedAt ?? null,
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
    following: Array.isArray(data.following) ? data.following : [],
  };
}

export type UseUserProfileResult = {
  profile: UserProfile | null;
  loading: boolean;
};

/** Oturum açan kullanıcının Firestore profilini canlı dinler. */
export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, USERS, user.uid),
      (snap) => {
        setProfile(snap.exists() ? toProfile(snap.data()) : null);
        setLoading(false);
      },
      () => {
        setProfile(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  return { profile, loading };
}

export type OnboardingInput = PlanInput & Preferences & { name: string };

/** Onboarding cevaplarını + hesaplanan planı kaydeder. */
export async function saveOnboarding(
  uid: string,
  isGuest: boolean,
  input: OnboardingInput,
): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  const { name, ...planInput } = input;
  const plan = computePlan(planInput);

  await setDoc(
    doc(db, USERS, uid),
    {
      name,
      ...planInput,
      plan,
      isGuest,
      onboardedAt: Date.now(),
      guestStartedAt: isGuest ? Date.now() : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Mevcut profili günceller ve planı yeniden hesaplar.
 * `onboardedAt` / `guestStartedAt` / `isGuest` alanlarına DOKUNMAZ (yalnızca onboarding bunları kurar).
 */
export async function updateProfile(uid: string, input: OnboardingInput): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  const { name, ...planInput } = input;
  const plan = computePlan(planInput);

  await setDoc(
    doc(db, USERS, uid),
    {
      name,
      ...planInput,
      plan,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Misafir bayrağını kaldırır (hesaba yükseltme sonrası). */
export async function clearGuestFlag(uid: string): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, USERS, uid),
    { isGuest: false, guestStartedAt: null, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Bir tarifi favorilere ekler/çıkarır. */
export async function toggleFavorite(uid: string, recipeId: string, makeFavorite: boolean): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  await setDoc(
    doc(db, USERS, uid),
    { favorites: makeFavorite ? arrayUnion(recipeId) : arrayRemove(recipeId), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Bir kullanıcıyı takip eder/bırakır. */
export async function toggleFollow(uid: string, targetUid: string, follow: boolean): Promise<void> {
  if (!db || uid === targetUid) return;
  await setDoc(
    doc(db, USERS, uid),
    { following: follow ? arrayUnion(targetUid) : arrayRemove(targetUid), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Misafir denemesinden kalan gün sayısı (negatifse süre dolmuş). */
export function guestDaysLeft(profile: UserProfile | null): number {
  if (!profile?.isGuest || !profile.guestStartedAt) return GUEST_TRIAL_DAYS;
  const elapsedDays = (Date.now() - profile.guestStartedAt) / (1000 * 60 * 60 * 24);
  return Math.ceil(GUEST_TRIAL_DAYS - elapsedDays);
}

/** Misafir deneme süresi doldu mu? */
export function isGuestExpired(profile: UserProfile | null): boolean {
  if (!profile?.isGuest) return false;
  return guestDaysLeft(profile) <= 0;
}
