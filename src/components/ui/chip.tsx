import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Seçilebilir etiket (kategori filtresi, malzeme vb.). */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
        selected && styles.chipSelected,
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: selected ? '#FFFFFF' : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // Gölge YOK: yuvarlak köşe + kenarlık + gölge birlikteyken iOS'un border görseli
  // yeniden çizimi Hermes GC ile yarışıp çökmeye yol açıyor (bkz. tab-bar.tsx).
  // Seçim zaten dolu arka plan rengiyle net biçimde belli oluyor.
  chipSelected: {
    elevation: 4,
  },
});
