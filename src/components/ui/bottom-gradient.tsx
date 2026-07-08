import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Görsel üstü alt-degrade: fotoğrafın altını yumuşakça karartır ki
 * üzerindeki beyaz metin her fotoğrafta okunaklı kalsın.
 * (expo-linear-gradient yerine mevcut react-native-svg kullanılır —
 * yeni native modül gerektirmez.)
 */
export function BottomGradient({ opacity = 0.72 }: { opacity?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="bottomGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity={String(opacity)} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#bottomGradient)" />
    </Svg>
  );
}
