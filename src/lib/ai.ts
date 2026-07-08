/**
 * AI katmanı — tüm istekler Cloudflare Worker AI proxy'sine gider.
 *
 * AI anahtarları (Gemini, OpenRouter) SUNUCUDA (Worker Secret) tutulur, istemci
 * paketine GÖMÜLMEZ. Sunucu önce Gemini'yi (ücretsiz katman), dolduğunda OpenRouter
 * yedek zincirini kullanır. İstemci, isteğe Firebase ID token'ı ekler; Worker bunu
 * doğrular, yani yalnızca giriş yapmış kullanıcı çağırabilir.
 */
import { auth } from '@/lib/firebase';

const VISION_MODEL = 'google/gemini-2.5-flash';

// Worker URL'i .env'den okunur (gizli değil; herkese açık endpoint).
const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;

function isProxyEnabled(): boolean {
  return Boolean(PROXY_URL);
}

export function isAIEnabled(): boolean {
  return isProxyEnabled();
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** OpenRouter'ın multimodal içerik biçimi (vision için metin + görsel parçaları). */
type MultimodalContent = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
type ProxyMessage = { role: string; content: string | MultimodalContent[] };

/**
 * Cloudflare Worker proxy'sine istek atar. Anahtarlar sunucuda olduğu için tek güvenli yol.
 * İsteğe giriş yapmış kullanıcının Firebase ID token'ı eklenir (Worker doğrular).
 * model verilmezse sunucu varsayılan modeli + yedek zincirini kullanır.
 */
type ProxyOpts = { model?: string; cache?: boolean };

async function callProxy(messages: ProxyMessage[], maxTokens: number, opts: ProxyOpts = {}): Promise<string> {
  if (!PROXY_URL) throw new Error('AI yapılandırılmamış.');

  const user = auth?.currentUser;
  if (!user) throw new Error('Bu işlem için giriş yapmalısın.');
  const token = await user.getIdToken();

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messages,
      maxTokens,
      ...(opts.model ? { model: opts.model } : {}),
      // Sunucuda varsayılan önbellek açık; yalnızca açıkça false ise atlanır.
      ...(opts.cache === false ? { cache: false } : {}),
    }),
  });

  if (!res.ok) {
    let message = 'AI yanıtı alınamadı. Tekrar dene.';
    try {
      const err = await res.json();
      if (err && typeof err.error === 'string' && err.error.trim()) message = err.error;
    } catch {
      // gövde JSON değilse varsayılan mesajı kullan
    }
    throw new Error(message);
  }

  const data = (await res.json().catch(() => null)) as { content?: string } | null;
  const content = data?.content;
  if (!content || !content.trim()) throw new Error('empty');
  return content;
}

/** Kullanıcı profilinden türetilen, modele verilecek kısıtlar. */
export type AIContext = {
  diet?: string;
  allergies?: string[];
  calorieTarget?: number;
  perMealKcal?: number;
  goal?: string;
};

function contextLines(ctx?: AIContext): string {
  if (!ctx) return '';
  const lines: string[] = [];
  if (ctx.diet && ctx.diet !== 'omnivore') lines.push(`Kullanıcının diyeti: ${ctx.diet}. Tarif buna uygun olmalı.`);
  if (ctx.allergies && ctx.allergies.length) lines.push(`Şu alerjenleri İÇERMEMELİ: ${ctx.allergies.join(', ')}.`);
  if (ctx.perMealKcal) lines.push(`Öğün yaklaşık ${ctx.perMealKcal} kcal civarında olsun.`);
  else if (ctx.calorieTarget) lines.push(`Kullanıcının günlük hedefi ~${ctx.calorieTarget} kcal.`);
  if (ctx.goal) lines.push(`Hedefi: ${ctx.goal}.`);
  return lines.length ? `Kısıtlar:\n${lines.map((l) => `- ${l}`).join('\n')}` : '';
}

/** AI sohbeti — tüm metin istekleri proxy üzerinden gider. */
async function chat(messages: ChatMessage[], maxTokens = 1200, cache = true): Promise<string> {
  if (!isProxyEnabled()) throw new Error('AI yapılandırılmamış.');
  return callProxy(messages as ProxyMessage[], maxTokens, { cache });
}

export type GeneratedRecipe = {
  title: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  minutes: number;
  ingredients: string[];
  steps: string[];
};

