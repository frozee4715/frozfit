import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

type Mode = 'signin' | 'signup';

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
      return 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Biraz sonra tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı yok gibi görünüyor.';
    default:
      return 'Bir şeyler ters gitti. Tekrar deneyin.';
  }
}

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInGuest, resetPassword, user } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const forgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email.includes('@')) {
      setError('Önce e-posta adresini gir.');
      return;
    }
    try {
      await resetPassword(email);
      setInfo('Şifre sıfırlama bağlantısı e-postana gönderildi.');
    } catch (e: any) {
      setError(authErrorMessage(e?.code ?? ''));
    }
  };

  // Misafir süresi dolmuş kullanıcı buraya yönlendirildiyse uyarı göster.
  const guestExpired = Boolean(user?.isAnonymous);

  const submit = async () => {
    setError(null);
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
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
      // Başarılıysa kök yönlendirici otomatik olarak doğru ekrana götürür.
    } catch (e: any) {
      setError(authErrorMessage(e?.code ?? ''));
    } finally {
      setBusy(false);
    }
  };

  const continueAsGuest = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGuest();
    } catch {
      setError('Misafir girişi şu an yapılamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { paddingTop: insets.top + Spacing.six }]}>
        {/* Logo / başlık */}
        <View style={{ alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.five }}>
          <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="leaf" size={36} color={theme.primary} />
          </View>
          <ThemedText type="subtitle" style={{ fontSize: 30 }}>
            FrozFit
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            {mode === 'signin'
              ? 'Hesabına giriş yap ve hedefine devam et.'
              : 'Birkaç saniyede hesap oluştur, sana özel plan hazırlayalım.'}
          </ThemedText>
        </View>

        {guestExpired && (
          <View style={[styles.banner, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="time-outline" size={18} color={theme.primaryDark} />
            <ThemedText type="small" style={{ flex: 1, color: theme.primaryDark, fontSize: 13 }}>
              Misafir deneme süren doldu. Verilerini kaydetmek için ücretsiz hesap oluştur.
            </ThemedText>
          </View>
        )}

        {/* E-posta */}
        <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
          <TextInput
            placeholder="E-posta"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={[styles.inputText, { color: theme.text }]}
          />
        </View>

        {/* Şifre */}
        <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
          <TextInput
            placeholder="Şifre"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[styles.inputText, { color: theme.text }]}
          />
        </View>

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}
        {info && (
          <ThemedText type="small" style={{ color: theme.primary, fontSize: 13 }}>
            {info}
          </ThemedText>
        )}

        {mode === 'signin' && (
          <Pressable onPress={forgotPassword} style={{ alignSelf: 'flex-end' }}>
            <ThemedText type="small" style={{ color: theme.primary, fontSize: 13 }}>
              Şifremi unuttum
            </ThemedText>
          </Pressable>
        )}

        {/* Ana buton */}
        <Pressable
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
        </Pressable>

        {/* Mod değiştir */}
        <Pressable
          onPress={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
          }}
          style={{ alignSelf: 'center' }}>
          <ThemedText type="small" themeColor="textSecondary">
            {mode === 'signin' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {mode === 'signin' ? 'Kaydol' : 'Giriş yap'}
            </ThemedText>
          </ThemedText>
        </Pressable>

        {/* Ayırıcı + misafir */}
        {!guestExpired && (
          <>
            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
                veya
              </ThemedText>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>
            <Pressable
              onPress={continueAsGuest}
              disabled={busy}
              style={[styles.guestBtn, { borderColor: theme.border }]}>
              <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 15 }}>
                Misafir olarak dene
              </ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
              Misafir denemesi 7 gün sürer.
            </ThemedText>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 52,
    borderRadius: Radius.md,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  primaryBtn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
