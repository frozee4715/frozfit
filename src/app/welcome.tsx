/**
 * Karşılama (welcome) ekranı — uygulamaya girişteki İLK ekran.
 *
 * Tasarım: yumuşak mint zeminde yüzen yemek kartlarından oluşan bir kahraman
 * (hero) kümesi + marka rozeti + değer önerisi rozetleri + alt aksiyon paneli.
 * Görsel yerine emoji kullanılır: internet gerektirmez, her cihazda çalışır.
 *
 * Aksiyonlar:
 *   - Apple / Google ile devam et → SIFIR SÜRTÜNME (tek dokunuş → uygulama)
 *   - Ücretsiz başla → sessiz misafir oturumu → kişiselleştirme (onboarding)
 *   - Zaten hesabın var mı? → giriş ekranı
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, type DimensionValue, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useResolvedScheme } from '@/lib/settings';
import { isAppleSignInSupported, isGoogleSignInSupported } from '@/lib/social-auth';

/** Kahraman kümesindeki yüzen yemek kartları (merkezdeki rozetin çevresi). */
const SATELLITES: { emoji: string; left: DimensionValue; top: DimensionValue; size: number; rotate: string; delay: number }[] = [
  { emoji: '🥑', left: '6%', top: '10%', size: 62, rotate: '-12deg', delay: 240 },
  { emoji: '🍓', left: '72%', top: '4%', size: 56, rotate: '10deg', delay: 320 },
  { emoji: '🥦', left: '80%', top: '50%', size: 60, rotate: '-8deg', delay: 400 },
  { emoji: '🍗', left: '2%', top: '52%', size: 58, rotate: '9deg', delay: 480 },
  { emoji: '🐟', left: '58%', top: '76%', size: 54, rotate: '-7deg', delay: 560 },
  { emoji: '🥛', left: '20%', top: '80%', size: 50, rotate: '12deg', delay: 640 },
];

