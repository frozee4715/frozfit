/**
 * FrozFit Cloud Functions — AI proxy (Gemini + OpenRouter).
 *
 * Tüm AI anahtarları SUNUCUDA (Firebase Secret) tutulur, istemciye gömülmez.
 * İstemci yalnızca giriş yapmış kullanıcılarla `aiChat` callable'ını çağırır.
 *
 * Akış (maliyet için): önce Gemini API (ücretsiz katman), dolduğunda/başarısız
 * olduğunda OpenRouter yedek model zinciri.
 *
 * Anahtarları ayarlamak için:
 *   firebase functions:secrets:set GEMINI_API_KEY
 *   firebase functions:secrets:set OPENROUTER_API_KEY
 * Deploy:
 *   firebase deploy --only functions
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp, getApps } = require('firebase-admin/app');

if (!getApps().length) initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

// Bölge + makul kaynak sınırları (maliyet kontrolü).
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

// ── OpenRouter ──────────────────────────────────────────────────────────────
const OR_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const FALLBACK_MODELS = [
  'google/gemini-2.5-flash',
  'openai/gpt-4o-mini',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

// ── Gemini ────────────────────────────────────────────────────────────────
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash';

const TIMEOUT_MS = 45000;
const MAX_OUTPUT_TOKENS = 4000;

/** AbortController ile zaman aşımlı fetch. */
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    const err = new Error(e && e.name === 'AbortError' ? 'timeout' : 'network');
    err.retryable = true;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Gemini çağrısı ──────────────────────────────────────────────────────────

/**
 * OpenRouter biçimindeki mesajları ({role, content:string|parts[]}) Gemini
 * `contents` + `systemInstruction` biçimine çevirir. Görsel için data URL →
 * inline_data dönüşümü yapılır.
 */
function toGemini(messages) {
  let systemInstruction;
  const contents = [];
  for (const m of messages) {
    if (m.role === 'system') {
      const text = typeof m.content === 'string' ? m.content : '';
      if (text) systemInstruction = { parts: [{ text }] };
      continue;
    }
    const role = m.role === 'assistant' ? 'model' : 'user';
    if (typeof m.content === 'string') {
      contents.push({ role, parts: [{ text: m.content }] });
    } else if (Array.isArray(m.content)) {
      const parts = m.content.map((p) => {
        if (p && p.type === 'text') return { text: p.text };
        if (p && p.type === 'image_url') {
          const url = (p.image_url && p.image_url.url) || '';
          const match = url.match(/^data:([^;]+);base64,(.+)$/);
          if (match) return { inline_data: { mime_type: match[1], data: match[2] } };
        }
        return { text: '' };
      });
      contents.push({ role, parts });
    }
  }
  return { systemInstruction, contents };
}

/** Gemini API'ye istek atar. Başarısızsa retryable bilgisiyle fırlatır. */
async function callGemini(apiKey, messages, maxTokens) {
  const { systemInstruction, contents } = toGemini(messages);
  const body = { contents, generationConfig: { maxOutputTokens: maxTokens } };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const res = await fetchWithTimeout(`${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = new Error(`gemini_${res.status}`);
    // 400/401/403 kalıcı (anahtar/istek sorunu); 429/5xx → yedeğe geç.
    err.retryable = res.status !== 400 && res.status !== 401 && res.status !== 403;
    throw err;
  }

  const data = await res.json().catch(() => null);
  const text =
    data && data.candidates && data.candidates[0] && data.candidates[0].content &&
    data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;
  if (!text || !text.trim()) {
    const err = new Error('empty');
    err.retryable = true;
    throw err;
  }
  return text;
}

// ── OpenRouter çağrısı ──────────────────────────────────────────────────────

/** Tek bir OpenRouter modeline istek atar. Geçici hatalarda retryable=true. */
async function callOpenRouter(apiKey, model, messages, maxTokens) {
  const res = await fetchWithTimeout(OR_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://frozfit.app',
      'X-Title': 'FrozFit',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = new Error(`http_${res.status}`);
    // 401/403 kalıcı (anahtar sorunu); 429/404/5xx → başka model dene.
    err.retryable = res.status !== 401 && res.status !== 403;
    throw err;
  }

  const data = await res.json().catch(() => null);
  const msg = data && data.choices && data.choices[0] && data.choices[0].message;
  const content =
    (msg && typeof msg.content === 'string' && msg.content.trim() && msg.content) ||
    (msg && typeof msg.reasoning === 'string' && msg.reasoning.trim() && msg.reasoning) ||
    '';
  if (!content.trim()) {
    const err = new Error('empty');
    err.retryable = true;
    throw err;
  }
  return content;
}

exports.aiChat = onCall({ secrets: [GEMINI_API_KEY, OPENROUTER_API_KEY] }, async (request) => {
  // Yalnızca giriş yapmış kullanıcılar (misafir/anonim dahil) çağırabilir.
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmalısın.');
  }

  const data = request.data || {};
  const messages = data.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new HttpsError('invalid-argument', 'Geçersiz istek (messages eksik).');
  }

  const maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.max(1, Number(data.maxTokens) || 1200));

  const geminiKey = GEMINI_API_KEY.value();
  const openRouterKey = OPENROUTER_API_KEY.value();
  if (!geminiKey && !openRouterKey) {
    throw new HttpsError('failed-precondition', 'Sunucuda AI anahtarı ayarlı değil.');
  }

  let lastRetryable = false;

  // 1) Gemini (ücretsiz katman) — birincil.
  if (geminiKey) {
    try {
      return { content: await callGemini(geminiKey, messages, maxTokens) };
    } catch (e) {
      if (e && e.retryable === false) {
        // Anahtar/istek kalıcı hatası: OpenRouter varsa ona düş, yoksa hata ver.
        if (!openRouterKey) throw new HttpsError('internal', 'Gemini anahtarı sunucuda geçersiz görünüyor.');
      } else {
        lastRetryable = true;
      }
    }
  }

  // 2) OpenRouter yedek model zinciri.
  if (openRouterKey) {
    const requested =
      typeof data.model === 'string' && data.model.trim() ? data.model.trim() : DEFAULT_MODEL;
    const models = [...new Set([requested, ...FALLBACK_MODELS])];
    for (const model of models) {
      try {
        return { content: await callOpenRouter(openRouterKey, model, messages, maxTokens) };
      } catch (e) {
        if (e && e.retryable === false) {
          throw new HttpsError('internal', 'AI anahtarı sunucuda geçersiz görünüyor.');
        }
        lastRetryable = true;
        // sıradaki modele geç
      }
    }
  }

  throw new HttpsError(
    'unavailable',
    lastRetryable
      ? 'AI modelleri şu an yoğun. Birkaç saniye sonra tekrar dene.'
      : 'AI yanıtı alınamadı. Tekrar dene.',
  );
});

// NOT: Premium ve kredi artışı yalnızca güvenli yollarla yapılır:
// - Premium: RevenueCat satın alma (istemci entitlement) + ileride RevenueCat
//   webhook → Firestore senkronu. İstemci isPremium'ı doğrudan yazamaz (Firestore kuralı).
// - Kredi: yalnızca azaltılabilir; artırmanın tek yolu Premium'dur (reklam kaldırıldı).
