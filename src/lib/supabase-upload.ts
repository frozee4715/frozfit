/**
 * Telifsiz/ücretsiz görsel yükleme — Supabase Storage (kredi kartı gerektirmez).
 *
 * Görseller `recipe-images` adlı herkese açık (public) bucket'a yüklenir; tarif
 * kartlarında URL ile gösterilir. Anahtar olarak Supabase'in PUBLIC "anon" anahtarı
 * kullanılır — bu anahtar istemcide bulunmak ÜZERE tasarlanmıştır; erişim, Supabase
 * tarafındaki bucket politikalarıyla (insert'e izin, update/delete'e izin yok) kontrol edilir.
 *
 * Kurulum (kullanıcı tarafında):
 *  1. supabase.com → ücretsiz proje (kart yok)
 *  2. Storage → "recipe-images" adında PUBLIC bucket oluştur
 *  3. Project Settings → API → Project URL ve anon public key'i .env'e koy:
 *     EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 */
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const BUCKET = 'recipe-images';

export function isUploadEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Base64 görseli Supabase Storage'a yükler ve herkese açık URL'ini döndürür.
 * Yol: `{uid}/{zaman}.jpg`.
 */
export async function uploadRecipeImage(uid: string, base64: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Görsel yükleme yapılandırılmamış (Supabase anahtarları yok).');
  }
  const path = `${uid}/${Date.now()}.jpg`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'false',
    },
    body: decode(base64),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Görsel yüklenemedi (${res.status}). ${txt}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
