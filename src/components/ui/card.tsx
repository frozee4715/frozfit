import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  children: ReactNode;
  padded?: boolean;
};

/** Yumuşak köşeli, hafif gölgeli yüzey kartı. */
export function Card({ children, padded = true, style, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          padding: padded ? Spacing.three : 0,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0F1B15',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
