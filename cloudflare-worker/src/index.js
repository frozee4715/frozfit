/**
 * FrozFit AI Proxy — Cloudflare Worker.
 *
 * AI anahtarları (Gemini, OpenRouter) SUNUCUDA (Worker Secret) tutulur, istemciye
 * gömülmez. Yalnızca geçerli bir Firebase ID token'ı olan (giriş yapmış) kullanıcılar
 * çağırabilir. Akış (maliyet için): önce Gemini API (ücretsiz katman), başarısız/dolu
 * olduğunda OpenRouter yedek model zinciri.
 *
 * Secret ayarlamak için (cloudflare-worker/ klasöründe):
 *   npx wrangler secret put GEMINI_API_KEY
 *   npx wrangler secret put OPENROUTER_API_KEY
 * Deploy:
 *   npx wrangler deploy
 *
 * env değişkenleri:
 *   FIREBASE_PROJECT_ID  (wrangler.toml [vars]) — token doğrulaması için, gizli değil
 *   GEMINI_API_KEY       (secret)
 *   OPENROUTER_API_KEY   (secret)
 */

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

// ── CORS ──────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ── Firebase ID token doğrulama (RS256, JWKS) ─────────────────────────────────

let jwksCache = { keys: null, exp: 0 };

async function getJwks() {
  const now = Date.now();
  if (jwksCache.keys && now < jwksCache.exp) return jwksCache.keys;
  const res = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  );
  if (!res.ok) throw new Error('jwks_fetch_failed');
  const data = await res.json();
  const cc = res.headers.get('cache-control') || '';
  const m = cc.match(/max-age=(\d+)/);
  const maxAge = m ? parseInt(m[1], 10) : 3600;
  jwksCache = { keys: data.keys || [], exp: now + maxAge * 1000 };
  return jwksCache.keys;
}

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += '='.repeat(pad);
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlToString(s) {
  return new TextDecoder().decode(b64urlToBytes(s));
}

/** Firebase ID token'ı imza + claim olarak doğrular; geçersizse hata fırlatır. */
async function verifyFirebaseToken(token, projectId) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('bad_token');

  const header = JSON.parse(b64urlToString(parts[0]));
  const payload = JSON.parse(b64urlToString(parts[1]));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('bad_header');

  const keys = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('no_key');

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sig = b64urlToBytes(parts[2]);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, signed);
  if (!ok) throw new Error('bad_sig');

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new Error('expired');
  if (typeof payload.iat === 'number' && payload.iat > now + 300) throw new Error('bad_iat');
  if (payload.aud !== projectId) throw new Error('bad_aud');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('bad_iss');
  if (!payload.sub) throw new Error('bad_sub');

  return payload;
}

// ── AI çağrıları ─────────────────────────────────────────────────────────────

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

/** Gemini → OpenRouter zinciriyle yanıt üretir. */
async function runAiChain(env, messages, maxTokens, requestedModel) {
  const geminiKey = env.GEMINI_API_KEY;
  const openRouterKey = env.OPENROUTER_API_KEY;
  if (!geminiKey && !openRouterKey) {
    const err = new Error('Sunucuda AI anahtarı ayarlı değil.');
    err.status = 503;
    throw err;
  }

  let lastRetryable = false;

  // 1) Gemini (ücretsiz katman) — birincil.
  if (geminiKey) {
    try {
      return await callGemini(geminiKey, messages, maxTokens);
    } catch (e) {
      if (e && e.retryable === false) {
        if (!openRouterKey) {
          const err = new Error('Gemini anahtarı sunucuda geçersiz görünüyor.');
          err.status = 500;
          throw err;
        }
      } else {
        lastRetryable = true;
      }
    }
  }

  // 2) OpenRouter yedek model zinciri.
  if (openRouterKey) {
    const requested =
      typeof requestedModel === 'string' && requestedModel.trim() ? requestedModel.trim() : DEFAULT_MODEL;
    const models = [...new Set([requested, ...FALLBACK_MODELS])];
    for (const model of models) {
      try {
        return await callOpenRouter(openRouterKey, model, messages, maxTokens);
      } catch (e) {
        if (e && e.retryable === false) {
          const err = new Error('AI anahtarı sunucuda geçersiz görünüyor.');
          err.status = 500;
          throw err;
        }
        lastRetryable = true;
      }
    }
  }

  const err = new Error(
    lastRetryable
      ? 'AI modelleri şu an yoğun. Birkaç saniye sonra tekrar dene.'
      : 'AI yanıtı alınamadı. Tekrar dene.',
  );
  err.status = 503;
  throw err;
}

// ── Worker giriş noktası ─────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Yalnızca POST.' }, 405);
    }

    // Yetki: Authorization: Bearer <Firebase ID token>
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return json({ error: 'Bu işlem için giriş yapmalısın.' }, 401);
    }

    const projectId = env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      return json({ error: 'Sunucu yapılandırması eksik.' }, 503);
    }
    try {
      await verifyFirebaseToken(token, projectId);
    } catch {
      return json({ error: 'Oturum doğrulanamadı. Tekrar giriş yap.' }, 401);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ error: 'Geçersiz istek gövdesi.' }, 400);
    }

    const messages = data && data.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Geçersiz istek (messages eksik).' }, 400);
    }
    const maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.max(1, Number(data.maxTokens) || 1200));

    try {
      const content = await runAiChain(env, messages, maxTokens, data.model);
      return json({ content });
    } catch (e) {
      return json({ error: e.message || 'AI yanıtı alınamadı.' }, e.status || 503);
    }
  },
};

// NOT: Premium ve kredi artışı yalnızca güvenli yollarla yapılır:
// - Premium: RevenueCat satın alma (istemci entitlement) + ileride RevenueCat
//   webhook → Firestore senkronu. İstemci isPremium'ı doğrudan yazamaz (Firestore kuralı).
// - Kredi: yalnızca azaltılabilir; artırmanın tek yolu Premium'dur (reklam kaldırıldı).
