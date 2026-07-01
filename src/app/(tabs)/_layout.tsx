import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useT } from '@/lib/i18n';
import { useResolvedScheme } from '@/lib/settings';

/** Odaklanınca dolu ikona geçen + hafifçe büyüyen sekme ikonu. */
function TabIcon({
  focused,
  color,
  size,
  name,
}: {
  focused: boolean;
  color: string;
  size: number;
  name: string;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 240 });
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconName = (focused ? name.replace('-outline', '') : name) as any;
  return (
    <Animated.View style={style}>
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const isDark = useResolvedScheme() === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const t = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.discover'),
          tabBarIcon: (p) => <TabIcon {...p} name="compass-outline" />,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: t('tab.tracker'),
          tabBarIcon: (p) => <TabIcon {...p} name="pie-chart-outline" />,
        }}
      />
      <Tabs.Screen
        name="chef"
        options={{
          title: t('tab.chef'),
          tabBarIcon: (p) => <TabIcon {...p} name="sparkles-outline" />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: t('tab.exercises'),
          tabBarIcon: (p) => <TabIcon {...p} name="barbell-outline" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarIcon: (p) => <TabIcon {...p} name="person-outline" />,
        }}
      />
    </Tabs>
  );
}
