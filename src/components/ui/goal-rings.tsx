/**
 * Günlük hedef halkaları — kalori/protein/su gibi metriklerin tamamlanma oranını
 * dairesel ilerleme halkalarıyla gösterir.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type GoalRing = {
  label: string;
  value: number;
  goal: number;
  color: string;
};

const SIZE = 76;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function Ring({ ring }: { ring: GoalRing }) {
  const theme = useTheme();
  const pct = ring.goal > 0 ? Math.max(0, Math.min(1, ring.value / ring.goal)) : 0;
  const offset = CIRC * (1 - pct);
  return (
    <View style={{ alignItems: 'center', gap: Spacing.one }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={theme.backgroundElement} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={ring.color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <ThemedText type="smallBold" style={{ fontSize: 13 }}>
            %{Math.round(pct * 100)}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {ring.label}
      </ThemedText>
    </View>
  );
}

export function GoalRings({ rings }: { rings: GoalRing[] }) {
  return (
    <View style={styles.row}>
      {rings.map((r) => (
        <Ring key={r.label} ring={r} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
