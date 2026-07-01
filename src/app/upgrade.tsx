import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Field, TextField } from '@/components/ui/form';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { clearGuestFlag } from '@/lib/user-profile';

function upgradeError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta zaten kayıtlı. Farklı bir e-posta dene.';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    default:
      return 'Hesap oluşturulamadı. Tekrar dene.';
  }
}

export default function UpgradeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, upgradeGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = email.includes('@') && password.length >= 6;

  const submit = async () => {
    if (!valid || !user) return;
    setError(null);
    setBusy(true);
    try {
      await upgradeGuest(email, password);
      await clearGuestFlag(user.uid);
      router.back();
    } catch (e: any) {
      setError(upgradeError(e?.code ?? ''));
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + Spacing.two, backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={{ fontSize: 18 }}>
          Hesap oluştur
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <View style={[styles.banner, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.primaryDark} />
          <ThemedText type="small" style={{ flex: 1, color: theme.primaryDark, fontSize: 13 }}>
            Mevcut verilerin (plan, kayıtlar, favoriler) korunur — sadece kalıcı bir hesaba bağlanır.
          </ThemedText>
        </View>

        <Field label="E-posta">
          <TextField
            placeholder="ornek@eposta.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Field>

        <Field label="Şifre" hint="En az 6 karakter">
          <TextField placeholder="••••••" value={password} onChangeText={setPassword} secureTextEntry />
        </Field>

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}

        <Pressable
          onPress={submit}
          disabled={!valid || busy}
          style={[styles.btn, { backgroundColor: valid ? theme.primary : theme.backgroundSelected, opacity: busy ? 0.7 : 1 }]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
              Hesabı oluştur
            </ThemedText>
          )}
        </Pressable>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  btn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
