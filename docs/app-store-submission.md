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
• Sınırsız yapay zekâ kullanımı
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

### What's New in This Version (Sürüm 1.0.0 notu)
```
FrozFit'e hoş geldin! İlk sürümümüzde: yapay zekâ şef, fotoğraftan kalori tahmini, buzdolabı tarama, kalori & makro takibi, antrenman ve topluluk. Geri bildirimlerini bekliyoruz.
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
• Unlimited AI usage
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

Bunlar App Store review'da **en sık ret sebepleri** — göndermeden önce hallet:

1. **UGC moderasyonu (Guideline 1.2) — EN YÜKSEK RİSK.**
   Topluluk tarifleri ve AI sohbeti kullanıcı içeriği. Apple şunları ister:
   - Uygunsuz içeriği **bildir (report)** mekanizması
   - Küfürlü/istismarcı kullanıcıyı **engelle (block)**
   - İçerik filtreleme + zamanında müdahale taahhüdü
   Şu an uygulamada bunlar **yoksa**, review'dan dönme ihtimali yüksek. → *Bunu koda eklememi ister misin? (rapor et + engelle butonları + kullanıcı bildirimi). 1-2 saatlik iş, reddi önler.*

2. **App Review demo hesabı.** Uygulama girişi zorunlu → ASC "App Review Information" bölümüne bir **test hesabı** (e-posta + şifre) gir, yoksa reviewer içeri giremez → ret. Google/Apple ile giriş de olduğundan, hazır bir e-posta/şifre hesabı oluştur ve oraya yaz.

3. **Sign in with Apple.** Google girişi sunuyorsan Apple girişi de sunmak zorunlusun (var ✓). Kontrol et: gerçekten çalışıyor (son build'de nonce kaldırıldı, TestFlight'ta doğrula).

4. **Abonelik meta verisi (Guideline 3.1.2).** Pro abonelik için: açıklamada fiyat/süre + "otomatik yenilenir" notu (var ✓) + EULA (Apple standart) + Privacy linki + App Store Connect'te abonelik ürünü "Ready to Submit" durumunda ve build'e bağlı olmalı. RevenueCat ürünü ASC'de tanımlı mı, doğrula.

5. **Export Compliance.** ✓ Ana `app.json`'da `ITSAppUsesNonExemptEncryption: false` **zaten ayarlı** (standart HTTPS muaf). ASC'de ek soru çıkarsa "No" işaretle.

6. **Boş/çalışmayan özellik yok.** Reviewer AI özelliklerini deneyecek — Cloudflare proxy canlı ve rate-limit'li ✓; ama reviewer çok deneyip 429 alırsa kafası karışabilir. Rate limit mesajları Türkçe/net ✓.

---

## 8) Gönderme Adımları (özet)

1. App Information + Kategoriler + Privacy/Support URL → gir
2. Açıklama, keywords, promotional, what's new (§2/§3) → gir
3. Screenshots (§6) → yükle
4. Build seç → **build 33** (v1.0.0) TestFlight'ta işlendiyse "Build" bölümünden seç
5. App Privacy (§4) → doldur
6. Age Rating (§5) → doldur
7. App Review Information → **demo hesabı** + iletişim bilgisi (§7.2)
8. Pricing → Free (Pro IAP ayrı)
9. **Submit for Review**

---

*Bu doküman `docs/app-store-submission.md` — güncelledikçe commit edebilirsin.*
