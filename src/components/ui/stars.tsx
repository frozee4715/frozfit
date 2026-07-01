/**
 * Yıldız puanı — salt gösterim (`Stars`) veya seçim (`StarInput`).
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const GOLD = '#F5A623';

/** Salt gösterim; yarım yıldızları da destekler. */
export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline';
        return (
          <Ionicons
            key={i}
            name={name}
            size={size}
            color={rating >= i - 0.5 ? GOLD : theme.textMuted}
          />
        );
      })}
    </View>
  );
}

/** Dokunarak puan seçimi (1-5). */
export function StarInput({
  value,
  onChange,
  size = 30,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={6}>
          <Ionicons name={value >= i ? 'star' : 'star-outline'} size={size} color={value >= i ? GOLD : theme.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}
