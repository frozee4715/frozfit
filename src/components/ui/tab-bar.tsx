import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Her sekmenin ikonu + kısa etiketi (referanstaki ikon-öncelikli sade dizilim). */
const TAB_META: Record<string, { icon: string; label: string }> = {
  index: { icon: 'compass-outline', label: 'Keşfet' },
  tracker: { icon: 'pie-chart-outline', label: 'Takip' },
  chef: { icon: 'sparkles-outline', label: 'Şef' },
  exercises: { icon: 'barbell-outline', label: 'Antrenman' },
  profile: { icon: 'person-outline', label: 'Profil' },
};

/**
 * Yüzen (floating) hap şeklinde alt menü.
 * Ekranın altından ayrık durur, koyu/yumuşak kart yüzeyi + gölge ile "premium"
 * hissi verir. Aktif sekme dolu yeşil bir daire içinde vurgulanır.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + Spacing.two }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.card,
            shadowColor: '#000',
          },
        ]}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;

          const focused = state.index === index;
          const iconName = (focused ? meta.icon.replace('-outline', '') : meta.icon) as any;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={meta.label}
              style={styles.item}>
              <View
                style={[
                  styles.iconWrap,
                  focused && { backgroundColor: theme.primary },
                ]}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={focused ? '#0B140F' : theme.tabInactive}
                />
              </View>
              {focused && (
                <ThemedText
                  type="small"
                  style={[styles.label, { color: theme.primary }]}
                  numberOfLines={1}>
                  {meta.label}
                </ThemedText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Kenarlık YOK: yuvarlak köşe + hairline kenarlık + gölge birlikteyken iOS
  // her traitCollectionDidChange'de (sekme geçişi, boyut değişimi) border görselini
  // yeniden çiziyor ve bu çizim JS thread'indeki Hermes GC ile yarışıp çökmeye
  // yol açıyordu. Gölge zaten çubuğu zeminden ayırıyor.
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    ...Platform.select({ web: { maxWidth: 420 } }),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    paddingRight: Spacing.three,
  },
});
