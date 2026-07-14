# FrozFit — Google Play Yayın Dosyası

Android için **ilk yayın**. Uygulama daha önce hiç Android'de build alınmadı.
Bu doküman Play Console'a girilecek her şeyi + senin konsollarda yapman gereken
adımları içerir.

> **Package (kalıcı, asla değişmez):** `com.frozesoftware.frozfit`
> iOS bundle ID'den (`com.frozfit.app`) **farklı** — bu normaldir, iki mağaza ayrı kimlik uzayı.

---

## 0) Build öncesi kurulum — ✅ TAMAMLANDI (2026-07-14)

| Adım | Durum |
|---|---|
| EAS Android keystore + SHA-1 | ✅ `14:A1:80:9A:AF:E4:F4:9E:AC:1A:F5:8D:8B:CD:CC:B2:45:D3:14:81` |
| Firebase Android app (Android OAuth client oluştu) | ✅ |
| `google-services.json` → EAS'e **dosya değişkeni** olarak yüklendi | ✅ |
| RevenueCat Play app + `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | ✅ EAS production'da |

### ⚠️ `google-services.json` + `app.config.js` — dikkat, tuzak var

Bu dosya `.gitignore`'da (gizli tutulmalı). Ama **EAS Build yalnızca git'in izlediği
dosyaları yükler** — bu yüzden ilk build `"google-services.json" is missing` ile düştü.

Çözüm iki parçalı:

**1) Dosyayı EAS'e "file" tipi ortam değişkeni olarak yükle:**

```bash
npx eas env:create --environment production \
  --name GOOGLE_SERVICES_JSON --type file \
  --value ./google-services.json --visibility sensitive
```

EAS, build sırasında dosyayı proje dışına yazar ve **mutlak yolunu** değişkene koyar.

**2) Config'in bu değişkeni JS ile okuması gerekir → `app.config.js`**

```js
android: {
  googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
}
```

> 🚨 **ÇALIŞMAYAN yol:** statik `app.json` içine `"googleServicesFile": "$GOOGLE_SERVICES_JSON"`
> yazmak. JSON'da değişken genişletme **yoktur** — Expo bu metni birebir dosya yolu sanır
> (`path.resolve` ile) ve build yine "google-services.json is missing" der. Biz bu hatayı
> bir build harcayarak öğrendik.
>
> Bu yüzden `app.json` **silindi**, yerine `app.config.js` geldi (tüm ayarlar taşındı,
> config çıktısı birebir aynı olacak şekilde doğrulandı).

> Yerel çalışma için `.env` içinde `GOOGLE_SERVICES_JSON="./google-services.json"` var.
> **Dosyayı asla git'e commit etme** — EAS şifreli tutuyor.

---

## 0-B) Referans — bu adımlar nasıl yapıldı

<details>
<summary>Tekrar gerekirse aç (ör. keystore değişirse)</summary>

### 0.1 Firebase → Android uygulaması ekle + SHA-1

Google ile giriş, Android'de imza sertifikasının parmak izine bağlıdır. EAS senin
adına bir keystore üretir; onun SHA-1'ini Firebase'e vermen gerekir.

```bash
cd frozfit

# 1) EAS Android keystore'u üret (ilk sefer sorar → "Generate new keystore" seç)
npx eas credentials --platform android

