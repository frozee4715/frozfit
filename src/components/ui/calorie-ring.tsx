import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type CalorieRingProps = {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
};

/** Dairesel kalori ilerleme göstergesi (kalan kaloriyi ortada gösterir). */
export function CalorieRing({ consumed, goal, size = 180, strokeWidth = 16 }: CalorieRingProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, consumed / goal));
  const remaining = Math.max(0, goal - consumed);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.backgroundElement}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.calorie}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <ThemedText type="title" style={{ fontSize: 40, lineHeight: 44 }}>
          {remaining}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          kalori kaldı
        </ThemedText>
      </View>
    </View>
  );
}
