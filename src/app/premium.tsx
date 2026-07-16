import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { PRIVACY_URL, TERMS_URL } from '@/constants/links';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAccountGate } from '@/lib/account-gate';
import { PREMIUM_FEATURES, usePremium } from '@/lib/premium';
import type { PurchasePackage } from '@/lib/purchases';

/** Paketleri gösterim sırasına koyar: yıllık önce (öne çıkan), sonra aylık. */
function sortPackages(pkgs: PurchasePackage[]): PurchasePackage[] {
  const order = (p: PurchasePackage) =>
    p.packageType === 'ANNUAL' ? 0 : p.packageType === 'MONTHLY' ? 1 : 2;
  return [...pkgs].sort((a, b) => order(a) - order(b));
}

function packageLabel(p: PurchasePackage): { name: string; per: string } {
  switch (p.packageType) {
    case 'ANNUAL':
      return { name: 'Yıllık', per: '/yıl' };
    case 'MONTHLY':
      return { name: 'Aylık', per: '/ay' };
    case 'LIFETIME':
      return { name: 'Ömür boyu', per: '' };
    default:
      return { name: p.title, per: '' };
  }
}

/** Yıllık paketin aylığa göre yüzde kaç kazandırdığı (gösterilemiyorsa null). */
function annualSavings(pkgs: PurchasePackage[]): number | null {
  const monthly = pkgs.find((p) => p.packageType === 'MONTHLY');
  const annual = pkgs.find((p) => p.packageType === 'ANNUAL');
  if (!monthly || !annual || monthly.price <= 0 || annual.price <= 0) return null;
  const pct = Math.round((1 - annual.price / (monthly.price * 12)) * 100);
  return pct > 0 ? pct : null;
}

