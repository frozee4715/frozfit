/**
 * Kişisel beslenme planı hesaplama.
 *
 * - `computePlan`  : Mifflin-St Jeor formülüyle günlük kalori + makro hedeflerini üretir.
 * - `buildSuggestions` : kullanıcının cevaplarına göre KURAL TABANLI öneriler döndürür.
 *
 * Not: `buildSuggestions` şu an gerçek bir yapay zekâ modeli DEĞİL, deterministik
 * kurallardır (hiçbir harici/ücretli API çağrısı yapmaz). İleride bu fonksiyonun
 * çıktısı gerçek bir AI modeliyle değiştirilebilir — arayüz aynı kalır.
 */

export type Gender = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active';
export type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
export type AllergenKey = 'gluten' | 'lactose' | 'nuts' | 'egg' | 'seafood' | 'soy';
export type CookingTime = 'quick' | 'medium' | 'relaxed';

export type PlanInput = {
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  goal: Goal;
  activity: Activity;
};

/** Kişinin günlük hayatına dair tercihler — plan ve tarif filtreleme için. */
export type Preferences = {
  diet: Diet;
  allergies: AllergenKey[];
  mealsPerDay: number; // 2-5
  cookingTime: CookingTime;
  dislikes: string[]; // sevmediği / kaçındığı besinler (serbest metin)
};

export const DEFAULT_PREFERENCES: Preferences = {
  diet: 'omnivore',
  allergies: [],
  mealsPerDay: 3,
  cookingTime: 'medium',
  dislikes: [],
};

export const DIETS: { value: Diet; label: string }[] = [
  { value: 'omnivore', label: 'Hepçil' },
  { value: 'vegetarian', label: 'Vejetaryen' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pesketaryen' },
];

export const ALLERGENS: { value: AllergenKey; label: string }[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactose', label: 'Laktoz / Süt' },
  { value: 'nuts', label: 'Kuruyemiş' },
  { value: 'egg', label: 'Yumurta' },
  { value: 'seafood', label: 'Deniz ürünleri' },
  { value: 'soy', label: 'Soya' },
];

export const COOKING_TIMES: { value: CookingTime; label: string; hint: string }[] = [
  { value: 'quick', label: 'Hızlı', hint: '15 dk altı, pratik' },
  { value: 'medium', label: 'Orta', hint: '15-30 dk' },
  { value: 'relaxed', label: 'Acelem yok', hint: '30 dk+, keyifli' },
];

export function dietLabel(diet: Diet): string {
  return DIETS.find((d) => d.value === diet)?.label ?? diet;
}

export function allergenLabel(key: AllergenKey): string {
  return ALLERGENS.find((a) => a.value === key)?.label ?? key;
}

export type NutritionPlan = {
  calorieGoal: number; // kcal/gün
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  waterGoal: number; // bardak (250 ml)
  bmi: number;
};

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_ADJUST: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 350,
};

const round = (n: number) => Math.round(n);

/** Mifflin-St Jeor + aktivite + hedef → günlük kalori ve makro hedefleri. */
export function computePlan(input: PlanInput): NutritionPlan {
  const { gender, age, height, weight, goal, activity } = input;

  // Bazal metabolizma hızı (BMR)
  const s = gender === 'male' ? 5 : -161;
  const bmr = 10 * weight + 6.25 * height - 5 * age + s;

  // Toplam günlük enerji (TDEE) ve hedefe göre ayar
  const tdee = bmr * ACTIVITY_FACTOR[activity];
  const calorieGoal = Math.max(1200, round(tdee + GOAL_ADJUST[goal]));

  // Makrolar: protein vücut ağırlığına göre, yağ kaloriden %25, kalanı karbonhidrat
  const protein = round(weight * 1.8);
  const fat = round((calorieGoal * 0.25) / 9);
  const carbs = Math.max(0, round((calorieGoal - protein * 4 - fat * 9) / 4));

  // Su: ~35 ml/kg, 250 ml'lik bardaklara böl
  const waterGoal = Math.max(6, round((weight * 35) / 250));

  const bmi = weight / Math.pow(height / 100, 2);

  return { calorieGoal, protein, carbs, fat, waterGoal, bmi: Math.round(bmi * 10) / 10 };
}