/** Metinden ilk geçerli JSON nesnesini çıkarıp ayrıştırır (kod bloğu/çevre metni tolere eder). */
function extractJson(text: string): any {
  // ```json ... ``` bloklarını temizle
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI yanıtı çözümlenemedi.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

/** Kullanıcının isteğine + profiline göre tek bir tarif üretir. */
export async function generateRecipe(request: string, ctx?: AIContext): Promise<GeneratedRecipe> {
  const system = [
    'Sen FrozFit uygulamasının sağlıklı beslenme şefisin. Kullanıcının isteğine uygun TEK bir sağlıklı tarif üret.',
    contextLines(ctx),
    'SADECE aşağıdaki JSON şemasıyla yanıt ver, öncesinde/sonrasında HİÇBİR metin yazma:',
    '{"title": string, "kcal": number, "protein": number, "carbs": number, "fat": number, "minutes": number, "ingredients": string[], "steps": string[]}',
    'Tüm metinler Türkçe olmalı. kcal toplam kalori, protein/carbs/fat gram, minutes hazırlık süresi (dakika). Sayılar tamsayı olsun.',
  ]
    .filter(Boolean)
    .join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: request },
  ];

  // İlk yanıt geçerli JSON değilse bir kez daha dene (modele JSON'u hatırlat).
  // Üretken istek: her "yeniden oluştur" farklı sonuç versin diye önbellek kapalı.
  let raw: any;
  try {
    raw = extractJson(await chat(messages, 1200, false));
  } catch {
    raw = extractJson(
      await chat([...messages, { role: 'user', content: 'Lütfen SADECE istenen JSON nesnesini döndür.' }], 1200, false),
    );
  }

  return {
    title: String(raw.title ?? 'AI Tarifi').trim(),
    kcal: Math.max(0, Math.round(Number(raw.kcal) || 0)),
    protein: Math.max(0, Math.round(Number(raw.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(raw.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(raw.fat) || 0)),
    minutes: Math.max(0, Math.round(Number(raw.minutes) || 0)),
    ingredients: toStringArray(raw.ingredients),
    steps: toStringArray(raw.steps),
  };
}

export type MealIdea = { name: string; kcal: number; reason: string };

/** Kalan kaloriye/makroya göre "şimdi ne yesem" önerileri üretir. */
export async function suggestWhatToEat(
  remaining: { kcal: number; protein: number; carbs: number; fat: number },
  ctx?: AIContext,
): Promise<MealIdea[]> {
  const system = [
    'Sen bir beslenme asistanısın. Kullanıcının günlük hedefinden KALAN değerlere göre 3 öğün/atıştırmalık fikri öner.',
    contextLines(ctx),
    `Kalan: ${remaining.kcal} kcal, ${remaining.protein}g protein, ${remaining.carbs}g karbonhidrat, ${remaining.fat}g yağ.`,
    'SADECE JSON dizisi döndür: [{"name": string, "kcal": number, "reason": string}]. reason kısa Türkçe açıklama (ör. "protein açığını kapatır").',
  ]
    .filter(Boolean)
    .join('\n');
  const content = await chat([
    { role: 'system', content: system },
    { role: 'user', content: 'Kalan değerlere uygun 3 fikir ver.' },
  ]);
  const arr = extractJsonArray(content);
  return arr
    .map((x: any) => ({
      name: String(x?.name ?? '').trim(),
      kcal: Math.max(0, Math.round(Number(x?.kcal) || 0)),
      reason: String(x?.reason ?? '').trim(),
    }))
    .filter((m: MealIdea) => m.name);
}

export type MealPlanDay = { day: string; meals: { meal: string; name: string; kcal: number }[] };

/** Haftalık (7 gün) öğün planı üretir. */
export async function generateMealPlan(ctx?: AIContext): Promise<MealPlanDay[]> {
  const system = [
    'Sen bir beslenme planlayıcısısın. Kullanıcıya 7 günlük basit bir öğün planı hazırla.',
    contextLines(ctx),
    'SADECE JSON dizisi döndür: [{"day": "Pazartesi", "meals": [{"meal":"Kahvaltı","name": string,"kcal": number}, ...]}]. 7 gün, her gün kahvaltı/öğle/akşam. Türkçe.',
  ]
    .filter(Boolean)
    .join('\n');
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: 'Haftalık planı oluştur.' },
  ];

  // 7 gün × 3 öğün uzun yanıt üretir; token limitini yüksek tut. İlk deneme
  // ayrıştırılamazsa (kesilme/biçim) bir kez daha dene.
  // Üretken istek: her "yeniden oluştur" farklı plan versin diye önbellek kapalı.
  let arr: any[];
  try {
    arr = extractJsonArray(await chat(messages, 4000, false));
  } catch {
    arr = extractJsonArray(
      await chat(
        [...messages, { role: 'user', content: 'Lütfen SADECE geçerli JSON dizisini döndür, başka metin ekleme.' }],
        4000,
        false,
      ),
    );
  }
  return arr.map((d: any) => ({
    day: String(d?.day ?? '').trim(),
    meals: Array.isArray(d?.meals)
      ? d.meals.map((m: any) => ({
          meal: String(m?.meal ?? '').trim(),
          name: String(m?.name ?? '').trim(),
          kcal: Math.max(0, Math.round(Number(m?.kcal) || 0)),
        }))
      : [],
  }));
}

/**
 * Metinden JSON dizisini çıkarır. Yanıt token limitine takılıp KESİLMİŞSE bile
 * (kapanmamış `]`), içindeki TAM nesneleri tek tek kurtararak diziyi döndürür.
 */
