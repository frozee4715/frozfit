import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { WeeklyProgressChart } from '@/components/ui/weekly-progress-chart';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateKey } from '@/lib/daily-log';
import { usePremium } from '@/lib/premium';
import { useTrackingHistory } from '@/lib/tracking-history';
import { useUserProfile } from '@/lib/user-profile';

/** Son N günü (bugün dahil) tarih anahtarı dizisi olarak döndürür (eskiden yeniye). */
function lastNDates(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dateKey(d));
  }
  return out;
}

export default function InsightsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { days } = useTrackingHistory();
  const { profile } = useUserProfile();
  const { isPremium } = usePremium();

  const byDate = useMemo(() => {
    const m = new Map(days.map((d) => [d.date, d]));
    return m;
  }, [days]);

  const week = lastNDates(7);
  const calorieGoal = profile?.plan.calorieGoal ?? 2000;

  // Son 7 gün kalori grafiği
  const caloriePoints = week.map((dk) => {
    const [, mo, da] = dk.split('-');
    return { label: `${Number(da)}/${Number(mo)}`, value: byDate.get(dk)?.totals.kcal ?? 0 };
  });

  // Ortalamalar (yalnızca loglu günler)
  const loggedWeek = week.map((dk) => byDate.get(dk)).filter((d) => d && d.mealCount > 0) as NonNullable<
    ReturnType<typeof byDate.get>
  >[];
  const avg = (sel: (t: { kcal: number; protein: number; carbs: number; fat: number }) => number) =>
    loggedWeek.length ? Math.round(loggedWeek.reduce((s, d) => s + sel(d.totals), 0) / loggedWeek.length) : 0;

  const avgKcal = avg((t) => t.kcal);
  const avgP = avg((t) => t.protein);
  const avgC = avg((t) => t.carbs);
  const avgF = avg((t) => t.fat);

  // Makro dağılımı (kaloriye göre yüzde): P*4, C*4, F*9
  const pCal = avgP * 4;
  const cCal = avgC * 4;
  const fCal = avgF * 9;
  const macroTotal = pCal + cCal + fCal || 1;
  const macroSplit = [
    { label: 'Protein', pct: Math.round((pCal / macroTotal) * 100), color: theme.protein },
    { label: 'Karbonhidrat', pct: Math.round((cCal / macroTotal) * 100), color: theme.carbs },
    { label: 'Yağ', pct: Math.round((fCal / macroTotal) * 100), color: theme.fat },
  ];

  // Aylık (son 30 gün) özet
  const month = lastNDates(30).map((dk) => byDate.get(dk)).filter((d) => d && d.mealCount > 0).length;

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
          Özet & analiz
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        {/* Haftalık kalori grafiği */}
        <Card style={{ gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              Son 7 gün · kalori
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              hedef {calorieGoal}
            </ThemedText>
          </View>
          <WeeklyProgressChart data={caloriePoints} highlightIndex={6} />
        </Card>

        {/* Haftalık ortalamalar */}
        <Card style={{ gap: Spacing.three }}>
          <ThemedText type="smallBold" style={{ fontSize: 15 }}>
            Haftalık ortalama ({loggedWeek.length} gün)
          </ThemedText>
          <View style={styles.statsRow}>
            <Stat label="Kalori" value={avgKcal} color={theme.calorie} />
            <Stat label="Protein" value={avgP} color={theme.protein} suffix="g" />
            <Stat label="Karb" value={avgC} color={theme.carbs} suffix="g" />
            <Stat label="Yağ" value={avgF} color={theme.fat} suffix="g" />
          </View>
        </Card>

        {isPremium ? (
          <>
            {/* Makro dağılımı (Premium) */}
            <Card style={{ gap: Spacing.three }}>
              <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                Ortalama makro dağılımı
              </ThemedText>
              {macroSplit.map((m) => (
                <View key={m.label} style={{ gap: Spacing.one }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText type="small">{m.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      %{m.pct}
                    </ThemedText>
                  </View>
                  <ProgressBar progress={m.pct / 100} color={m.color} />
                </View>
              ))}
            </Card>

            {/* Aylık özet (Premium) */}
            <Card style={styles.monthRow}>
              <View style={[styles.monthIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="calendar-outline" size={22} color={theme.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="subtitle" style={{ fontSize: 20 }}>
                  {month}/30 gün
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                  Son 30 günde takip yaptığın günler
                </ThemedText>
              </View>
            </Card>
          </>
        ) : (
          /* Gelişmiş analizler kilidi — Premium CTA */
          <Pressable onPress={() => router.push('/premium' as Href)}>
            <Card style={{ gap: Spacing.two, alignItems: 'center', paddingVertical: Spacing.four }}>
              <View style={[styles.monthIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="lock-closed" size={22} color={theme.primaryDark} />
              </View>
              <ThemedText type="smallBold" style={{ fontSize: 15, textAlign: 'center' }}>
                Gelişmiş analizler Premium ile açılır
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={{ fontSize: 13, textAlign: 'center' }}>
                Makro dağılımı, 30 günlük trendler ve detaylı içgörüler için Premium&apos;a geç.
              </ThemedText>
              <View style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}>
                <Ionicons name="star" size={14} color="#fff" />
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 13 }}>
                  Premium&apos;u incele
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        )}

        {loggedWeek.length === 0 && (
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13, textAlign: 'center' }}>
            Henüz yeterli veri yok. Takip ettikçe analizlerin burada zenginleşecek.
          </ThemedText>
        )}
      </Screen>
    </View>
  );
}

function Stat({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2, flex: 1 }}>
      <ThemedText type="smallBold" style={{ color, fontSize: 17 }}>
        {value}
        {suffix ?? ''}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {label}
      </ThemedText>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  monthIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
});
