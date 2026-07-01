import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Giriş animasyonunu kapatmak için (varsayılan açık). */
  animated?: boolean;
};

/**
 * Tüm ekranlar için ortak kapsayıcı:
 * - tema arka planı
 * - güvenli alan (çentik / alt çubuk) boşlukları
 * - opsiyonel kaydırma
 * - içerik için yumuşak giriş animasyonu (aşağıdan yukarı belirme)
 */
export function Screen({ children, scroll = true, contentStyle, animated = true }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: insets.top + Spacing.two,
    paddingBottom: insets.bottom + Spacing.six,
    paddingHorizontal: Spacing.three,
  };

  const inner = (
    <Animated.View
      entering={animated ? FadeInDown.duration(320).springify().damping(18) : undefined}
      style={[styles.inner, !scroll && { flex: 1 }]}>
      {children}
    </Animated.View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[padding, contentStyle]}
        showsVerticalScrollIndicator={false}>
        {inner}
      </ScrollView>
    );
  }

  return (
    <View style={[{ backgroundColor: theme.background, flex: 1 }, padding, contentStyle]}>{inner}</View>
  );
}

const styles = StyleSheet.create({
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
});
