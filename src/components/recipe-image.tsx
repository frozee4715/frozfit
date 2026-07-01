import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageContentFit } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Görsel URL'i. Boş, null ya da yüklenemezse placeholder gösterilir. */
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  transition?: number;
  /** Placeholder ikon boyutu. */
  iconSize?: number;
};

/**
 * Tarif görseli — boş ya da bozuk (404) URL'lerde kocaman boşluk yerine
 * mint zeminli yemek ikonu placeholder'ı gösterir. Tüm tarif kartlarında ortak.
 */
export function RecipeImage({ uri, style, contentFit = 'cover', transition = 250, iconSize = 40 }: Props) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  // URL değişince hata durumunu sıfırla (liste yeniden kullanımında doğru davranış).
  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return (
      <View style={[style as StyleProp<ViewStyle>, styles.placeholder, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="restaurant-outline" size={iconSize} color={theme.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
