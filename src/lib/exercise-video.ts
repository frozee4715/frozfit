/**
 * Telifsiz egzersiz videoları — Pixabay (https://pixabay.com/api/docs/).
 *
 * Pixabay içerik lisansı: ücretsiz, ticari kullanım serbest, atıf zorunlu DEĞİL.
 * Anahtar `EXPO_PUBLIC_PIXABAY_KEY` ile sağlanır (ücretsiz hesap). Anahtar yoksa
 * `isVideoEnabled()` false döner ve uygulama fotoğraf gösterimine düşer (bozulmaz).
 *
 * NOT: Klipler genel fitness görüntüleridir (her harekete birebir özel anlatım değil),
 * ama tamamen telifsizdir ve gerçek videodur.
 */
const KEY = process.env.EXPO_PUBLIC_PIXABAY_KEY?.trim();

export function isVideoEnabled(): boolean {
  return Boolean(KEY);
}

/** Bir hareket için arama sorgusu (İngilizce; Pixabay daha iyi sonuç verir). */
export function videoQueryFor(dbId: string): string {
  return `${dbId.replace(/[_-]+/g, ' ')} exercise`;
}

// Aynı sorgu için tekrar tekrar istek atmamak adına basit önbellek.
const cache = new Map<string, string | null>();

/** Sorguya uygun ilk telifsiz video URL'ini döndürür (yoksa null). */
export async function fetchExerciseVideoUrl(query: string): Promise<string | null> {
  if (!KEY) return null;
  if (cache.has(query)) return cache.get(query) ?? null;

  try {
    const url =
      `https://pixabay.com/api/videos/?key=${KEY}` +
      `&q=${encodeURIComponent(query)}&per_page=5&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) {
      cache.set(query, null);
      return null;
    }
    const data = await res.json();
    const v = data?.hits?.[0]?.videos;
    // Orta boy en dengeli; yoksa küçük/minik.
    const result: string | null = v?.medium?.url || v?.small?.url || v?.tiny?.url || null;
    cache.set(query, result);
    return result;
  } catch {
    cache.set(query, null);
    return null;
  }
}
