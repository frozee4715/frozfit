/**
 * Premium üyelik durumu.
 *
 * Kaynak (source of truth): RevenueCat entitlement ("pro").
 * Ek olarak Firestore'daki `users/{uid}.isPremium` da OKUNUR (ileride RevenueCat
 * webhook → Cloud Function bu alanı yazarsa sunucu da premium'u bilir). İkisinden
 * biri aktifse kullanıcı premium sayılır.
 *
 * Gerçek satın alma RevenueCat (react-native-purchases) üzerinden yapılır; bu modül
 * Expo Go'da çökmeyecek şekilde sarmalanmıştır (src/lib/purchases.ts).
 */
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import {
  addCustomerInfoListener,
  configurePurchases,
  getCustomerInfoSafe,
  getProPackages,
  hasProEntitlement,
  isPurchasesSupported,
  lastPackagesError,
  purchaseProPackage,
  restorePurchasesSafe,
  type PurchasePackage,
  type PurchaseResult,
} from '@/lib/purchases';

type PremiumContextValue = {
  isPremium: boolean;
  ready: boolean;
  /** Gerçek satın alma bu cihazda mümkün mü (native modül + RevenueCat anahtarı). */
  purchasesSupported: boolean;
  /** Satın alınabilir paketler (RevenueCat offering). */
  packages: PurchasePackage[];
  /** Paketler denemelere rağmen yüklenemedi (mağaza/yapılandırma sorunu). */
  packagesError: boolean;
  /** Son yükleme hatasının teknik detayı (teşhis için). */
  packagesErrorDetail: string | null;
  /** Paketleri yeniden yüklemeyi dener. */
  refreshPackages: () => Promise<void>;
  /** Bir paketi satın alır. */
  purchase: (pkg: PurchasePackage) => Promise<PurchaseResult>;
  /** Önceki satın alımları geri yükler. */
  restore: () => Promise<PurchaseResult>;
};

const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  ready: false,
  purchasesSupported: false,
  packages: [],
  packagesError: false,
  packagesErrorDetail: null,
  refreshPackages: async () => {},
  purchase: async () => ({ success: false, isPro: false }),
  restore: async () => ({ success: false, isPro: false }),
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rcPremium, setRcPremium] = useState(false);
  const [firestorePremium, setFirestorePremium] = useState(false);
  const [packages, setPackages] = useState<PurchasePackage[]>([]);
  const [packagesError, setPackagesError] = useState(false);
  const [packagesErrorDetail, setPackagesErrorDetail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  /** Paketleri yükler; boş dönerse kısa aralıklarla birkaç kez daha dener. */
  const loadPackages = useCallback(async (attempts = 3): Promise<void> => {
    setPackagesError(false);
    setPackagesErrorDetail(null);
    for (let i = 0; i < attempts; i++) {
      const pkgs = await getProPackages();
      if (pkgs.length > 0) {
        setPackages(pkgs);
        return;
      }
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2500 * (i + 1)));
    }
    setPackagesError(true);
    setPackagesErrorDetail(lastPackagesError);
  }, []);

  // RevenueCat: yapılandır, durumu çek, dinle.
  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      if (!isPurchasesSupported()) {
        setReady(true);
        return;
      }
      await configurePurchases(user?.uid);
      const info = await getCustomerInfoSafe();
      if (!cancelled && info) setRcPremium(hasProEntitlement(info));
      cleanup = addCustomerInfoListener((newInfo) => {
        setRcPremium(hasProEntitlement(newInfo));
      });
      if (!cancelled) setReady(true);
      // Paket yüklemesi arka planda, yeniden denemeli sürer.
      loadPackages();
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [user?.uid, loadPackages]);

  // Firestore: ileride webhook premium yazarsa diye yedek okuma.
  useEffect(() => {
    if (!user || !db) {
      setFirestorePremium(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => setFirestorePremium(Boolean(snap.data()?.isPremium)),
      () => setFirestorePremium(false),
    );
    return unsub;
  }, [user]);

  const isPremium = rcPremium || firestorePremium;

  const purchase = async (pkg: PurchasePackage): Promise<PurchaseResult> => {
    const res = await purchaseProPackage(pkg);
    if (res.isPro) setRcPremium(true);
    return res;
  };

  const restore = async (): Promise<PurchaseResult> => {
    const res = await restorePurchasesSafe();
    if (res.isPro) setRcPremium(true);
    return res;
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        ready,
        purchasesSupported: isPurchasesSupported(),
        packages,
        packagesError,
        packagesErrorDetail,
        refreshPackages: () => loadPackages(2),
        purchase,
        restore,
      }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);

export const PREMIUM_FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: 'sparkles-outline', title: 'Sınırsız AI', desc: 'AI tarif, koç ve fotoğraf analizinde sınır yok' },
  { icon: 'calendar-outline', title: 'Haftalık AI öğün planı', desc: 'Sana özel 7 günlük plan oluştur' },
  { icon: 'stats-chart-outline', title: 'Gelişmiş analizler', desc: 'Detaylı trend ve makro içgörüleri' },
  { icon: 'color-palette-outline', title: 'Özel temalar', desc: 'Uygulamayı kişiselleştir' },
  { icon: 'restaurant-outline', title: 'Buzdolabını tara', desc: 'Malzemelerinden AI ile tarif üret' },
];
