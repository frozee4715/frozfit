# FrozFit — App Store Yayın Dosyası

Uygulama TestFlight'ta (build 33, v1.0.0). Bu doküman **herkese açık App Store yayını** için App Store Connect'e girilecek her şeyi içerir. Kopyala-yapıştır.

> ASC yolu: https://appstoreconnect.apple.com → Apps → FrozFit → **App Store** sekmesi → **1.0 Prepare for Submission**

---

## 1) Uygulama Bilgileri (App Information)

| Alan | Değer |
|---|---|
| **Name** | `FrozFit` |
| **Subtitle** (30 karakter) | `AI Beslenme & Fitness Koçu` |
| **Bundle ID** | `com.frozfit.app` |
| **SKU** | `frozfit-ios-001` (serbest, kendin belirle) |
| **Primary Category** | Health & Fitness |
| **Secondary Category** | Food & Drink (opsiyonel) |
| **Privacy Policy URL** | `https://frozee4715.github.io/frozfit/privacy.html` |
| **Support URL** | `https://frozee4715.github.io/frozfit/support.html` |
| **Marketing URL** | (opsiyonel, boş bırakılabilir) |

> Not: Support URL için `docs/site/support.html` GitHub Pages'te canlıysa yukarıdaki adres çalışır; değilse Privacy URL'ini destek olarak da kullanabilirsin.

---

## 2) Açıklama Metinleri (Türkçe — birincil dil)

### Promotional Text (170 karakter — sonradan değiştirilebilir)
```
Yapay zekâ şefin, kalori takibin ve antrenman planın tek uygulamada. Fotoğraf çek, tarif al, hedefine ulaş. Ücretsiz başla.
```

### Description (4000 karakter sınırı)
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

### Keywords (100 karakter sınırı — virgülle, boşluksuz)
```
kalori,diyet,beslenme,fitness,antrenman,kilo,protein,makro,tarif,egzersiz,su,ai koç,sağlık
```

### What's New in This Version (Sürüm 1.0.0 notu — kısa, 170 kr altı)
```
Yapay zekâ şef, fotoğraftan kalori tahmini, kalori & makro takibi, antrenman ve topluluk. FrozFit ile hedefine ulaş!
```

---

## 3) Açıklama Metinleri (English — ikinci dil, opsiyonel ama önerilir)

App Store Connect'te sağ üstten dil ekle (English U.S.) ve aşağıyı gir.

### Subtitle
```
AI Nutrition & Fitness Coach
```

### Promotional Text
```
Your AI chef, calorie tracker and workout plan in one app. Snap a photo, get a recipe, hit your goal. Start free.
```

### Description
```
FrozFit is your AI-powered nutrition and fitness coach. It brings calorie tracking, recipe discovery and workout logging together in one clean, delightful experience.

AI CHEF
• Type your ingredients and get a personalized recipe
• Scan your fridge and let AI tell you what to cook
• Snap a photo of your meal for automatic calorie and macro estimates
• Suggestions tailored to your diet, allergies and goals

CALORIE & MACRO TRACKING
• Log meals and see your daily calorie/protein/carb/fat balance
• Scan barcodes to add thousands of products instantly
• Water tracking and daily goal rings
• Weekly and monthly progress charts

PERSONAL PLAN
• Science-based calorie/macro plan from your height, weight, age and goal
• Lose weight, gain muscle or maintain
• Weight history and trend chart

WORKOUTS
• Royalty-free exercise demos and a daily workout
• Estimate calories burned and see your net balance
• Weekly challenges and achievement badges

COMMUNITY
• Share your own recipes and discover others'
• Like, follow and get inspired

FROZFIT PRO
• 40 AI actions per day (fair use) — no credits to manage
• Weekly AI meal plan
• Advanced insights and custom themes
Pro is an auto-renewing subscription. Cancel anytime.

Reach your goal with health, flavor and motivation. Start today with FrozFit.

FrozFit is a health/nutrition information tool and is not a substitute for medical advice. Consult a professional for your health decisions.
```

### Keywords
```
calorie,diet,nutrition,fitness,workout,weight,protein,macro,recipe,exercise,water,ai coach,health
```

### What's New
```
Welcome to FrozFit! Our first release includes: AI chef, photo calorie estimates, fridge scanning, calorie & macro tracking, workouts and community. We'd love your feedback.
```

---

## 4) App Privacy Formu ("Nutrition Label")

> ASC yolu: App → **App Privacy** → Edit. Aşağıdaki veri tiplerini "Yes, we collect" olarak işaretle. Hiçbiri **tracking (izleme)** için kullanılmıyor (uygulamada reklam ağı yok). Çoğu veri hesaba **bağlı (linked)**.

**Genel soru: "Do you or your third-party partners collect data from this app?" → YES**

Toplanan veri tipleri ve amaçları:

