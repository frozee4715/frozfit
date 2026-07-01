import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateKey } from '@/lib/daily-log';
import { useTrackingHistory } from '@/lib/tracking-history';

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = dateKey();
  const yesterday = (() => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 1);
    return dateKey(dt);
  })();
  if (key === today) return 'Bugün';
  if (key === yesterday) return 'Dün';
  return `${d} ${MONTHS[m - 1]} ${WEEKDAYS[date.getDay()]}`;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { days, streak } = useTrackingHistory();

  const logged = days.filter((d) => d.mealCount > 0 || d.water > 0);

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
          Takip geçmişi
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        {/* Seri kartı */}
        <Card style={styles.streakCard}>
          <View style={[styles.streakIcon, { backgroundColor: theme.accent + '22' }]}>
            <Ionicons name="flame" size={26} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: 22 }}>
              {streak} günlük seri
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
              {streak > 0 ? 'Devam et, harika gidiyorsun!' : 'Bugün bir öğün ekleyerek seriye başla.'}
            </ThemedText>
          </View>
        </Card>

        {logged.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: Spacing.five, gap: Spacing.three }}>
            <Ionicons name="calendar-outline" size={44} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Henüz geçmiş kaydın yok. Takip ekranından öğün ekledikçe günlerin burada birikecek.
            </ThemedText>
          </View>
        ) : (
          logged.map((day) => (
            <Card key={day.date} style={styles.dayRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                  {formatDate(day.date)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                  {day.mealCount} öğün · {day.water} bardak su
                </ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText type="smallBold" style={{ fontSize: 16, color: theme.calorie }}>
                  {day.totals.kcal}
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 11 }}>
                  kcal
                </ThemedText>
              </View>
            </Card>
          ))
        )}
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
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  streakIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
