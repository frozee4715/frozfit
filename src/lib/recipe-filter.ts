/**
 * Kullanıcının diyet tercihi, alerjileri ve sevmediği besinlere göre tarif filtreleme.
 */
import type { Recipe } from '@/constants/mock-data';
import type { AllergenKey, Diet } from '@/lib/plan';

export type RecipePrefs = {
  diet: Diet;
  allergies: AllergenKey[];
  dislikes: string[];
};

/** Tarif, kullanıcının tercihlerine uygun mu? prefs null ise her tarif uygundur. */
export function isRecipeAllowed(recipe: Recipe, prefs: RecipePrefs | null): boolean {
  if (!prefs) return true;

  // Diyet uyumu
  if (!recipe.suitableDiets.includes(prefs.diet)) return false;

  // Alerjen çakışması
  if (recipe.allergens.some((a) => prefs.allergies.includes(a))) return false;

  // Sevmediği / kaçındığı besinler (tarif başlığında geçiyorsa)
  const title = recipe.title.toLowerCase();
  if (prefs.dislikes.some((d) => d.trim() !== '' && title.includes(d.trim().toLowerCase()))) {
    return false;
  }

  return true;
}

export function filterRecipes(recipes: Recipe[], prefs: RecipePrefs | null): Recipe[] {
  return recipes.filter((r) => isRecipeAllowed(r, prefs));
}