const GOAL_LABEL: Record<Goal, string> = {
  lose: 'Kilo verme',
  maintain: 'Formu koruma',
  gain: 'Kilo alma',
};

export function goalLabel(goal: Goal): string {
  return GOAL_LABEL[goal];
}

/** Günlük kaloriyi öğün sayısına böler (kabaca). */
export function caloriesPerMeal(plan: NutritionPlan, mealsPerDay: number): number {
  const n = Math.max(1, mealsPerDay);
  return Math.round(plan.calorieGoal / n / 10) * 10;
}

/**
 * Kullanıcıya özel, kural tabanlı öneriler. (AI değil — deterministik.)
 */
export function buildSuggestions(
  input: PlanInput,
  plan: NutritionPlan,
  prefs?: Preferences,
): string[] {
  const tips: string[] = [];
  const { goal, activity, weight, targetWeight, bmi } = { ...input, bmi: plan.bmi };

  // Hedef yönüne göre ana mesaj
  if (goal === 'lose') {
    const diff = Math.max(0, Math.round(weight - targetWeight));
    tips.push(
      `Hedefin ${diff} kg vermek. Günde ~500 kcal açık ile haftada ~0,5 kg sağlıklı bir tempo.`,
    );
    tips.push(`Protein hedefini (${plan.protein} g) tutturmak kas korurken tokluk sağlar.`);
  } else if (goal === 'gain') {
    tips.push('Kas için kalori fazlasını yavaş tut; ağırlık antrenmanıyla birleştir.');
    tips.push(`Günde ${plan.protein} g proteini öğünlere yayarak almaya çalış.`);
  } else {
    tips.push('Formunu korumak için kaloriyi dengede tut, haftalık tartı takibini sürdür.');
  }

  // BMI'ye göre
  if (bmi < 18.5) tips.push('Vücut kitle indeksin düşük; besleyici, kalori yoğun öğünlere odaklan.');
  else if (bmi >= 25 && bmi < 30) tips.push('Lifli sebze ve tam tahıllar tokluğu artırır, kaloriyi düşürür.');
  else if (bmi >= 30) tips.push('Düşük tempolu yürüyüşle başlayıp süreyi kademeli artırman önerilir.');

  // Aktiviteye göre
  if (activity === 'sedentary') {
    tips.push('Gün içinde her saat 2-3 dk hareket, metabolizmana iyi gelir.');
  } else if (activity === 'active') {
    tips.push('Antrenman günleri karbonhidratı biraz artırarak performansını destekle.');
  }

  // Tercihlere göre (diyet, alerji, öğün, mutfak)
  if (prefs) {
    if (prefs.diet === 'vegan') {
      tips.push('Vegan beslenmede B12, demir ve omega-3 kaynaklarına dikkat et.');
    } else if (prefs.diet === 'vegetarian') {
      tips.push('Baklagil + tam tahıl ikilisi bitkisel proteini tamamlar.');
    } else if (prefs.diet === 'pescatarian') {
      tips.push('Haftada 2 porsiyon yağlı balık omega-3 ihtiyacını karşılar.');
    }

    if (prefs.allergies.length > 0) {
      const list = prefs.allergies.map(allergenLabel).join(', ');
      tips.push(`Şunları içeren tarifleri senin için gizliyoruz: ${list}.`);
    }

    if (prefs.mealsPerDay > 0) {
      tips.push(
        `Günde ${prefs.mealsPerDay} öğün planladın; öğün başına ~${caloriesPerMeal(
          plan,
          prefs.mealsPerDay,
        )} kcal hedefle.`,
      );
    }

    if (prefs.cookingTime === 'quick') {
      tips.push('Az vaktin var: hafta sonu toplu pişirip (meal-prep) günlere böl.');
    }
  }

  // Su
  tips.push(`Günlük ${plan.waterGoal} bardak su hedefini sabah erken başlat.`);

  return tips;
}
