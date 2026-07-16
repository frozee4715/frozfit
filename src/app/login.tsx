import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useResolvedScheme } from '@/lib/settings';
import { isAppleSignInSupported, isGoogleSignInSupported } from '@/lib/social-auth';
import { clearGuestFlag } from '@/lib/user-profile';

type Mode = 'signin' | 'signup';

/** Temel e-posta biçim denetimi (asıl doğrulama e-posta onayıyla yapılır). */
function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/** Firebase auth hata kodlarını Türkçe mesaja çevirir. */
function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.';
    case 'auth/missing-password':
      return 'Lütfen bir şifre girin.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.';
    case 'auth/requires-recent-login':
      return 'Oturum süresi doldu. Lütfen tekrar deneyin.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Biraz sonra tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı yok gibi görünüyor.';
    case 'auth/account-exists-with-different-credential':
      return 'Bu e-posta başka bir giriş yöntemiyle kayıtlı.';
    case 'auth/operation-not-allowed':
      return 'Bu giriş yöntemi henüz etkin değil (Firebase Console → Authentication).';
    default:
      return 'Bir şeyler ters gitti. Tekrar deneyin.';
  }
}

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useResolvedScheme() === 'dark';
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signUp, resetPassword, signInWithApple, signInWithGoogle, upgradeGuest, user } =
    useAuth();

  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<null | 'email' | 'password'>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Kişiselleştirmesini bitirmiş misafir kullanıcı: planını kaydetmek için hesap oluşturuyor.
  const fromOnboarding = Boolean(user?.isAnonymous);

  const showApple = isAppleSignInSupported();
  const showGoogle = isGoogleSignInSupported();

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const forgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!isValidEmailFormat(email)) {
      setError('Önce geçerli bir e-posta adresi gir.');
      return;
    }
    try {
      await resetPassword(email);
      setInfo('Şifre sıfırlama bağlantısı e-postana gönderildi.');
    } catch (e: any) {
      setError(authErrorMessage(e?.code ?? ''));
    }
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!isValidEmailFormat(email)) {
      setError('Geçerli bir e-posta adresi gir (örn. ad@gmail.com).');
      return;
    }
    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Şifre en az 8 karakter olmalı.');
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError('Şifre en az bir rakam içermeli.');
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (user?.isAnonymous) {
        // Misafir (onboarding'i yapmış) kullanıcı: aynı hesaba bağla ki plan/veri korunsun.
        await upgradeGuest(email, password);
        await clearGuestFlag(user.uid).catch(() => {});
      } else {
        await signUp(email, password);
      }
      // Başarılıysa kök yönlendirici otomatik olarak doğru ekrana götürür
      // (yeni kayıtlar önce e-posta doğrulama ekranına düşer).
    } catch (e: any) {
      setError(authErrorMessage(e?.code ?? ''));
    } finally {
      setBusy(false);
    }
  };

  const socialSignIn = async (provider: 'apple' | 'google') => {
    setError(null);
    setBusy(true);
    // Misafirsek (onboarding yapıldı) sosyal giriş aynı hesaba bağlanır; bayrağı sonra temizle.
    const wasGuestUid = user?.isAnonymous ? user.uid : null;
    try {
      if (provider === 'apple') await signInWithApple();
      else await signInWithGoogle();
      if (wasGuestUid) await clearGuestFlag(wasGuestUid).catch(() => {});
    } catch (e: any) {
      // Gerçek Firebase/Apple hata kodunu göster (teşhis için) — genel mesajla yutma.
      const code = e?.code ?? '';
      const base = provider === 'apple' ? 'Apple ile giriş tamamlanamadı.' : 'Google ile giriş tamamlanamadı.';
      const mapped = code ? authErrorMessage(code) : '';
      // Kod eşleşmediyse teşhis için ham detayı (kod veya mesaj) parantez içinde göster.
      const detail = code || (typeof e?.message === 'string' ? e.message.slice(0, 120) : '');
      setError(
        mapped && mapped !== 'Bir şeyler ters gitti. Tekrar deneyin.'
          ? mapped
          : `${base}${detail ? ` (${detail})` : ''}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const inputBorder = (field: 'email' | 'password') =>
    focused === field ? theme.primary : theme.border;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.four },
        ]}>
        {/* Geri (karşılama ekranına) */}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome' as Href))}
          hitSlop={8}
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>

        {/* Marka rozeti + başlık */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.three, marginTop: Spacing.three, marginBottom: Spacing.four }}>
          <View style={[styles.brandBadge, { backgroundColor: theme.primary }]}>
            <ThemedText style={{ fontSize: 26, lineHeight: 32 }}>🥕</ThemedText>
          </View>
          <View style={{ gap: Spacing.one }}>
            <ThemedText type="subtitle" style={{ fontSize: 30, lineHeight: 38 }}>
              {mode === 'signin' ? 'Tekrar hoş geldin' : 'Hesabını oluştur'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 15, lineHeight: 21 }}>
              {mode === 'signin'
                ? 'Hesabına giriş yap ve hedefine devam et.'
                : 'Birkaç saniyede hesap oluştur, planını kaydedelim.'}
            </ThemedText>
          </View>
        </Animated.View>

        {fromOnboarding && (
          <Animated.View entering={FadeIn.duration(400)} style={[styles.banner, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="sparkles" size={18} color={theme.primaryDark} />
            <ThemedText type="small" style={{ flex: 1, color: theme.primaryDark, fontSize: 13 }}>
              Planın hazır! Kaydetmek ve cihazların arasında eşitlemek için ücretsiz hesabını oluştur.
            </ThemedText>
          </Animated.View>
        )}

        {/* Giriş / Kayıt segmenti */}
        <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
          {(['signin', 'signup'] as Mode[]).map((m) => {
            const on = mode === m;
            return (
              <Pressable key={m} onPress={() => switchMode(m)} style={styles.segmentBtn}>
                {on && <View style={[styles.segmentPill, { backgroundColor: theme.card }]} />}
                <ThemedText
                  type="smallBold"
                  style={{ fontSize: 14, color: on ? theme.text : theme.textMuted }}>
                  {m === 'signin' ? 'Giriş yap' : 'Kayıt ol'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Sosyal girişler */}
        {(showApple || showGoogle) && (
          <>
            <View style={{ gap: Spacing.two }}>
              {showApple && (
                <PressableScale
                  onPress={() => socialSignIn('apple')}
                  disabled={busy}
                  style={[styles.socialBtn, { backgroundColor: isDark ? '#fff' : '#000' }]}>
                  <Ionicons name="logo-apple" size={20} color={isDark ? '#000' : '#fff'} />
                  <ThemedText type="smallBold" style={{ color: isDark ? '#000' : '#fff', fontSize: 16 }}>
                    Apple ile devam et
                  </ThemedText>
                </PressableScale>
              )}
              {showGoogle && (
                <PressableScale
                  onPress={() => socialSignIn('google')}
                  disabled={busy}
                  style={[styles.socialBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}>
                  <Ionicons name="logo-google" size={20} color={theme.text} />
                  <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                    Google ile devam et
                  </ThemedText>
                </PressableScale>
              )}
            </View>
            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
                veya e-posta ile
              </ThemedText>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>
          </>
        )}

        {/* E-posta */}
        <View style={[styles.input, { backgroundColor: theme.card, borderColor: inputBorder('email') }]}>
          <Ionicons name="mail-outline" size={18} color={focused === 'email' ? theme.primary : theme.textMuted} />
          <TextInput
            placeholder="E-posta"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={[styles.inputText, { color: theme.text }]}
          />
        </View>

        {/* Şifre */}
        <View style={[styles.input, { backgroundColor: theme.card, borderColor: inputBorder('password') }]}>
          <Ionicons name="lock-closed-outline" size={18} color={focused === 'password' ? theme.primary : theme.textMuted} />
          <TextInput
            placeholder="Şifre"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={[styles.inputText, { color: theme.text }]}
          />
          <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.textMuted}
            />
          </Pressable>
        </View>

        {mode === 'signup' && (
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
            Kayıttan sonra e-posta adresine doğrulama bağlantısı göndereceğiz.
          </ThemedText>
        )}

        {error && (
          <View style={[styles.notice, { backgroundColor: isDark ? '#3A1E18' : '#FFF0EC' }]}>
            <Ionicons name="alert-circle" size={16} color={theme.accent} />
            <ThemedText type="small" style={{ flex: 1, color: theme.accent, fontSize: 13 }}>
              {error}
            </ThemedText>
          </View>
        )}
        {info && (
          <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primaryDark} />
            <ThemedText type="small" style={{ flex: 1, color: theme.primaryDark, fontSize: 13 }}>
              {info}
            </ThemedText>
          </View>
        )}

        {mode === 'signin' && (
          <Pressable onPress={forgotPassword} style={{ alignSelf: 'flex-end' }} hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 13 }}>
              Şifremi unuttum
            </ThemedText>
          </Pressable>
        )}

        {/* Ana buton */}
        <PressableScale
          onPress={submit}
          disabled={busy}
          style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: busy ? 0.7 : 1 }]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
              {mode === 'signin' ? 'Giriş yap' : 'Hesap oluştur'}
            </ThemedText>
          )}
        </PressableScale>

        {/* Mod değiştir (alt bağlantı) */}
        <Pressable
          onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          style={{ alignSelf: 'center', marginTop: Spacing.two }}
          hitSlop={8}>
          <ThemedText type="small" themeColor="textSecondary">
            {mode === 'signin' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {mode === 'signin' ? 'Kaydol' : 'Giriş yap'}
            </ThemedText>
          </ThemedText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E9E73',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.pill,
    height: 48,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  segmentPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.pill,
    shadowColor: '#0F1B15',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.pill,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  primaryBtn: {
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
