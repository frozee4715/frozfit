/**
 * Basıldığında hafifçe küçülen (yaylanan) dokunsal Pressable.
 * Kart ve butonlara modern, "canlı" bir his katar.
 */
import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  children: ReactNode;
  style?: ViewStyle;
  /** En küçülme oranı (varsayılan 0.97). */
  activeScale?: number;
};

export function PressableScale({ children, style, activeScale = 0.97, ...props }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        scale.value = withSpring(activeScale, { damping: 18, stiffness: 320 });
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 });
        props.onPressOut?.(e);
      }}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