function extractJsonArray(text: string): any[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('[');
  if (start === -1) throw new Error('AI yanıtı çözümlenemedi.');

  // Önce tam ve geçerli dizi olarak dene.
  const end = candidate.lastIndexOf(']');
  if (end > start) {
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // düş → kesik yanıt kurtarmaya geç
    }
  }

  // Kurtarma: dengeli { } bloklarını tek tek ayrıştır (kesik yanıtları tolere eder).
  const objects = salvageObjects(candidate.slice(start));
  if (objects.length === 0) throw new Error('AI yanıtı çözümlenemedi.');
  return objects;
}

/** Metindeki dengeli üst-seviye {...} bloklarını bulur ve tek tek JSON.parse eder. */
function salvageObjects(text: string): any[] {
  const out: any[] = [];
  let depth = 0;
  let startIdx = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0) depth--;
      if (depth === 0 && startIdx !== -1) {
        try {
          out.push(JSON.parse(text.slice(startIdx, i + 1)));
        } catch {
          /* bozuk bloğu atla */
        }
        startIdx = -1;
      }
    }
  }
  return out;
}

export type FoodEstimate = { name: string; kcal: number; protein: number; carbs: number; fat: number };

/** Bir yemek fotoğrafından (base64 data URL) tahmini kalori + makro çıkarır. */
export async function analyzeFoodPhoto(imageDataUrl: string, ctx?: AIContext): Promise<FoodEstimate> {
  if (!isAIEnabled()) throw new Error('AI yapılandırılmamış.');

  const system = [
    'Sen bir beslenme uzmanısın. Sana verilen fotoğraftaki yemeği gerçekçi şekilde değerlendir.',
    contextLines(ctx),
    'ÖNEMLİ: Fotoğrafta yemek/içecek YOKSA (ör. defter, eşya, insan, boş tabak) uydurma yapma;',
    'name="Yemek bulunamadı" ve tüm değerleri 0 döndür.',
    'SADECE şu JSON ile yanıt ver, başka metin yazma:',
    '{"name": string, "kcal": number, "protein": number, "carbs": number, "fat": number}',
    'name Türkçe yemek adı; değerler GÖRÜNEN porsiyon için makul tahmin (kcal toplam, makrolar gram, tamsayı).',
  ]
    .filter(Boolean)
    .join('\n');

  const messages: ProxyMessage[] = [
    { role: 'system', content: system },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Bu yemeğin tahmini kalori ve makrolarını ver.' },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ];

  const text = await callProxy(messages, 600, { model: VISION_MODEL });
  if (!text.trim()) throw new Error('AI boş yanıt döndürdü.');

  const raw = extractJson(text);
  return {
    name: String(raw.name ?? 'Yemek').trim(),
    kcal: Math.max(0, Math.round(Number(raw.kcal) || 0)),
    protein: Math.max(0, Math.round(Number(raw.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(raw.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(raw.fat) || 0)),
  };
}

/**
 * Buzdolabı / mutfak fotoğrafındaki yenilebilir malzemeleri tanır.
 * Görselden Türkçe malzeme listesi döndürür (boşsa []).
 */
export async function detectFridgeIngredients(imageDataUrl: string): Promise<string[]> {
  if (!isAIEnabled()) throw new Error('AI yapılandırılmamış.');

  const system = [
    'Sen bir mutfak asistanısın. Verilen buzdolabı veya mutfak tezgâhı fotoğrafındaki',
    'YENİLEBİLİR gıda malzemelerini tanı ve listele.',
    'Sadece gördüğün yiyecek/içecek malzemelerini yaz (sebze, meyve, et, süt ürünü, yumurta,',
    'baharat, kuru gıda vb.). Marka/ambalaj değil, malzemenin adını yaz.',
    'SADECE JSON dizisi döndür: ["malzeme1","malzeme2",...]. Türkçe, sade ve tekil adlar.',
    'En fazla 20 madde. Fotoğrafta yiyecek yoksa boş dizi [] döndür.',
  ].join('\n');

  const messages: ProxyMessage[] = [
    { role: 'system', content: system },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Bu fotoğraftaki yenilebilir malzemeleri listele.' },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ];

  const text = await callProxy(messages, 800, { model: VISION_MODEL });
  if (!text.trim()) throw new Error('AI boş yanıt döndürdü.');

  const arr = extractJsonArray(text);
  return arr
    .map((x: any) => String(x).trim())
    .filter(Boolean)
    .slice(0, 20);
}

/** Beslenme/fitness koçu olarak sohbet eder. */
export async function chefChat(history: ChatMessage[], ctx?: AIContext): Promise<string> {
  const system = [
    'Sen FrozFit uygulamasının samimi, kısa ve net konuşan beslenme & fitness koçusun.',
    'Türkçe yanıt ver. Tıbbi teşhis koymazsın; genel sağlıklı yaşam önerileri verirsin.',
    'Yanıtları kısa tut (gerekmedikçe 4-5 cümleyi geçme).',
    contextLines(ctx),
  ]
    .filter(Boolean)
    .join('\n');

  return chat([{ role: 'system', content: system }, ...history]);
}
