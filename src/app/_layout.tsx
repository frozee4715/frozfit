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
import { PremiumProvider } from '@/lib/premium';
import { SettingsProvider, useResolvedScheme } from '@/lib/settings';
import { useUserProfile } from '@/lib/user-profile';

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

/**
 * Oturum/onboarding durumuna göre yönlendiren "kapı".
 * - Giriş yoksa  → /login
 * - Giriş var, onboarding yoksa → /onboarding
 * - Misafir süresi dolduysa → /login
 */
function RootNavigator() {
  const { user, loading: authLoading, configured } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();
  // Root navigator mount olmadan router.replace çağırmak "not handled by any
  // navigator" hatası verir; key gelene kadar yönlendirmeyi bekletiyoruz.
  const navState = useRootNavigationState();

  const ready = configured ? !authLoading && !profileLoading : true;

  useEffect(() => {
    if (!navState?.key) return;
    if (!ready) return;

    // Firebase yapılandırılmamışsa kapı devre dışı — uygulama mock ile açılır.
    if (!configured) return;

    const onLogin = pathname.startsWith('/login');
    const onOnboarding = pathname.startsWith('/onboarding');

    if (!user) {
      if (!onLogin) router.replace('/login');
      return;
    }
    // Misafirler artık ani şekilde kilitlenmez ("değer-önce" strateji); bunun
    // yerine kalıcı aksiyonlar useAccountGate ile hesap oluşturmaya yönlendirir.
    if (!profile?.onboardedAt) {
      if (!onOnboarding) router.replace('/onboarding');
      return;
    }
    // Her şey tamam: auth/onboarding ekranındaysa ana uygulamaya gönder.
    // Not: typedRoutes bu projede '/' köküne tip üretmiyor; çalışma zamanı doğru.
    if (onLogin || onOnboarding) router.replace('/' as Href);
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
        }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
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
