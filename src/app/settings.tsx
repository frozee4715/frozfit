import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Field, OptionRow } from '@/components/ui/form';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/lib/i18n';
import { type Language, type ThemeMode, type WeightUnit, useSettings } from '@/lib/settings';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { themeMode, weightUnit, language, setThemeMode, setWeightUnit, setLanguage } = useSettings();

  const themeOptions: { value: ThemeMode; title: string }[] = [
    { value: 'system', title: t('settings.theme.system') },
    { value: 'light', title: t('settings.theme.light') },
    { value: 'dark', title: t('settings.theme.dark') },
  ];

  const unitOptions: { value: WeightUnit; title: string }[] = [
    { value: 'kg', title: 'Kilogram (kg)' },
    { value: 'lb', title: 'Pound (lb)' },
  ];

  const languageOptions: { value: Language; title: string }[] = [
    { value: 'tr', title: t('settings.language.tr') },
    { value: 'en', title: t('settings.language.en') },
  ];

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
          {t('settings.title')}
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <Field label={t('settings.language')}>
          <View style={{ gap: Spacing.two }}>
            {languageOptions.map((o) => (
              <OptionRow
                key={o.value}
                title={o.title}
                selected={language === o.value}
                onPress={() => setLanguage(o.value)}
              />
            ))}
          </View>
        </Field>

        <Field label={t('settings.theme')}>
          <View style={{ gap: Spacing.two }}>
            {themeOptions.map((o) => (
              <OptionRow
                key={o.value}
                title={o.title}
                selected={themeMode === o.value}
                onPress={() => setThemeMode(o.value)}
              />
            ))}
          </View>
        </Field>

        <Field label={t('settings.weightUnit')}>
          <View style={{ gap: Spacing.two }}>
            {unitOptions.map((o) => (
              <OptionRow
                key={o.value}
                title={o.title}
                selected={weightUnit === o.value}
                onPress={() => setWeightUnit(o.value)}
              />
            ))}
          </View>
        </Field>
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
});
