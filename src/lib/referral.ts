/**
 * Davet sistemi (istemci) — kod alma ve bozdurma.
 *
 * Ödül kredisini SUNUCU verir: Firestore kuralı istemcinin `aiCredits` alanını
 * artırmasını engelliyor (bilerek). Bu yüzden her iki uç da Worker'a gider ve
 * Worker servis hesabıyla yazar. İstemci burada yalnızca isteği taşır.
 */
import { auth } from '@/lib/firebase';

const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;

export function isReferralEnabled(): boolean {
  return Boolean(PROXY_URL);
}

async function call<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!PROXY_URL) throw new Error('Davet sistemi yapılandırılmamış.');

  const user = auth?.currentUser;
  if (!user) throw new Error('Bu işlem için giriş yapmalısın.');
  const token = await user.getIdToken();

  // Worker'ın kökü AI uç noktası; davet uçları alt yollarda.
  const res = await fetch(`${PROXY_URL.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && typeof data.error === 'string' && data.error) || 'İşlem tamamlanamadı.');
  }
  return data as T;
}

/** Kullanıcının davet kodunu (yoksa üreterek) ve getirdiği kişi sayısını döndürür. */
export function getMyCode(): Promise<{ code: string; count: number }> {
  return call('/referral/code');
}

/** Bir arkadaşın kodunu bozdurur; her iki tarafa kredi yazar. */
export function claimCode(code: string): Promise<{ reward: number }> {
  return call('/referral/claim', { code });
}