# 2) Üretilen keystore'un SHA-1'ini oku
#    (yukarıdaki menüde: Keystore → "Download credentials" / SHA-1 fingerprint görünür)
```

Sonra **Firebase Console** → `fitaiapp-de146` projesi → ⚙️ Project settings → **Your apps**
→ **Add app** → **Android**:

| Alan | Değer |
|---|---|
| Android package name | `com.frozesoftware.frozfit` |
| App nickname | FrozFit Android |
| Debug signing certificate SHA-1 | *(EAS'ten aldığın SHA-1)* |

→ **google-services.json** indir → `frozfit/google-services.json` olarak kaydet.
(`.gitignore`'a eklendi, commit edilmeyecek.)

> ⚠️ Play **App Signing** kullanıyorsan (varsayılan ve önerilen), Play kendi imza
> anahtarıyla yeniden imzalar. Play Console → Setup → **App integrity** → App signing
> bölümündeki **SHA-1'i de** Firebase'e ekle. **İkisi de gerekli** — yoksa
> mağazadan indiren kullanıcılarda Google ile giriş çalışmaz (bu çok sık yapılan hata).

### 0.2 Google Cloud → Android OAuth client

Google Cloud Console → APIs & Services → Credentials → **Create credentials** →
**OAuth client ID** → **Android**:

- Package name: `com.frozesoftware.frozfit`
- SHA-1: yukarıdaki ile aynı (hem EAS hem Play App Signing SHA-1'i için birer tane)

> Kodda ayrıca bir `ANDROID_CLIENT_ID` env'ine gerek **yok** — `social-auth.ts`
> Android'de sadece `webClientId` kullanır (mevcut, ayarlı ✓). Android OAuth client'ın
> varlığı yine de Google tarafında zorunlu.

### 0.3 RevenueCat → Play Store app + Android API key

Pro aboneliğin Android'de çalışması için:

1. Play Console → **Monetize** → **Subscriptions** → iOS'takiyle aynı ürünleri oluştur
   (ürün ID'leri iOS'takiyle aynı olabilir, tavsiye edilir).
2. Play Console → **Users and permissions** → RevenueCat için servis hesabına
   finansal veri erişimi ver (RevenueCat dokümanı adım adım anlatır).
3. RevenueCat → projene **Play Store app** ekle → package `com.frozesoftware.frozfit`
   → entitlement **`pro`**'ya bağla (iOS'takiyle aynı entitlement).
4. RevenueCat → **API Keys** → *Google Play* public key'ini kopyala (`goog_...`).
5. EAS'e ekle:

```bash
npx eas env:create --environment production \
  --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY \
  --value goog_XXXXXXXXXXXX --visibility sensitive
```

> Bu anahtar olmadan uygulama çalışır ama **Pro satın alma Android'de sessizce kapalı**
> olur (`purchases.ts` → `platformKey()` undefined döner → `isPurchasesSupported()` false).
> ✅ Eklendi.

</details>

---

## 1) Play Console → Uygulama oluştur

Play Console → **Create app**:

| Alan | Değer |
|---|---|
| App name | `FrozFit` |
| Default language | Türkçe (tr-TR) |
| App or game | App |
| Free or paid | **Free** (Pro ayrı abonelik) |

---

## 2) Store Listing (Mağaza kaydı)

### Kısa açıklama (Short description — 80 karakter sınırı)
```
Yapay zekâ şefin, kalori takibin ve antrenman planın tek uygulamada.
```

### Tam açıklama (Full description — 4000 karakter sınırı)
```
FrozFit, cebindeki yapay zekâ destekli beslenme ve fitness koçudur. Kalori saymayı, tarif bulmayı ve antrenman takibini tek bir yerde, sade ve keyifli bir deneyimle birleştirir.

YAPAY ZEKÂ ŞEF
• Elindeki malzemeleri yaz, sana özel tarif üretsin
• Buzdolabını tara, yapay zekâ ne pişirebileceğini söylesin
• Yemeğinin fotoğrafını çek, kalori ve makroları otomatik tahmin etsin
• Diyetine, alerjilerine ve hedefine göre kişiselleşen öneriler

KALORİ VE MAKRO TAKİBİ
• Öğün ekle, günlük kalori/protein/karbonhidrat/yağ dengeni gör
• Barkod tarayarak binlerce ürünü hızlıca ekle
• Su takibi ve günlük hedef halkaları
• Haftalık ve aylık grafiklerle ilerlemeni izle

