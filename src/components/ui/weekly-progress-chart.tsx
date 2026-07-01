import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ChartPoint = {
  /** Kısa eksen etiketi (Pzt, Sal, ...). */
  label: string;
  /** Çizilecek değer. */
  value: number;
};

type WeeklyProgressChartProps = {
  data: ChartPoint[];
  /** Vurgulanacak (ör. bugün) veri noktasının indeksi. */
  highlightIndex?: number;
};

const CHART_HEIGHT = 160;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 14;
const GRID_LINES = 3;

/**
 * Catmull-Rom -> kübik bezier ile yumuşatılmış bir çizgi yolu üretir.
 * react-native-svg `Path` için "d" string'i döndürür.
 */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/**
 * Haftalık aktivite çizgi grafiği.
 * Genişliği kapsayıcıdan (onLayout) ölçer; gerçek SVG ile çizer.
 * Renkler tema sisteminden gelir — uygulamanın mint paletine uyumludur.
 */
export function WeeklyProgressChart({ data, highlightIndex }: WeeklyProgressChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Düz bir çizgi olmaması için aralığı hafifçe genişlet.
  const span = Math.max(max - min, 1);
  const top = max + span * 0.2;
  const bottom = Math.max(min - span * 0.2, 0);

  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const toX = (i: number) =>
    data.length <= 1 ? width / 2 : (i / (data.length - 1)) * width;
  const toY = (v: number) =>
    PADDING_TOP + (1 - (v - bottom) / (top - bottom)) * innerHeight;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const linePath = buildSmoothPath(points);
  const areaPath =
    linePath && width > 0
      ? `${linePath} L ${points[points.length - 1].x},${CHART_HEIGHT - PADDING_BOTTOM} L ${points[0].x},${CHART_HEIGHT - PADDING_BOTTOM} Z`
      : '';

  return (
    <View>
      <View
        style={{ height: CHART_HEIGHT, width: '100%' }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="weeklyArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.primary} stopOpacity={0.22} />
                <Stop offset="1" stopColor={theme.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Yatay ızgara çizgileri */}
            {Array.from({ length: GRID_LINES }).map((_, i) => {
              const y = PADDING_TOP + (innerHeight / (GRID_LINES - 1)) * i;
              return (
                <Path
                  key={`grid-${i}`}
                  d={`M 0,${y} L ${width},${y}`}
                  stroke={theme.border}
                  strokeWidth={1}
                />
              );
            })}

            {/* Alan dolgusu */}
            {areaPath ? <Path d={areaPath} fill="url(#weeklyArea)" /> : null}

            {/* Çizgi */}
            <Path
              d={linePath}
              fill="none"
              stroke={theme.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Veri noktaları */}
            {points.map((p, i) => {
              const active = i === highlightIndex;
              return (
                <Circle
                  key={`dot-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={active ? 6 : 3.5}
                  fill={active ? theme.primary : theme.card}
                  stroke={theme.primary}
                  strokeWidth={active ? 3 : 2}
                />
              );
            })}
          </Svg>
        )}
      </View>

      {/* Gün etiketleri */}
      <View style={styles.labels}>
        {data.map((d, i) => (
          <ThemedText
            key={d.label}
            type="small"
            themeColor={i === highlightIndex ? 'primary' : 'textSecondary'}
            style={[styles.label, i === highlightIndex && styles.labelActive]}>
            {d.label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  label: {
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: '700',
  },
});
