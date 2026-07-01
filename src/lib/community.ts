/**
 * Topluluk tarifleri — kullanıcıların paylaştığı tarifler `community_recipes`
 * koleksiyonunda saklanır ve herkese açıktır.
 *
 * - `useCommunityRecipes()` : paylaşılan tarifleri canlı dinler (en yeni önce).
 * - `shareRecipe()` : yeni bir topluluk tarifi oluşturur.
 *
 * Not: Görsel yükleme (Storage) henüz yok; kullanıcı isterse bir görsel URL'i
 * yapıştırır, boşsa varsayılan bir görsel kullanılır.
 */
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import type { Recipe } from '@/constants/mock-data';
import { db } from '@/lib/firebase';

const COMMUNITY = 'community_recipes';

/** Görsel verilmezse kullanılacak varsayılan yemek görseli. */
export const DEFAULT_RECIPE_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70';

function toCommunityRecipe(id: string, data: Record<string, any>): Recipe {
  return {
    id,
    title: String(data.title ?? ''),
    image: data.image ? String(data.image) : DEFAULT_RECIPE_IMAGE,
    kcal: Number(data.kcal ?? 0),
    minutes: Number(data.minutes ?? 0),
    protein: Number(data.protein ?? 0),
    carbs: Number(data.carbs ?? 0),
    fat: Number(data.fat ?? 0),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : ['Topluluk'],
    category: String(data.category ?? 'Topluluk'),
    allergens: Array.isArray(data.allergens) ? (data.allergens as Recipe['allergens']) : [],
    suitableDiets: Array.isArray(data.suitableDiets)
      ? (data.suitableDiets as Recipe['suitableDiets'])
      : ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: Array.isArray(data.ingredients) ? (data.ingredients as string[]) : undefined,
    steps: Array.isArray(data.steps) ? (data.steps as string[]) : undefined,
    authorName: data.authorName ? String(data.authorName) : 'Bir FrozFit kullanıcısı',
    authorUid: data.authorUid ? String(data.authorUid) : undefined,
    likedBy: Array.isArray(data.likedBy) ? (data.likedBy as string[]) : [],
  };
}

export type UseCommunityRecipesResult = {
  recipes: Recipe[];
  loading: boolean;
};

export function useCommunityRecipes(): UseCommunityRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(db));

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, COMMUNITY), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecipes(snap.docs.map((d) => toCommunityRecipe(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return { recipes, loading };
}

export type ShareRecipeInput = {
  title: string;
  image: string;
  kcal: number;
  minutes: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
};

/** Yeni topluluk tarifi paylaşır; oluşturulan dökümanın id'sini döndürür. */
export async function shareRecipe(
  authorUid: string,
  authorName: string,
  input: ShareRecipeInput,
): Promise<string> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  const ref = await addDoc(collection(db, COMMUNITY), {
    ...input,
    image: input.image.trim(),
    authorUid,
    authorName,
    category: 'Topluluk',
    tags: ['Topluluk'],
    allergens: [],
    suitableDiets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Bir topluluk tarifini beğenir/geri alır. */
export async function toggleLike(recipeId: string, uid: string, like: boolean): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  await setDoc(
    doc(db, COMMUNITY, recipeId),
    { likedBy: like ? arrayUnion(uid) : arrayRemove(uid) },
    { merge: true },
  );
}
