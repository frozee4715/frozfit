/**
 * Onboarding, profil düzenleme ve tarif paylaşımı ekranlarının ortak form parçaları.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Etiketli alan sarmalayıcı. */
export function Field({
  label,
  children,
  hint,
  style,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  return (
    <View style={[{ gap: Spacing.two }, style]}>
      <ThemedText type="smallBold" style={{ fontSize: 14 }}>
        {label}
      </ThemedText>
      {children}
      {hint && (
        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

/** Tek satırlık metin girişi (kutu stilli). */
export function TextField({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
      <TextInput
        placeholderTextColor={theme.textMuted}
        style={[styles.inputText, { color: theme.text }, style]}
        {...props}
      />
    </View>
  );
}

/** Çok satırlı metin girişi (tarif adımları, açıklama vb.). */
export function TextArea({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <View style={[styles.textAreaBox, { backgroundColor: theme.backgroundElement }]}>
      <TextInput
        placeholderTextColor={theme.textMuted}
        multiline
        textAlignVertical="top"
        style={[styles.textArea, { color: theme.text }, style]}
        {...props}
      />
    </View>
  );
}

/** Sadece sayı kabul eden giriş. */
export function NumberInput({
  value,
  onChangeText,
  placeholder,
  maxLength = 6,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={maxLength}
        style={[styles.inputText, { color: theme.text }]}
      />
    </View>
  );
}

/** Eşit genişlikte seçim hapı (cinsiyet, öğün sayısı vb.). */
export function SelectPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? '#fff' : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Başlık + ipucu + onay işareti olan seçilebilir satır (aktivite, mutfak vakti). */
export function OptionRow({
  title,
  hint,
  selected,
  onPress,
}: {
  title: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionRow,
        {
          backgroundColor: selected ? theme.primarySoft : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold" style={{ fontSize: 15 }}>
          {title}
        </ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
            {hint}
          </ThemedText>
        )}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? theme.primary : theme.textMuted}
      />
    </Pressable>
  );
}

/** Plan önizleme istatistik hücresi. */
export function PlanStatItem({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 2, flex: 1 }}>
      <ThemedText type="smallBold" style={{ color, fontSize: 18 }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 11 }}>
        {unit}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {label}
      </ThemedText>
    </View>
  );
}

export const formStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    height: 50,
    borderRadius: Radius.md,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  textAreaBox: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 90,
  },
  textArea: {
    fontSize: 16,
    minHeight: 74,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