export default function PremiumScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isPremium,
    purchasesSupported,
    packages,
    packagesError,
    packagesErrorDetail,
    refreshPackages,
    purchase,
    restore,
  } = usePremium();
  const { requireAccount } = useAccountGate();
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = sortPackages(packages);
  const savings = annualSavings(packages);
  const selected = sorted.find((p) => p.identifier === selectedId) ?? sorted[0];

  // Paketler gelince varsayılan seçim: yıllık (ilk sıradaki).
  useEffect(() => {
    if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].identifier);
  }, [sorted, selectedId]);

  const openLink = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
  };

  const handleSubscribe = async () => {
    if (!selected) return;
    // Misafir aboneliği anonim hesaba bağlanır ve uygulama silinince kaybolabilir —
    // satın almadan ÖNCE ücretsiz hesap şart.
    if (!requireAccount('Premium aboneliğinin kaybolmaması için önce ücretsiz bir hesap oluştur. Aboneliğin hesabına bağlanır; uygulamayı silsen bile korunur.')) return;
    setBusy(true);
    try {
      const res = await purchase(selected);
      if (res.isPro) {
        Alert.alert('Teşekkürler! 🎉', 'Premium aktif. Tüm özellikler açıldı.');
      } else if (res.cancelled) {
        // kullanıcı vazgeçti — sessiz
      } else {
        Alert.alert('Satın alma tamamlanamadı', res.error ?? 'Lütfen tekrar dene.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    // Geri yükleme de hesaba bağlanır — misafire kapalı, önce giriş/hesap.
    if (!requireAccount('Aboneliğini geri yüklemek için önce hesabına giriş yap veya ücretsiz bir hesap oluştur.')) return;
    setBusy(true);
    try {
      const res = await restore();
      if (res.isPro) {
        Alert.alert('Geri yüklendi 🎉', 'Premium aboneliğin geri yüklendi.');
      } else if (res.success) {
        Alert.alert('Abonelik bulunamadı', 'Bu hesapta aktif bir Premium abonelik yok.');
      } else {
        Alert.alert('Geri yükleme başarısız', res.error ?? 'Lütfen tekrar dene.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await refreshPackages();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <Pressable onPress={handleRestore} hitSlop={8} disabled={busy || !purchasesSupported}>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
            Geri yükle
          </ThemedText>
        </Pressable>
      </View>

      <Screen>
        <View style={{ alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.two }}>
          <View style={[styles.crown, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="star" size={36} color={theme.primaryDark} />
          </View>
          <ThemedText type="subtitle" style={{ fontSize: 26, textAlign: 'center' }}>
            FrozFit Premium
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 15, textAlign: 'center' }}>
            Hedeflerine daha hızlı ulaş — tüm özelliklerin kilidini aç.
          </ThemedText>
        </View>

        {isPremium ? (
          <Card style={[styles.activeCard, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.primaryDark} />
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ fontSize: 15, color: theme.primaryDark }}>
                Premium aktif 🎉
              </ThemedText>
              <ThemedText type="small" style={{ fontSize: 12, color: theme.primaryDark }}>
                Tüm premium özellikler açık.
              </ThemedText>
            </View>
          </Card>
        ) : null}

        <Card style={{ gap: Spacing.three }}>
          {PREMIUM_FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={f.icon as any} size={20} color={theme.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                  {f.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                  {f.desc}
                </ThemedText>
              </View>
              <Ionicons name="checkmark" size={20} color={theme.primary} />
            </View>
          ))}
        </Card>

        {isPremium ? null : !purchasesSupported ? (
          <Card style={{ gap: Spacing.one }}>
            <ThemedText type="smallBold" style={{ fontSize: 14 }}>
              Satın alma şu an kullanılamıyor
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              Premium satın alma yalnızca App Store sürümünde çalışır (Expo Go&apos;da değil).
            </ThemedText>
          </Card>
        ) : packagesError && sorted.length === 0 ? (
          <Card style={{ gap: Spacing.two, alignItems: 'center' }}>
            <Ionicons name="cloud-offline-outline" size={28} color={theme.textMuted} />
            <ThemedText type="smallBold" style={{ fontSize: 14, textAlign: 'center' }}>
              Paketler yüklenemedi
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={{ fontSize: 12, textAlign: 'center' }}>
              İnternet bağlantını kontrol edip tekrar dene.
            </ThemedText>
            {packagesErrorDetail ? (
              <ThemedText
                type="small"
                themeColor="textMuted"
                style={{ fontSize: 10, textAlign: 'center' }}>
                Detay: {packagesErrorDetail}
              </ThemedText>
            ) : null}
            <Pressable
              onPress={handleRetry}
              disabled={retrying}
              style={[styles.retryBtn, { borderColor: theme.primary, opacity: retrying ? 0.6 : 1 }]}>
              {retrying ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 14 }}>
                  Tekrar dene
                </ThemedText>
              )}
            </Pressable>
          </Card>
        ) : sorted.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.three }}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, marginTop: Spacing.two }}>
              Paketler yükleniyor…
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Paket seçimi */}
            <View style={{ gap: Spacing.two }}>
              {sorted.map((p) => {
                const isSelected = selected?.identifier === p.identifier;
                const label = packageLabel(p);
                const isAnnual = p.packageType === 'ANNUAL';
                return (
                  <Pressable
                    key={p.identifier}
                    onPress={() => setSelectedId(p.identifier)}
                    style={[
                      styles.packageCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                        <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                          {label.name}
                        </ThemedText>
                        {isAnnual && savings ? (
                          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 11 }}>
                              %{savings} avantajlı
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                        {p.priceString}
                        {label.per}
                      </ThemedText>
                    </View>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={isSelected ? theme.primary : theme.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleSubscribe}
              disabled={busy || !selected}
              style={[styles.cta, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="star" size={20} color="#fff" />
                  <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 17 }}>
                    Premium&apos;a geç
                  </ThemedText>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* Yasal — Apple paywall'da zorunlu */}
        <View style={styles.legalRow}>
          <Pressable onPress={() => openLink(TERMS_URL)} hitSlop={6}>
            <ThemedText type="small" themeColor="textMuted" style={styles.legalLink}>
              Kullanım Koşulları
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 11 }}>
            ·
          </ThemedText>
          <Pressable onPress={() => openLink(PRIVACY_URL)} hitSlop={6}>
            <ThemedText type="small" themeColor="textMuted" style={styles.legalLink}>
              Gizlilik Politikası
            </ThemedText>
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 11, textAlign: 'center' }}>
          Abonelik otomatik yenilenir. İstediğin zaman App Store hesabından iptal edebilirsin.
        </ThemedText>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  crown: {
    width: 76,
    height: 76,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  retryBtn: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 56,
    borderRadius: Radius.pill,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  legalLink: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});
