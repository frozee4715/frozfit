import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PREMIUM_FEATURES, usePremium } from '@/lib/premium';
import type { PurchasePackage } from '@/lib/purchases';

// Apple, abonelik paywall'unda Kullanım Koşulları (EULA) + Gizlilik linki ZORUNLU kılar.
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://frozfit.app/privacy'; // TODO: gerçek gizlilik politikası URL'i

export default function PremiumScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium, purchasesSupported, packages, purchase, restore } = usePremium();
  const [busy, setBusy] = useState(false);

  const mainPackage: PurchasePackage | undefined = packages[0];

  const openLink = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
  };

  const handleSubscribe = async () => {
    if (!mainPackage) return;
    setBusy(true);
    try {
      const res = await purchase(mainPackage);
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
        ) : !mainPackage ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.three }}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, marginTop: Spacing.two }}>
              Paketler yükleniyor…
            </ThemedText>
          </View>
        ) : (
          <Pressable
            onPress={handleSubscribe}
            disabled={busy}
            style={[styles.cta, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="star" size={20} color="#fff" />
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 17 }}>
                  Premium&apos;a geç — {mainPackage.priceString}
                </ThemedText>
              </>
            )}
          </Pressable>
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
