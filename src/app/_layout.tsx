import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { type Href, Stack, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AiCreditsProvider } from '@/lib/ai-credits';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { consumeReturningToLogin } from '@/lib/auth-flow';
import { PremiumProvider } from '@/lib/premium';
import { SettingsProvider, useResolvedScheme } from '@/lib/settings';
import { isGuestExpired, useUserProfile } from '@/lib/user-profile';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AuthProvider>
            <PremiumProvider>
              <AiCreditsProvider>
                <ThemedRoot />
              </AiCreditsProvider>
            </PremiumProvider>
          </AuthProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Tema modunu (ayarlardan) uygulayan sarmalayıcı. */
function ThemedRoot() {
  const isDark = useResolvedScheme() === 'dark';
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </ThemeProvider>
  );
}

/** E-posta/şifre hesabı olup adresini henüz doğrulamamış kullanıcı mı? */
function needsEmailVerification(user: { isAnonymous: boolean; emailVerified: boolean; providerData: { providerId: string }[] } | null): boolean {
  if (!user || user.isAnonymous) return false;
  const isPasswordAccount = user.providerData.some((p) => p.providerId === 'password');
  return isPasswordAccount && !user.emailVerified;
}

/**
 * Oturum/onboarding durumuna göre yönlendiren "kapı" — ÖNCE kişiselleştirme akışı.
 * - Oturum yoksa (yeni kullanıcı) → sessiz misafir oturumu + /onboarding (önce kişiselleştirme)
 * - Oturum yoksa ama ÇIKIŞ yapıldıysa (dönen kullanıcı) → /login
 * - Misafir + onboarding bitti → ANA UYGULAMA ("Ücretsiz başla" sözü tutulur);
 *   hesap yalnızca 7 günlük deneme dolunca zorunlu olur
 * - E-posta doğrulanmadıysa → /verify-email (sahte adres engeli)
 * - Her şey tamamsa → ana uygulama
 */
function RootNavigator() {
  const { user, loading: authLoading, configured } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();
  // Root navigator mount olmadan router.replace çağırmak "not handled by any
  // navigator" hatası verir; key gelene kadar yönlendirmeyi bekletiyoruz.
  const navState = useRootNavigationState();
  // Ekran geçişlerinde altta koyu/siyah bir yüzey görünmesin diye her ekrana
  // tema arka planı verilir (react-native-screens siyah-ekran hatasına karşı).
  const colors = Colors[useResolvedScheme()];

  const ready = configured ? !authLoading && !profileLoading : true;

  useEffect(() => {
    if (!navState?.key) return;
    if (!ready) return;

    // Firebase yapılandırılmamışsa kapı devre dışı — uygulama mock ile açılır.
    if (!configured) return;

    const onLogin = pathname.startsWith('/login');
    const onWelcome = pathname.startsWith('/welcome');
    const onVerify = pathname.startsWith('/verify-email');
    const onOnboarding = pathname.startsWith('/onboarding');

    if (!user) {
      // Hesabı olup çıkış yapan kullanıcı: onboarding'e değil, girişe götür.
      if (consumeReturningToLogin()) {
        if (!onLogin) router.replace({ pathname: '/login', params: { mode: 'signin' } } as Href);
        return;
      }
      // Giriş/karşılama/doğrulama/onboarding ekranlarındaysa dokunma
      // (kullanıcı bu akışların içinde ilerliyor).
      if (onLogin || onWelcome || onVerify || onOnboarding) return;
      // Yeni kullanıcı: önce KARŞILAMA ekranı. Sosyal giriş oradan sıfır sürtünme;
      // "Ücretsiz başla" ise misafir oturumu açar → kapı onboarding'e götürür.
      router.replace('/welcome' as Href);
      return;
    }
    // Sahte e-posta engeli: doğrulanmamış e-posta hesapları içeri giremez.
    if (needsEmailVerification(user)) {
      if (!onVerify) router.replace('/verify-email' as Href);
      return;
    }
    // Misafir (anonim) akışı: önce kişiselleştirme, sonra uygulamaya SERBEST giriş.
    if (user.isAnonymous) {
      // Onboarding tamamlanmadıysa oraya götür.
      if (!profile?.onboardedAt) {
        if (!onOnboarding) router.replace('/onboarding');
        return;
      }
      // 7 günlük deneme dolduysa hesap oluşturma zorunlu.
      if (isGuestExpired(profile)) {
        if (!onLogin) router.replace({ pathname: '/login', params: { mode: 'signup' } } as Href);
        return;
      }
      // Deneme sürüyor: misafir uygulamayı kullanır. /login'den ATMA —
      // hesaba yükseltmek için kendi isteğiyle gitmiş olabilir.
      if (onWelcome || onOnboarding || onVerify) router.replace('/' as Href);
      return;
    }
    // Gerçek hesap (Google/Apple/e-posta): onboarding YAPILMAMIŞSA önce oraya
    // götür. Aksi halde boy/kilo/hedef alınmadan uygulamaya girilir; plan/kalori
    // hesaplanamaz ve profile bağlı ekranlar boş/hatalı görünür. İlk girişte
    // bir kez onboarding, sonra serbest kullanım.
    if (!profile?.onboardedAt) {
      if (!onOnboarding) router.replace('/onboarding');
      return;
    }
    // Her şey tamam: auth/onboarding ekranındaysa ana uygulamaya gönder.
    // Not: typedRoutes bu projede '/' köküne tip üretmiyor; çalışma zamanı doğru.
    if (onLogin || onWelcome || onVerify || onOnboarding) router.replace('/' as Href);
  }, [navState?.key, ready, configured, user, profile, pathname, router]);

  // Stack HER ZAMAN render edilir; aksi halde route'lar kayıtlı olmaz ve
  // router.replace('/onboarding') "not handled by any navigator" hatası verir.
  // Yükleme süresince Stack'in üzerine bir overlay konur (içerik sızmasın diye).
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 260,
          gestureEnabled: true,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-email" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="history" />
        <Stack.Screen name="community" />
        <Stack.Screen name="share-recipe" />
        <Stack.Screen name="coach" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="blocked-users" />
        <Stack.Screen name="help" />
        <Stack.Screen name="upgrade" />
        <Stack.Screen name="meal-plan" />
        <Stack.Screen name="shopping-list" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="photo-meal" />
        <Stack.Screen name="fridge-scan" />
        <Stack.Screen name="workout" />
        <Stack.Screen name="challenges" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="premium" options={{ animation: 'slide_from_bottom', animationDuration: 320 }} />
        <Stack.Screen name="get-credits" options={{ animation: 'slide_from_bottom', animationDuration: 320 }} />
      </Stack>
      {!ready && <LoadingOverlay />}
    </>
  );
}

function LoadingOverlay() {
  const colors = Colors[useResolvedScheme()];
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
