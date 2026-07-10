import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/ui/tab-bar';
import { useT } from '@/lib/i18n';

export default function TabsLayout() {
  const t = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // 'shift' animasyonu New Architecture + Reanimated'da sekme içeriğini
        // bazen boş (siyah/beyaz) bırakıyordu; kararlı geçiş için animasyon yok.
        animation: 'none',
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t('tab.discover') }} />
      <Tabs.Screen name="tracker" options={{ title: t('tab.tracker') }} />
      <Tabs.Screen name="chef" options={{ title: t('tab.chef') }} />
      <Tabs.Screen name="exercises" options={{ title: t('tab.exercises') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile') }} />
    </Tabs>
  );
}
