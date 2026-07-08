/**
 * RevenueCat (react-native-purchases) güvenli sarmalayıcı.
 *
 * `react-native-purchases` bir NATIVE modüldür → Expo Go'da YOKTUR; yalnızca
 * dev/production (EAS) build'lerde çalışır. Bu dosya modülü try/catch ile yükler
 * ve native modül yoksa tüm fonksiyonlar zararsızca no-op döner (uygulama çökmez).
 *
 * Kurulum (kullanıcı tarafında):
 *  1) RevenueCat hesabı aç → iOS app + entitlement "pro" + offering oluştur.
 *  2) App Store Connect'te abonelik/IAP ürünü tanımla, RevenueCat'e bağla.
 *  3) .env → EXPO_PUBLIC_REVENUECAT_IOS_KEY (ve istersen ANDROID_KEY).
 *  4) Yeni bir EAS build al (Expo Go değil).
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim();
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim();

/** RevenueCat'te tanımlanan entitlement kimliği. */
export const PRO_ENTITLEMENT = 'pro';

/**
 * Expo Go'da mıyız? RevenueCat'in JS'i Expo Go'da yüklenir ama altındaki native
 * store yoktur; configure çağrısı "Invalid API key / native store not available"
 * console hatası basar. Bu yüzden Expo Go'da RevenueCat'i hiç başlatmayız.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Native modülü güvenli yükle. Expo Go'da JS yüklense de native yoktur → kullanma.
let Purchases: any = null;
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Purchases = require('react-native-purchases').default;
  } catch {
    Purchases = null;
  }
}

export type PurchasePackage = {
  identifier: string;
  /** Gösterilecek fiyat, örn. "₺49,99" */
  priceString: string;
  /** Ürün başlığı (App Store'dan) */
  title: string;
  /** RevenueCat paket türü: MONTHLY, ANNUAL, LIFETIME... */
  packageType: string;
  /** Sayısal fiyat (indirim hesabı için). */
  price: number;
  /** Ham paket nesnesi (purchasePackage'a verilir) */
  raw: any;
};

function platformKey(): string | undefined {
  return Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
}

/** Native modül + API anahtarı varsa true (yani gerçek satın alma mümkün). */
export function isPurchasesSupported(): boolean {
  return !!Purchases && !!platformKey();
}

let configured = false;

/** RevenueCat'i bir kez yapılandırır. appUserId = Firebase uid (önerilir). */
export async function configurePurchases(appUserId?: string): Promise<void> {
  if (!isPurchasesSupported()) return;
  if (configured) {
    // Zaten yapılandırıldıysa yalnızca kullanıcı kimliğini eşitle (uid sonradan gelebilir).
    if (appUserId) await loginPurchases(appUserId);
    return;
  }
  try {
    Purchases.configure({ apiKey: platformKey()!, appUserID: appUserId ?? null });
    configured = true;
  } catch {
    // sessizce geç — destek yokmuş gibi davran
  }
}

/** Aktif "pro" entitlement var mı? */
export function hasProEntitlement(customerInfo: any): boolean {
  return !!customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT];
}

/** Mevcut müşteri bilgisini getirir (null = desteklenmiyor/hata). */
export async function getCustomerInfoSafe(): Promise<any | null> {
  if (!isPurchasesSupported() || !configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

/** Müşteri bilgisi değişince haber verir. Geri dönen fonksiyon listener'ı kaldırır. */
export function addCustomerInfoListener(cb: (info: any) => void): () => void {
  if (!isPurchasesSupported()) return () => {};
  try {
    Purchases.addCustomerInfoUpdateListener(cb);
    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(cb);
      } catch {
        /* yoksay */
      }
    };
  } catch {
    return () => {};
  }
}

/** getProPackages'in son çağrısındaki hata mesajı (arayüzde teşhis için). */
export let lastPackagesError: string | null = null;

/**
 * Aktif offering'in paketlerini döndürür (boş = yok/desteklenmiyor).
 *
 * Not: RevenueCat panelinde "Current" offering işaretlenmemişse `offerings.current`
 * null gelir ve paketler hiç yüklenmez ("Paket yükleniyor"da kalma sebebi).
 * Bu durumda tüm offering'ler taranır, ilk dolu olan kullanılır.
 */
export async function getProPackages(): Promise<PurchasePackage[]> {
  if (!isPurchasesSupported() || !configured) {
    lastPackagesError = !Purchases
      ? 'native_module_missing'
      : !platformKey()
        ? 'api_key_missing'
        : 'not_configured';
    return [];
  }
  try {
    const offerings = await Purchases.getOfferings();
    let pkgs: any[] = offerings?.current?.availablePackages ?? [];
    if (pkgs.length === 0 && offerings?.all) {
      for (const key of Object.keys(offerings.all)) {
        const candidate = offerings.all[key]?.availablePackages ?? [];
        if (candidate.length > 0) {
          pkgs = candidate;
          break;
        }
      }
    }
    lastPackagesError =
      pkgs.length === 0
        ? 'RevenueCat offering boş. Panelde offering + paketleri ve App Store Connect ürün onayını kontrol et.'
        : null;
    return pkgs.map((p: any) => ({
      identifier: p.identifier,
      priceString: p.product?.priceString ?? '',
      title: p.product?.title ?? 'FrozFit Premium',
      packageType: p.packageType ?? '',
      price: p.product?.price ?? 0,
      raw: p,
    }));
  } catch (e: any) {
    lastPackagesError = e?.message ?? 'offerings_failed';
    return [];
  }
}

export type PurchaseResult = { success: boolean; isPro: boolean; cancelled?: boolean; error?: string };

/** Bir paketi satın alır. */
export async function purchaseProPackage(pkg: PurchasePackage): Promise<PurchaseResult> {
  if (!isPurchasesSupported() || !configured) {
    return { success: false, isPro: false, error: 'unsupported' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg.raw);
    return { success: true, isPro: hasProEntitlement(customerInfo) };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, isPro: false, cancelled: true };
    return { success: false, isPro: false, error: e?.message ?? 'purchase_failed' };
  }
}

/** Önceki satın alımları geri yükler. */
export async function restorePurchasesSafe(): Promise<PurchaseResult> {
  if (!isPurchasesSupported() || !configured) {
    return { success: false, isPro: false, error: 'unsupported' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, isPro: hasProEntitlement(customerInfo) };
  } catch (e: any) {
    return { success: false, isPro: false, error: e?.message ?? 'restore_failed' };
  }
}

/** Kullanıcı giriş/çıkışında RevenueCat kimliğini eşitlemek için (opsiyonel). */
export async function loginPurchases(appUserId: string): Promise<void> {
  if (!isPurchasesSupported() || !configured) return;
  try {
    await Purchases.logIn(appUserId);
  } catch {
    /* yoksay */
  }
}
