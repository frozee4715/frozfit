# FrozFit AI Proxy — Cloudflare Worker

AI anahtarlarını (Gemini + OpenRouter) **sunucuda** saklayan güvenli proxy.
Anahtarlar uygulamaya (telefona) **hiç gömülmez**. Sadece geçerli bir Firebase
oturumu olan kullanıcılar çağırabilir (Worker, Firebase ID token'ını doğrular).

- **Kart gerekmez.** Cloudflare Workers ücretsiz katman: günde 100.000 istek.
- Akış: önce **Gemini** (ücretsiz katman), dolduğunda **OpenRouter** yedek zinciri.

## Kurulum (tek seferlik)

Bu klasörde (`cloudflare-worker/`):

```bash
# 1) Cloudflare hesabına giriş (tarayıcı açılır, izin ver)
npx wrangler login

# 2) Gizli anahtarları sunucuya koy (her komut anahtarı sorar, yapıştır + Enter)
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put OPENROUTER_API_KEY

# 3) Yayınla
npx wrangler deploy
```

Deploy bitince şuna benzer bir adres verir:

```
https://frozfit-ai-proxy.<senin-subdomainin>.workers.dev
```

Bu adresi uygulamanın `.env` dosyasındaki `EXPO_PUBLIC_AI_PROXY_URL` değerine yapıştır.

## Güncelleme

Kodu değiştirince yeniden yayınla:

```bash
npx wrangler deploy
```

Bir anahtarı değiştirmek için tekrar `npx wrangler secret put <AD>` çalıştır.

## Yapılandırma

- `wrangler.toml` → `FIREBASE_PROJECT_ID` token doğrulaması için (gizli değil).
- Gizli anahtarlar `wrangler secret put` ile ayarlanır, dosyaya yazılmaz.

## Test (logları canlı izle)

```bash
npx wrangler tail
```

## Notlar

- Worker yalnızca `POST` kabul eder; `Authorization: Bearer <Firebase ID token>` ister.
- İstek gövdesi: `{ "messages": [...], "maxTokens": 1200, "model"?: "..." }`.
- Yanıt: `{ "content": "..." }` veya hata: `{ "error": "..." }`.
