/**
 * Basıldığında hafifçe küçülen (yaylanan) dokunsal Pressable.
 * Kart ve butonlara modern, "canlı" bir his katar.
 */
import { type ReactNode, useEffect } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** En küçülme oranı (varsayılan 0.97). */
  activeScale?: number;
};

export function PressableScale({ children, style, activeScale = 0.97, ...props }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Sekme değişiminde onlarca kart aynı anda unmount olur; o an uçuşta olan yay
  // animasyonu iptal edilmezse UI runtime ölü shared value'ya yazmaya devam eder.
  useEffect(() => () => cancelAnimation(scale), [scale]);

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
