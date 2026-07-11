/**
 * Worker'dan Firestore'a YÖNETİCİ erişimi (REST + servis hesabı).
 *
 * NEDEN: Kredi ödülünü istemci veremez — Firestore kuralı `notIncreasingCredits`
 * kullanıcının kendi `aiCredits` alanını artırmasını bilerek engelliyor (yoksa
 * herkes kendine sonsuz kredi yazardı). Davet ödülünü dağıtacak güvenilir taraf
 * sunucu olmak zorunda. Servis hesabıyla yapılan yazmalar kuralları atlar.
 *
 * Kurulum (bir kez):
 *   Firebase Console → Proje ayarları → Hizmet hesapları → "Yeni özel anahtar üret"
 *   İnen JSON'u olduğu gibi secret'a koy:
 *     npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/datastore';

// Erişim jetonu 1 saat geçerli; her istekte yeniden üretmek pahalı (RSA imzası +
// ağ turu). Isolate ömrü boyunca önbellekle.
let tokenCache = { token: null, exp: 0 };

function b64url(bytes) {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** PEM (PKCS8) özel anahtarı WebCrypto anahtarına çevirir. */
async function importKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const raw = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    raw,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/** Servis hesabıyla OAuth erişim jetonu alır (JWT-bearer akışı). */
async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && now < tokenCache.exp - 60) return tokenCache.token;

  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = b64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      }),
    ),
  );

  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  const assertion = `${header}.${payload}.${b64url(sig)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error('firestore_auth_failed');

  const data = await res.json();
  tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return tokenCache.token;
}

function docBase(projectId) {
  return `projects/${projectId}/databases/(default)/documents`;
}

/** Firestore değerini sade JS değerine çevirir (ihtiyacımız olan tipler kadar). */
function fromValue(v) {
  if (!v) return undefined;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  return undefined;
}

/** Belgeyi okur; yoksa null döner. */
export async function getDoc(env, path) {
  const token = await getAccessToken(env);
  const res = await fetch(
    `https://firestore.googleapis.com/v1/${docBase(env.FIREBASE_PROJECT_ID)}/${path}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('firestore_read_failed');

  const data = await res.json();
  const out = {};
  for (const [k, v] of Object.entries(data.fields || {})) out[k] = fromValue(v);
  return out;
}

/**
 * Birden çok yazmayı TEK ATOMİK commit'te uygular. Ya hepsi olur ya hiçbiri.
 * Davet ödülünde kritik: "bozdurma kaydı"nın oluşturulmasıyla kredilerin
 * artması aynı işlemde olmalı, yoksa aynı kod iki kez bozdurulabilir.
 *
 * writes: Firestore REST `writes` dizisi.
 * Çakışma (ör. belge zaten var) → FAILED_PRECONDITION → `conflict` hatası.
 */
export async function commit(env, writes) {
  const token = await getAccessToken(env);
  const res = await fetch(
    `https://firestore.googleapis.com/v1/${docBase(env.FIREBASE_PROJECT_ID)}:commit`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    // Firestore, `currentDocument.exists=false` kısıtı ihlal edilince
    // 409 ALREADY_EXISTS döner (400 değil — ölçtük). Yarış koşulunda ikinci
    // isteğin düştüğü yer burasıdır ve kullanıcıya anlamlı mesaj dönmesi gerekir.
    if (res.status === 409 || /ALREADY_EXISTS|already exists|FAILED_PRECONDITION/i.test(body)) {
      const err = new Error('conflict');
      err.conflict = true;
      throw err;
    }
    throw new Error('firestore_write_failed');
  }
  return res.json();
}

/** `path` belgesindeki sayısal alanları artıran bir write üretir. */
export function increment(env, path, fields) {
  return {
    transform: {
      document: `${docBase(env.FIREBASE_PROJECT_ID)}/${path}`,
      fieldTransforms: Object.entries(fields).map(([fieldPath, by]) => ({
        fieldPath,
        increment: { integerValue: String(by) },
      })),
    },
  };
}

/** `path` belgesine alan yazan (merge) bir write üretir. */
export function setFields(env, path, fields, mustNotExist = false) {
  const write = {
    update: {
      name: `${docBase(env.FIREBASE_PROJECT_ID)}/${path}`,
      fields: Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [
          k,
          typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) },
        ]),
      ),
    },
    updateMask: { fieldPaths: Object.keys(fields) },
  };
  // Yalnızca belge YOKSA yazılsın: çakışmayı Firestore'a atomik olarak doğrulatır.
  if (mustNotExist) write.currentDocument = { exists: false };
  return write;
}
