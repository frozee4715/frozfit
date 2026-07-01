import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTrackingHistory } from '@/lib/tracking-history';
import { useUserProfile } from '@/lib/user-profile';
import { useWeightLog } from '@/lib/weight-log';

type Badge = {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  desc: string;
  earned: boolean;
};

export default function AchievementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { days, streak } = useTrackingHistory();
  const { profile } = useUserProfile();
  const { latest } = useWeightLog();

  const loggedDays = days.filter((d) => d.mealCount > 0).length;
  const maxWater = days.reduce((m, d) => Math.max(m, d.water), 0);
  const favCount = profile?.favorites?.length ?? 0;

  // Kilo hedefine ilerleme
  const startW = profile?.weight ?? 0;
  const targetW = profile?.targetWeight ?? 0;
  const currentW = latest?.weight ?? startW;
  const total = Math.abs(startW - targetW) || 1;
  const moved = profile?.goal === 'gain' ? currentW - startW : startW - currentW;
  const weightProgress = Math.max(0, Math.min(1, moved / total));

  const badges: Badge[] = [
    { icon: 'footsteps-outline', title: 'İlk adım', desc: 'İlk öğününü ekle', earned: loggedDays >= 1 },
    { icon: 'flame-outline', title: '3 günlük seri', desc: '3 gün üst üste takip', earned: streak >= 3 },
    { icon: 'flame', title: '7 günlük seri', desc: '7 gün üst üste takip', earned: streak >= 7 },
    { icon: 'bonfire', title: '30 günlük seri', desc: '30 gün üst üste takip', earned: streak >= 30 },
    { icon: 'calendar-outline', title: 'Düzenli', desc: 'Toplam 10 gün takip', earned: loggedDays >= 10 },
    { icon: 'water', title: 'Su kahramanı', desc: 'Bir günde 8 bardak su', earned: maxWater >= 8 },
    { icon: 'heart', title: 'Koleksiyoncu', desc: '5 tarif kaydet', earned: favCount >= 5 },
    { icon: 'trending-down', title: 'Yolda', desc: 'Hedefin %50’sine ulaş', earned: weightProgress >= 0.5 },
    { icon: 'trophy', title: 'Hedefe ulaştın', desc: 'Hedef kilona ulaş', earned: weightProgress >= 1 },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + Spacing.two, backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={{ fontSize: 18 }}>
          Başarılar
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <Card style={styles.summary}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="trophy" size={26} color={theme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: 22 }}>
              {earnedCount}/{badges.length}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
              kazanılan rozet
            </ThemedText>
          </View>
        </Card>

        <View style={styles.grid}>
          {badges.map((b) => (
            <Card key={b.title} style={[styles.badge, { opacity: b.earned ? 1 : 0.5 }]}>
              <View
                style={[
                  styles.badgeIcon,
                  { backgroundColor: b.earned ? theme.primary : theme.backgroundElement },
                ]}>
                <Ionicons name={b.icon} size={24} color={b.earned ? '#fff' : theme.textMuted} />
              </View>
              <ThemedText type="smallBold" style={{ fontSize: 13, textAlign: 'center' }}>
                {b.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, textAlign: 'center' }}>
                {b.desc}
              </ThemedText>
              {b.earned && (
                <View style={styles.check}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                </View>
              )}
            </Card>
          ))}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  badge: {
    width: '47%',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  check: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
});
