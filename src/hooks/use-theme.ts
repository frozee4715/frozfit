/**
 * Aktif tema renkleri. Tema modu (açık/koyu/sistem) ayarlardan gelir.
 */
import { Colors } from '@/constants/theme';
import { useResolvedScheme } from '@/lib/settings';

export function useTheme() {
  const scheme = useResolvedScheme();
  return Colors[scheme];
}