KİŞİSEL PLAN
• Boy, kilo, yaş ve hedefine göre bilimsel kalori/makro planı
• Kilo verme, kas kazanma veya koruma hedefleri
• Kilo geçmişi ve trend grafiği

ANTRENMAN
• Telifsiz egzersiz gösterimleri ve günlük antrenman
• Yaktığın kaloriyi hesapla, net kalori dengeni gör
• Haftalık meydan okumalar ve başarı rozetleri

TOPLULUK
• Kendi tariflerini paylaş, başkalarınınkini keşfet
• Beğen, takip et, ilham al

FROZFIT PRO
• Günde 40 yapay zekâ işlemi (adil kullanım) — kredi derdi yok
• Haftalık AI yemek planı
• Gelişmiş analizler ve özel temalar
Pro, otomatik yenilenen bir aboneliktir. Dilediğin zaman iptal edebilirsin.

Sağlıkla, lezzetle ve motivasyonla hedefine ulaş. FrozFit ile bugün başla.

FrozFit bir sağlık/beslenme bilgilendirme aracıdır, tıbbi tavsiye yerine geçmez. Beslenme veya sağlık kararların için bir uzmana danış.
```

### Grafik varlıklar (Graphics) — ✅ ÜRETİLDİ

`node store-assets/make-screenshots.js` çalıştırıldı; hepsi `store-assets/out/` altında:

| Varlık | Boyut | Dosya |
|---|---|---|
| **App icon** | 512 × 512, **alfasız** | `play-icon-512.png` |
| **Feature graphic** | **1024 × 500**, alfasız | `play-feature-graphic.png` |
| **Telefon ekran görüntüleri** (4 adet) | 1080 × 1920 (9:16) | `android-01.png` … `android-04.png` |
| Tablet görüntüsü | — | Gerekmez (`supportsTablet: false`) |

> Play, ikon ve feature graphic'te **şeffaflık (alfa kanalı) istemez** — ikisi de düzleştirildi.
> Yeniden üretmek için: `npm install sharp --no-save && node store-assets/make-screenshots.js`
> (`sharp` yalnızca bu script için gerekli, uygulama bağımlılığı değil.)

### Kategorizasyon

| Alan | Değer |
|---|---|
| App category | **Health & Fitness** |
| Tags | kalori, beslenme, fitness, antrenman |
| Email | *(destek e-postan)* |
| Privacy Policy URL | `https://frozee4715.github.io/frozfit/privacy.html` |

---

## 3) Play Console → App content (Zorunlu beyanlar)

Bunlar doldurulmadan yayına gönderemezsin.

### 3.1 Data safety (Play'in "veri güvenliği" formu)

iOS App Privacy formunun Play karşılığı. Aynı gerçekler:

| Veri tipi | Toplanıyor | Paylaşılıyor | Amaç | Şifreli aktarım |
|---|---|---|---|---|
| Kişisel → E-posta | Evet | Hayır | Hesap yönetimi | Evet |
| Kişisel → Ad | Evet | Hayır | Hesap yönetimi | Evet |
| Sağlık → Sağlık bilgisi (kilo, boy, kalori hedefi) | Evet | Hayır | Uygulama işlevi | Evet |
| Sağlık → Fitness bilgisi (antrenman) | Evet | Hayır | Uygulama işlevi | Evet |
| Fotoğraf ve video → Fotoğraflar | Evet | **Evet** (AI işlemcileri) | Uygulama işlevi | Evet |
| Uygulama içi mesajlar → Diğer (AI sohbeti) | Evet | **Evet** (AI işlemcileri) | Uygulama işlevi | Evet |
| Uygulama etkinliği → Diğer kullanıcı içeriği (tarifler) | Evet | Hayır | Uygulama işlevi | Evet |
| Finansal → Satın alma geçmişi | Evet | Hayır | Uygulama işlevi | Evet |

