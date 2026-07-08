/**
 * Tarif (recipe) verisi için Firestore katmanı.
 *
 * - `useRecipes()` : tarifleri canlı dinler. Firebase yapılandırılmamışsa veya
 *   koleksiyon boşsa mock verilere düşer; böylece uygulama her durumda çalışır.
 * - `seedRecipes()`: mock-data içindeki örnek tarifleri Firestore'a bir kez yükler
 *   (geliştirme sırasında koleksiyonu doldurmak için).
 */
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { recipes as mockRecipes, type Recipe } from '@/constants/mock-data';
import { db } from '@/lib/firebase';

const RECIPES = 'recipes';

/** Firestore dökümanını Recipe tipine güvenli şekilde dönüştürür. */
function toRecipe(id: string, data: Record<string, unknown>): Recipe {
  return {
    id,
    title: String(data.title ?? ''),
    image: String(data.image ?? ''),
    kcal: Number(data.kcal ?? 0),
    minutes: Number(data.minutes ?? 0),
    protein: Number(data.protein ?? 0),
    carbs: Number(data.carbs ?? 0),
    fat: Number(data.fat ?? 0),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    category: String(data.category ?? ''),
    allergens: Array.isArray(data.allergens) ? (data.allergens as Recipe['allergens']) : [],
    suitableDiets: Array.isArray(data.suitableDiets)
      ? (data.suitableDiets as Recipe['suitableDiets'])
      : ['omnivore', 'vegetarian', 'vegan', 'pescatarian'],
    ingredients: Array.isArray(data.ingredients) ? (data.ingredients as string[]) : undefined,
    steps: Array.isArray(data.steps) ? (data.steps as string[]) : undefined,
    authorName: data.authorName ? String(data.authorName) : undefined,
  };
}

export type UseRecipesResult = {
  recipes: Recipe[];
  loading: boolean;
  /** true ise Firestore yerine mock veriler gösteriliyor. */
  usingMock: boolean;
  error: Error | null;
};

export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [loading, setLoading] = useState(Boolean(db));
  const [usingMock, setUsingMock] = useState(!db);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      collection(db, RECIPES),
      (snap) => {
        if (snap.empty) {
          // Koleksiyon henüz boş → mock göster.
          setRecipes(mockRecipes);
          setUsingMock(true);
        } else {
          // Yerleşik katalog + Firestore birleşimi: Firestore'daki dökümanlar
          // aynı id'li yerleşik tarifi günceller, topluluk tarifleri eklenir.
          // Böylece uygulama güncellemesiyle gelen yeni tarifler her kullanıcıda görünür.
          const merged = new Map(mockRecipes.map((r) => [r.id, r]));
          snap.docs.forEach((d) => merged.set(d.id, toRecipe(d.id, d.data())));
          setRecipes([...merged.values()]);
          setUsingMock(false);
        }
        setLoading(false);
      },
      (err) => {
        // İzin/bağlantı hatası → mock'a düş, uygulamayı kırma.
        setError(err);
        setRecipes(mockRecipes);
        setUsingMock(true);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { recipes, loading, usingMock, error };
}

/** Mock tarifleri Firestore'a yükler. Var olan id'lerin üzerine yazar. */
export async function seedRecipes(database: Firestore | undefined = db): Promise<number> {
  if (!database) throw new Error('Firebase yapılandırılmamış; seed yapılamaz.');
  const existing = await getDocs(collection(database, RECIPES));
  if (!existing.empty) return 0; // zaten dolu, tekrar yükleme
  await Promise.all(
    mockRecipes.map(({ id, ...rest }) => setDoc(doc(database, RECIPES, id), rest)),
  );
  return mockRecipes.length;
}
