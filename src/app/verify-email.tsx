/**
 * E-posta doğrulama ekranı.
 *
 * E-posta/şifre ile kayıt olan kullanıcılar, adreslerine gönderilen bağlantıya
 * tıklayana kadar bu ekranda tutulur (kök yönlendirici zorlar). Böylece
 * "veysi@veysii.com" gibi gerçek olmayan adreslerle uygulama kullanılamaz.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { flagReturningToLogin } from '@/lib/auth-flow';

const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, resendVerification, reloadUser, signOut } = useAuth();

  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Doğrulama genelde başka cihazda/mail uygulamasında yapılır; arka planda
  // periyodik kontrol et ki kullanıcı dönünce otomatik içeri girsin.
  const reloadRef = useRef(reloadUser);
  reloadRef.current = reloadUser;
  useEffect(() => {
    const timer = setInterval(() => {
      reloadRef.current().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Tekrar gönder butonu için geri sayım.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await resendVerification();
      setInfo('Doğrulama e-postası tekrar gönderildi. Gelen kutunu ve spam klasörünü kontrol et.');
      setCooldown(RESEND_COOLDOWN_S);
    } catch (e: any) {
      if (e?.code === 'auth/too-many-requests') {
        setError('Çok sık denendi. Birkaç dakika sonra tekrar dene.');
        setCooldown(RESEND_COOLDOWN_S);
      } else {
        setError('E-posta gönderilemedi. Tekrar dene.');
      }
    }
  };

  const check = async () => {
    setError(null);
    setInfo(null);
    setChecking(true);
    try {
      await reloadUser();
      // Doğrulandıysa kök yönlendirici otomatik olarak içeri alır.
      if (!user?.emailVerified) {
        setInfo('Henüz doğrulanmamış görünüyor. Bağlantıya tıkladıktan sonra tekrar dene.');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.six,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <View style={{ alignItems: 'center', gap: Spacing.three }}>
        <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="mail-unread-outline" size={40} color={theme.primaryDark} />
        </View>
        <ThemedText type="subtitle" style={{ fontSize: 26, textAlign: 'center' }}>
          E-postanı doğrula
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={{ fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
          <ThemedText type="smallBold" style={{ fontSize: 15 }}>
            {user?.email ?? 'adresine'}
          </ThemedText>
          {'\n'}adresine bir doğrulama bağlantısı gönderdik.{'\n'}
          Bağlantıya tıkladıktan sonra uygulama otomatik açılır.
        </ThemedText>
      </View>

      <View style={{ gap: Spacing.three }}>
        {info && (
          <ThemedText type="small" style={{ color: theme.primary, fontSize: 13, textAlign: 'center' }}>
            {info}
          </ThemedText>
        )}
        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13, textAlign: 'center' }}>
            {error}
          </ThemedText>
        )}

        <Pressable
          onPress={check}
          disabled={checking}
          style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: checking ? 0.7 : 1 }]}>
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
              Doğruladım, kontrol et
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={resend}
          disabled={cooldown > 0}
          style={[
            styles.secondaryBtn,
            { borderColor: theme.border, opacity: cooldown > 0 ? 0.5 : 1 },
          ]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 15 }}>
            {cooldown > 0 ? `Tekrar gönder (${cooldown}s)` : 'E-postayı tekrar gönder'}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => {
            flagReturningToLogin();
            signOut();
          }}
          style={{ alignSelf: 'center' }}
          hitSlop={8}>
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
            Farklı bir hesapla giriş yap
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