| Veri tipi (Apple kategorisi) | Neden topluyoruz | Amaç (Purpose) | Kimliğe bağlı? | İzleme? |
|---|---|---|---|---|
| **Contact Info → Email Address** | Hesap (Firebase Auth) | App Functionality | Evet (Linked) | Hayır |
| **Contact Info → Name** | Apple/Google ile girişte gelen ad | App Functionality | Evet | Hayır |
| **Health & Fitness → Health** | Kilo, boy, yaş, kalori/makro hedefleri | App Functionality | Evet | Hayır |
| **Health & Fitness → Fitness** | Antrenman kayıtları, yakılan kalori | App Functionality | Evet | Hayır |
| **User Content → Photos or Videos** | Yemek/buzdolabı/tarif fotoğrafları (AI analizi + tarif paylaşımı) | App Functionality | Evet | Hayır |
| **User Content → Other User Content** | Paylaşılan tarifler, AI koç sohbeti | App Functionality | Evet | Hayır |
| **Identifiers → User ID** | Firebase kullanıcı kimliği (uid) | App Functionality | Evet | Hayır |
| **Purchases → Purchase History** | Pro abonelik durumu (RevenueCat/App Store) | App Functionality | Evet | Hayır |

Her veri tipi için Apple sorularında **"Used for tracking" = NO** ve genelde **"App Functionality"** amacını seç. Email için istersen "Product Personalization"ı da ekleyebilirsin.

**Önemli açıklama (fotoğraflar):** Yemek/buzdolabı fotoğrafları AI analizi için üçüncü taraf işlemcilere (Google Gemini / OpenRouter, Cloudflare proxy üzerinden) gönderilir ve **kalıcı olarak saklanmaz**. Bu akış zaten gizlilik politikasında yazılı.

---

## 5) Yaş Derecesi Anketi (Age Rating)

> ASC yolu: App → **Age Rating** → Edit / Set Age Rating.

Dürüst cevaplar (çoğu "None/No"):

- Cartoon or Fantasy Violence, Realistic Violence, Sexual Content, Nudity, Profanity, Horror, Gambling, Alcohol/Tobacco/Drugs → **None / No**
- **Medical/Treatment Information** → **None** (uygulama genel beslenme bilgisi verir, tıbbi tedavi değil; açıklamada da "tıbbi tavsiye değildir" notu var)
- **Unrestricted Web Access** → **No**
- **User Generated Content** → **YES** (topluluk tarifleri + AI sohbeti var)

⚠️ **KRİTİK — bkz. §7:** User Generated Content = YES olduğu için Apple 1.2 kuralı gereği rapor/engelle mekanizması ister. Beklenen derece: **12+**.

---

## 6) Ekran Görüntüleri (Screenshots)

**Zorunlu boyutlar (2025 App Store):**
- **6.9" (iPhone 16 Pro Max / 15 Pro Max)** — 1290 × 2796 px — **ZORUNLU**, en az 1 (10'a kadar)
- 6.5" artık 6.9"dan türetilebiliyor ama ayrı yüklemek en güvenlisi: 1284 × 2778 px
- iPad göndermiyorsan (`supportsTablet: true` ama iPad build'i submit etmiyorsan) iPad screenshot'ı zorunlu **değil**, yalnızca iPhone yeterli — ancak `supportsTablet` açıksa Apple iPad'de de çalıştırıp test edebilir. İstersen app.json'da iPad desteğini kapatabiliriz.

**Önerilen 5-6 kare (bu ekranları göster):**
1. **Welcome / açılış** — marka + slogan (ilk izlenim en önemli kare)
2. **AI Şef** — tarif üretimi / öneriler
3. **Takip (tracker)** — kalori halkaları + öğünler
4. **Fotoğraftan kalori** veya **buzdolabı tarama** — farklılaştırıcı özellik
5. **İçgörüler (insights)** — grafikler
6. **Antrenman** veya **topluluk**

**Nasıl alınır (en kolay yol — TestFlight + gerçek/simülatör cihaz):**
- **A) iOS Simülatör (Mac gerekir):** Xcode → Simulator → iPhone 16 Pro Max → uygulamayı çalıştır → `Cmd+S` ile ekran görüntüsü (doğru çözünürlükte kaydeder).
- **B) Gerçek cihaz (Mac yoksa):** TestFlight'tan uygulamayı iPhone'a kur → ekran görüntüsü al. Cihazın 6.9"/6.5" değilse boyut tutmaz; o zaman C.
- **C) Mac yoksa + doğru cihaz yoksa:** Bir "App Store screenshot" aracı kullan (ör. mockup üreticileri) veya bana söyle — elimizdeki ekranların çözünürlüğünü ayarlayıp çerçeveli tanıtım görselleri hazırlamana yardım edeyim.

> İpucu: İlk 2 kareye kısa başlık ekle ("Yapay zekâ şefin cebinde", "Fotoğraf çek, kalorini öğren"). Dönüşümü artırır.

---

## 7) ⚠️ Yayın Öncesi Reddi Önleyecek Kritik Kontroller

Bunlar App Store review'da **en sık ret sebepleri**:

