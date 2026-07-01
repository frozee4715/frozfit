import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  /** 0..1 arası doluluk oranı. */
  progress: number;
  color: string;
  height?: number;
};

export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[styles.track, { backgroundColor: theme.backgroundElement, height, borderRadius: height }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: Radius.pill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