**Kritik farklar (iOS formundan):**
- Play, "**shared** (üçüncü tarafa aktarılıyor)" ile "collected"ı ayırır. Yemek/buzdolabı
  fotoğrafları ve AI sohbeti Gemini/OpenRouter'a gidiyor → bunlar **"Shared" = YES**.
  Bunu gizlersen Play uygulamayı **askıya alır**. Gizlilik politikasında zaten yazılı ✓
- "Veriler silinebiliyor mu?" → hesap silme akışı varsa **Yes** (Play artık **hesap silme
  yolu zorunlu** kılıyor — uygulama içinde ve web'de).
- Tümü için "Data is encrypted in transit" = **Yes** (HTTPS ✓).

### 3.2 Hesap silme (Account deletion) — ✅ ÇÖZÜLDÜ (2026-07-14)

Play, hesap oluşturan uygulamalarda hem **uygulama içinde** hem de **web üzerinden
erişilebilir** bir hesap silme yolu ister.

⚠️ **Bulgu:** `deleteAccount()` mantığı `auth-context.tsx`'te vardı ama **hiçbir ekrana
bağlı değildi** — yani kullanıcı hesabını silemiyordu. Bu, hem Play hem App Store için
ret sebebiydi.

**Yapılan:**
- **Uygulama içi:** Profil sekmesi → **"Hesabı sil"** eklendi (onay sayfası + e-posta/şifre
  hesaplarında şifre doğrulaması; Google/Apple girişlerinde şifre sorulmaz).
  Dosya: `src/app/(tabs)/profile.tsx`, metinler `src/lib/i18n.tsx` (TR+EN).
- **Web:** `docs/site/delete-account.html` — hangi verilerin silindiği, neyin saklandığı
  (satın alma kayıtları) ve 30 günlük üst sınır açıkça yazılı.

**Data safety formuna girilecek URL:**
`https://frozee4715.github.io/frozfit/delete-account.html`

> ⚠️ Sayfanın GitHub Pages'te **canlı** olduğunu doğrula — Play URL'i açıp kontrol ediyor.

### 3.3 Content rating (İçerik derecelendirme anketi)

iOS'takiyle aynı dürüst cevaplar. IARC anketi:
- Şiddet, cinsellik, küfür, kumar, madde → **Hayır**
- **Kullanıcı tarafından oluşturulan içerik (UGC) → EVET** (topluluk tarifleri + AI sohbeti)
  - Play, UGC varsa **bildirme/engelleme mekanizması** ve **moderasyon** sorar.
  - ✓ Bunlar kodda **var** (rapor + engelle + engellenen kullanıcılar ekranı — 2026-07-09'da eklendi).

### 3.4 Diğer beyanlar

| Beyan | Cevap |
|---|---|
| Ads (reklam var mı) | **Hayır** (reklam ağı yok) |
| Target audience | 13+ (çocuklara yönelik **değil**) |
| News app | Hayır |
| COVID-19 contact tracing | Hayır |
| Government app | Hayır |
| **Health apps declaration** | ⚠️ Play sağlık/fitness uygulamalarında ek beyan isteyebilir — "tıbbi tavsiye değildir" notu açıklamada var ✓ |
| Financial features | Hayır (abonelik hariç) |

---

## 4) İzinler (Permissions)

`app.json` → Android'de istenen izinler:

| İzin | Neden | Play'e açıklama |
|---|---|---|
| `CAMERA` | Barkod tarama + yemek/buzdolabı fotoğrafı | Kullanıcı fotoğraf çekerek kalori tahmini ve barkod taraması yapar |
| `RECORD_AUDIO` | ⚠️ **Gözden geçir** | expo-camera varsayılan olarak ekler. Uygulama **video kaydetmiyorsa gereksiz** — Play hassas izinlerde gerekçe ister. Kaldırılması önerilir. |

> **Öneri:** Mikrofon gerçekten kullanılmıyorsa `app.json`'dan `RECORD_AUDIO`'yu ve
> expo-camera'nın `microphonePermission` metnini kaldır. Gereksiz hassas izin =
> gereksiz inceleme sürtünmesi.

---

## 5) Build al

```bash
cd frozfit

# 0.1–0.3 adımları BİTTİKTEN sonra (google-services.json + RevenueCat Android key)
npx eas build --platform android --profile production
```

Bu bir **AAB** (Android App Bundle) üretir — Play'in istediği format.

> `production` profilinde `autoIncrement: true` var → `versionCode` otomatik artar.
> `appVersionSource: "remote"` → sürüm EAS sunucusunda tutulur.

**İlk yükleme MANUEL olmalı:** Play yeni bir uygulamada API ile yüklemeye izin vermez.
İlk AAB'yi Play Console'dan elle yükle. Sonraki sürümlerde `--auto-submit` çalışır.

---

## 6) Yayın akışı

1. **0.1 / 0.2 / 0.3** tamamla (Firebase SHA-1, OAuth client, RevenueCat Android key)
2. Play Console → uygulama oluştur (§1)
3. Store listing + grafikler (§2) — **feature graphic 1024×500 üretilmeli**
4. App content beyanları (§3) — **hesap silme yolunu doğrula**
5. `eas build --platform android --profile production`
6. AAB'yi Play Console'a **elle** yükle → **Internal testing** kanalı
7. **Kendi telefonunda test et** — giriş, AI, Pro satın alma, kamera
8. Sorun yoksa → **Promote to Production** → incelemeye gönder

> **Neden internal testing?** Bu uygulama Android'de hiç çalıştırılmadı. Google
> uygulamayı gerçekten açıp deniyor; çöken veya girişi çalışmayan uygulamayı reddediyor
> ve yeni hesaplarda red, hesabın itibarını etkiliyor. Internal test **aynı AAB'yi**
> kullanır — prodüksiyona terfi ederken **yeniden build gerekmez**, ekstra gün kaybı yok.

---

## 7) İnceleme süresi

Yeni Play geliştirici hesaplarında ilk inceleme **birkaç gün — 7 güne kadar** sürebilir
(Apple'dan yavaş). Ayrıca yeni kişisel hesaplarda Google, yayından önce **20 test
kullanıcısıyla 14 gün kapalı test** şartı arayabilir — hesap türüne bağlı, Play Console
sana söyler.

---

## 8) Yapılan değişiklikler (2026-07-14)

**Yapılandırma**
- **`app.json` → `app.config.js`** (silindi/taşındı). Sebep: `googleServicesFile`'ın
  `process.env`'den okunması gerekiyor, statik JSON bunu yapamıyor (bkz. §0 tuzak notu).
  Tüm ayarlar taşındı; config çıktısının birebir aynı olduğu doğrulandı.
- `android.package = "com.frozesoftware.frozfit"` (kalıcı kimlik)
- **`RECORD_AUDIO` izni kaldırıldı** — kodda mikrofon/video kaydı hiç kullanılmıyor
  (`grep`: `recordAsync`/`Audio.` sıfır sonuç), ama `expo-camera` bu izni manifest'e
  otomatik enjekte ediyordu. `blockedPermissions` ile siliniyor (`tools:node="remove"`).
  Gereksiz hassas izin = gereksiz Play inceleme sürtünmesi.
- `eas.json` → `submit.production.android` (internal/draft)
- `.gitignore` → `play-service-account.json`, `google-services.json`

**Kod**
- **Hesap silme UI'ı eklendi** (Play + App Store zorunluluğu, eksikti):
  `src/app/(tabs)/profile.tsx` → Profil sekmesinde "Hesabı sil"
  `src/lib/i18n.tsx` → TR + EN metinler

**Varlıklar**
- `store-assets/make-screenshots.js` → Android telefon (1080×1920), Play feature
  graphic (1024×500) ve Play ikonu (512×512, alfasız) üretimi eklendi
- `docs/site/delete-account.html` → web hesap silme sayfası (Play zorunlu)

*Bu doküman `docs/play-store-submission.md`.*
