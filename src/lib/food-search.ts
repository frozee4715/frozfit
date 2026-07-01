/**
 * Barkoddan besin arama — Open Food Facts (ücretsiz, anahtarsız) API.
 * https://world.openfoodfacts.org
 */

export type FoodProduct = {
  barcode: string;
  name: string;
  brand?: string;
  /** 100 g/ml başına değerler. */
  kcalPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  /** Varsa bir porsiyon (g). */
  servingG?: number;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Barkodu Open Food Facts'te arar; bulunamazsa null döner. */
export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_tr,brands,nutriments,serving_quantity`,
      { signal: controller.signal, headers: { 'User-Agent': 'FrozFit/0.1 (mobile app)' } },
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== 1 || !data?.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};
    const name = String(p.product_name_tr || p.product_name || '').trim();
    if (!name) return null;

    return {
      barcode,
      name,
      brand: p.brands ? String(p.brands).split(',')[0].trim() : undefined,
      kcalPer100: Math.round(num(n['energy-kcal_100g'])),
      proteinPer100: Math.round(num(n['proteins_100g'])),
      carbsPer100: Math.round(num(n['carbohydrates_100g'])),
      fatPer100: Math.round(num(n['fat_100g'])),
      servingG: p.serving_quantity ? num(p.serving_quantity) : undefined,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}
