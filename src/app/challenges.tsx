import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useChallenges } from '@/lib/challenges';

/** Bu haftanın bitişine kalan gün sayısı (Pazar dahil). */
function daysLeftInWeek(): number {
  const now = new Date();
  const offset = (now.getDay() + 6) % 7; // Pazartesi=0
  return 7 - offset;
}

export default function ChallengesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenges, completedCount } = useChallenges();

  const left = daysLeftInWeek();

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
          Haftalık meydan okumalar
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <Card style={styles.summary}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="ribbon" size={26} color={theme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: 22 }}>
              {completedCount}/{challenges.length}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
              tamamlandı · {left} gün kaldı
            </ThemedText>
          </View>
        </Card>

        <View style={{ gap: Spacing.three }}>
          {challenges.map((c) => {
            const done = c.current >= c.target;
            const progress = c.target > 0 ? Math.min(1, c.current / c.target) : 0;
            return (
              <Card key={c.id} style={{ gap: Spacing.two }}>
                <View style={styles.challengeHeader}>
                  <View
                    style={[
                      styles.challengeIcon,
                      { backgroundColor: done ? theme.primary : theme.backgroundElement },
                    ]}>
                    <Ionicons
                      name={(done ? 'checkmark' : c.icon) as any}
                      size={20}
                      color={done ? '#fff' : theme.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                      {c.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                      {c.desc}
                    </ThemedText>
                  </View>
                  {done && (
                    <View style={[styles.donePill, { backgroundColor: theme.primarySoft }]}>
                      <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 11 }}>
                        Tamam
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ProgressBar progress={progress} color={done ? theme.primary : theme.accent} />
                <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'right' }}>
                  {Math.min(c.current, c.target)} / {c.target} {c.unit}
                </ThemedText>
              </Card>
            );
          })}
        </View>

        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
          Meydan okumalar her Pazartesi sıfırlanır.
        </ThemedText>
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
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
});
