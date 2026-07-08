/**
 * Aktif tema renkleri. Tema modu (açık/koyu/sistem) ve özel renk teması
 * (Premium aksan paleti) ayarlardan gelir.
 */
import { Accents, Colors, type ThemeColor } from '@/constants/theme';
import { useResolvedScheme, useSettings } from '@/lib/settings';

export function useTheme(): Record<ThemeColor, string> {
  const scheme = useResolvedScheme();
  const { accent } = useSettings();
  const override = Accents[accent]?.[scheme] ?? {};
  return { ...Colors[scheme], ...override };
}
