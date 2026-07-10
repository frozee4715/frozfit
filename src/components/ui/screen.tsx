import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Eski API uyumu için duruyor; giriş animasyonu artık kullanılmıyor. */
  animated?: boolean;
};

/**
 * Tüm ekranlar için ortak kapsayıcı:
 * - tema arka planı
 * - güvenli alan (çentik / alt çubuk) boşlukları
 * - opsiyonel kaydırma
 * Not: içerik giriş animasyonu kullanıcı geri bildirimiyle kaldırıldı (rahatsız ediciydi).
 */
export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: insets.top + Spacing.two,
    // Yüzen alt menüyü (inset + ~68px) rahatça geçecek kadar boşluk.
    paddingBottom: insets.bottom + Spacing.six + Spacing.four,
    paddingHorizontal: Spacing.three,
  };

  const inner = <View style={[styles.inner, !scroll && { flex: 1 }]}>{children}</View>;

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
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