/** Alt başlık altındaki küçük değer önerisi rozetleri. */
const PERKS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'sparkles', label: 'AI Şef' },
  { icon: 'flame', label: 'Kalori takibi' },
  { icon: 'barbell', label: 'Antrenman' },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useResolvedScheme() === 'dark';
  const { height } = useWindowDimensions();
  const { signInGuest, signInWithApple, signInWithGoogle } = useAuth();

  const [busy, setBusy] = useState<null | 'apple' | 'google' | 'start'>(null);
  const [error, setError] = useState<string | null>(null);

  const showApple = isAppleSignInSupported();
  const showGoogle = isGoogleSignInSupported();

  // Merkezdeki rozetin yumuşak "nefes alan" salınımı (bir kez başlatılır).
  // Sonsuz (-1) tekrar, unmount'ta MUTLAKA iptal edilmeli: aksi halde UI runtime
  // ekran gittikten sonra da shared value'ya yazmayı sürdürür ve Hermes heap'ini
  // bozar (GC write barrier'ında SIGSEGV).
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);
    return () => cancelAnimation(bob);
  }, [bob]);
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 + bob.value * -6 }],
  }));

  const heroHeight = Math.max(300, Math.min(height * 0.46, 420));

  // Yeni kullanıcı: sessizce misafir oturumu aç → kök yönlendirici onboarding'e götürür.
  const start = async () => {
    setError(null);
    setBusy('start');
    try {
      await signInGuest();
    } catch {
      setError('Başlatılamadı. İnternet bağlantını kontrol et.');
      setBusy(null);
    }
  };

  const social = async (provider: 'apple' | 'google') => {
    setError(null);
    setBusy(provider);
    try {
      if (provider === 'apple') await signInWithApple();
      else await signInWithGoogle();
      // Başarılıysa kök yönlendirici doğrudan uygulamaya götürür (sıfır sürtünme).
    } catch (e: any) {
      const base = provider === 'apple' ? 'Apple ile giriş tamamlanamadı.' : 'Google ile giriş tamamlanamadı.';
      const detail = e?.code || (typeof e?.message === 'string' ? e.message.slice(0, 100) : '');
      setError(`${base}${detail ? ` (${detail})` : ''}`);
      setBusy(null);
    }
  };

  const anyBusy = busy !== null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Üstteki yumuşak mint aydınlık */}
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          { backgroundColor: theme.primary, opacity: isDark ? 0.14 : 0.1, marginTop: insets.top - 40 },
        ]}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.three }}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Kahraman kümesi */}
        <View style={[styles.hero, { height: heroHeight, marginTop: insets.top + Spacing.two }]}>
          {SATELLITES.map((t, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(t.delay).duration(500)}
              style={[
                styles.tile,
                {
                  left: t.left,
                  top: t.top,
                  width: t.size,
                  height: t.size,
                  borderRadius: t.size * 0.3,
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  transform: [{ rotate: t.rotate }],
                },
              ]}>
              <ThemedText style={{ fontSize: t.size * 0.5, lineHeight: t.size * 0.64 }}>{t.emoji}</ThemedText>
            </Animated.View>
          ))}

          {/* Merkez rozet */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.badgeWrap}>
            <View style={[styles.badgeHalo, { backgroundColor: theme.primary, opacity: isDark ? 0.22 : 0.16 }]} />
            <Animated.View style={[styles.badge, { backgroundColor: theme.primary }, badgeStyle]}>
              <ThemedText style={{ fontSize: 52, lineHeight: 62 }}>🥕</ThemedText>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Marka + slogan */}
        <View style={styles.brandBlock}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <ThemedText type="subtitle" style={{ fontSize: 40, lineHeight: 46, textAlign: 'center' }}>
              FrozFit
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={{ fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 300 }}>
              Sana özel beslenme ve antrenman planıyla sağlıklı yaşamına bugün başla.
            </ThemedText>
          </Animated.View>

          {/* Değer önerisi rozetleri */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.perks}>
            {PERKS.map((p) => (
              <View key={p.label} style={[styles.perk, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={p.icon} size={14} color={theme.primaryDark} />
                <ThemedText type="smallBold" style={{ fontSize: 12, color: theme.primaryDark }}>
                  {p.label}
                </ThemedText>
              </View>
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Alt aksiyon paneli */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(500)}
        style={[styles.actions, { paddingBottom: insets.bottom + Spacing.three }]}>
        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13, textAlign: 'center' }}>
            {error}
          </ThemedText>
        )}

        {/* Sosyal girişler — sıfır sürtünme */}
        {showApple && (
          <PressableScale
            onPress={() => social('apple')}
            disabled={anyBusy}
            style={[styles.socialBtn, { backgroundColor: isDark ? '#fff' : '#000' }]}>
            {busy === 'apple' ? (
              <ActivityIndicator color={isDark ? '#000' : '#fff'} />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color={isDark ? '#000' : '#fff'} />
                <ThemedText type="smallBold" style={{ color: isDark ? '#000' : '#fff', fontSize: 16 }}>
                  Apple ile devam et
                </ThemedText>
              </>
            )}
          </PressableScale>
        )}
        {showGoogle && (
          <PressableScale
            onPress={() => social('google')}
            disabled={anyBusy}
            style={[styles.socialBtn, { backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}>
            {busy === 'google' ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={theme.text} />
                <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                  Google ile devam et
                </ThemedText>
              </>
            )}
          </PressableScale>
        )}

        {(showApple || showGoogle) && (
          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
              veya
            </ThemedText>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>
        )}

        {/* Ücretsiz başla → kişiselleştirme */}
        <PressableScale
          onPress={start}
          disabled={anyBusy}
          style={[styles.primaryBtn, { backgroundColor: isDark ? theme.primary : '#16212C' }]}>
          {busy === 'start' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 17 }}>
              Ücretsiz başla
            </ThemedText>
          )}
        </PressableScale>

        <Pressable
          onPress={() => router.push({ pathname: '/login', params: { mode: 'signin' } })}
          disabled={anyBusy}
          hitSlop={8}
          style={{ alignSelf: 'center', paddingVertical: Spacing.one }}>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
            Zaten hesabın var mı?{' '}
            <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 14 }}>
              Giriş yap
            </ThemedText>
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 460,
    height: 460,
    borderRadius: 230,
  },
  hero: {
    marginHorizontal: Spacing.four,
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0F1B15',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  badgeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHalo: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E9E73',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  brandBlock: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  perks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  actions: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 54,
    borderRadius: Radius.pill,
  },
  primaryBtn: {
    height: 58,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.one,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