1. **UGC moderasyonu (Guideline 1.2) — ✅ ÇÖZÜLDÜ (2026-07-09).**
   Eklendi: tarif/yorum için **"Bildir"** (native sebep seçimi → `reports` koleksiyonu), yazarı **"Engelle"** (engellenenin tarif+yorumları gizlenir), profil → **"Engellenen kullanıcılar"** ekranından engel kaldırma, tarif paylaşımında **içerik kuralı onay notu**. Firestore `reports` kuralı **deploy edildi** (canlı). ⚠️ **Bu özellikler build 33'TE YOK** — yeni bir build (34) alıp submit etmelisin (bkz. §9).

2. **App Review demo hesabı — ✅ HAZIR (2026-07-09).**
   Önceden doğrulanmış demo hesabı oluşturuldu (`scripts/create-review-account.js`). ASC → **App Review Information → Sign-In Required** bölümüne gir:
   - **E-posta:** `review@frozfit.app`
   - **Şifre:** `FrozFit!Review2026`
   Hesap `emailVerified: true` olduğu için doğrulama duvarına takılmaz. (Şifreyi değiştirmek istersen scripti `REVIEW_PASSWORD='...'` ile tekrar çalıştır.)

3. **Sign in with Apple.** Google girişi sunuyorsan Apple girişi de sunmak zorunlusun (var ✓). Kontrol et: gerçekten çalışıyor (son build'de nonce kaldırıldı, TestFlight'ta doğrula).

4. **Abonelik meta verisi (Guideline 3.1.2).** Pro abonelik için: açıklamada fiyat/süre + "otomatik yenilenir" notu (var ✓) + EULA (Apple standart) + Privacy linki + App Store Connect'te abonelik ürünü "Ready to Submit" durumunda ve build'e bağlı olmalı. RevenueCat ürünü ASC'de tanımlı mı, doğrula.

5. **Export Compliance.** ✓ Ana `app.json`'da `ITSAppUsesNonExemptEncryption: false` **zaten ayarlı** (standart HTTPS muaf). ASC'de ek soru çıkarsa "No" işaretle.

6. **Boş/çalışmayan özellik yok.** Reviewer AI özelliklerini deneyecek — Cloudflare proxy canlı ve rate-limit'li ✓; ama reviewer çok deneyip 429 alırsa kafası karışabilir. Rate limit mesajları Türkçe/net ✓.

   ℹ️ Supabase ve Pixabay anahtarları **hiç tanımlı değil**. Bu yüzden topluluk tarif fotoğrafı yükleme gizli, egzersizler videoya değil fotoğrafa düşüyor. Kod bu durumu zarifçe karşılıyor (kırık/boş ekran yok), dolayısıyla red sebebi değil — ama bu özellikleri istiyorsan ilgili ücretsiz hesapları açıp anahtarları EAS `production` ortamına eklemelisin.

7. **"Sınırsız AI" iddiası (Guideline 2.3.1) — ✅ ÇÖZÜLDÜ (2026-07-11).**
   Paywall, uygulama içi metinler ve bu dokümandaki mağaza açıklaması Pro'yu "sınırsız AI" diye tanıtıyordu; oysa sunucuda günlük tavan var. "Sınırsız" satıp gizli tavan koymak yanıltıcı tanıtımdır ve abonelik kurallarına takılır.
   Yapılan: sunucu tavanı **günde 40 AI işlemi** olarak belirlendi (`cloudflare-worker` → `RL_PER_DAY`, ağırlıklı birim sayar: haftalık öğün planı 4 birim) ve **tüm metinler bu rakamı söylüyor** — paywall, kredi ekranı, profil, i18n (TR+EN) ve §2/§3'teki mağaza açıklamaları.
   ⚠️ Tavanı değiştirirsen bu metinleri de güncelle; ikisi birbirine bağlı.

---

## 8) Gönderme Adımları (özet)

1. **Önce yeni build al (§9)** — moderasyon özellikleri build 33'te yok
2. App Information + Kategoriler + Privacy/Support URL → gir
3. Açıklama, keywords, promotional, what's new (§2/§3) → gir
4. Screenshots (§6) → yükle
5. Build seç → **build 34** (yeni, moderasyonlu) işlendiğinde "Build" bölümünden seç
6. App Privacy (§4) → doldur
7. Age Rating (§5) → doldur
8. App Review Information → **demo hesabı** `review@frozfit.app` / `FrozFit!Review2026` + iletişim bilgisi
9. Pricing → Free (Pro IAP ayrı)
10. **Submit for Review**

---

## 9) Yeni build (build 34) — moderasyon özellikleri için ZORUNLU

Rapor/engelle özellikleri koda eklendi ama TestFlight'taki build 33'te **yok**. Reviewer'ın görmesi için yeni build şart:

```bash
cd frozfit
npx eas build --platform ios --profile production --auto-submit --non-interactive
```

Bu buildNumber'ı 34'e çıkarır (autoIncrement), TestFlight'a işler ve auto-submit ile App Store Connect'e gönderir. İşlendikten sonra yukarıdaki §8 adımlarıyla submit et.

> Firestore `reports` kuralı zaten deploy edildi — build ile ayrıca yapman gereken bir şey yok.

---

*Bu doküman `docs/app-store-submission.md` — güncelledikçe commit edebilirsin.*
