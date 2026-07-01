import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { thisWeekKeys } from '@/lib/challenges';
import { useTrackingHistory } from '@/lib/tracking-history';
import { useUserProfile } from '@/lib/user-profile';
import { useWorkoutHistory } from '@/lib/workout-log';
import { publishLeaderboardEntry, useLeaderboard } from '@/lib/leaderboard';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { entries, loading } = useLeaderboard();
  const { days, streak } = useTrackingHistory();
  const { days: workoutDays } = useWorkoutHistory();

  // Bu ekran açıldığında kullanıcının güncel skorunu tabloya yaz.
  useEffect(() => {
    if (!user || !profile) return;
    // Misafirler liderlik tablosuna yazılmaz; sadece görüntüler.
    if (user.isAnonymous) return;
    const week = thisWeekKeys();
    const weekLoggedDays = days.filter((d) => week.has(d.date) && d.mealCount > 0).length;
    const weeklyWorkouts = workoutDays.filter((d) => week.has(d.date) && d.count > 0).length;
    void publishLeaderboardEntry(user.uid, {
      name: profile.name || 'FrozFit kullanıcısı',
      streak,
      weekLoggedDays,
      weeklyWorkouts,
    });
  }, [user, profile, days, workoutDays, streak]);

  const myRank = user ? entries.findIndex((e) => e.uid === user.uid) : -1;

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
          Liderlik tablosu
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <View style={{ gap: Spacing.one }}>
          <ThemedText type="subtitle" style={{ fontSize: 22 }}>
            En aktif kullanıcılar
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
            Puan = seri × 10 + bu hafta kayıtlı gün × 5 + antrenman × 15
          </ThemedText>
        </View>

        {myRank >= 0 && (
          <Card style={[styles.myRankCard, { borderColor: theme.primary }]}>
            <ThemedText type="subtitle" style={{ fontSize: 20, color: theme.primary }}>
              #{myRank + 1}
            </ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                Senin sıran
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                {entries[myRank].points} puan
              </ThemedText>
            </View>
            <Ionicons name="person-circle" size={28} color={theme.primary} />
          </Card>
        )}

        {!loading && entries.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: Spacing.five, gap: Spacing.three }}>
            <Ionicons name="podium-outline" size={44} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Tablo henüz boş. Takip yaparak ve antrenman ekleyerek ilk sıraya yerleş!
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: Spacing.two }}>
            {entries.map((e, i) => {
              const isMe = user?.uid === e.uid;
              return (
                <Card
                  key={e.uid}
                  style={[
                    styles.row,
                    isMe && { backgroundColor: theme.primarySoft },
                  ]}>
                  <View style={styles.rankBox}>
                    {i < 3 ? (
                      <ThemedText style={{ fontSize: 22 }}>{MEDALS[i]}</ThemedText>
                    ) : (
                      <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 16 }}>
                        {i + 1}
                      </ThemedText>
                    )}
                  </View>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                      {e.name.slice(0, 1).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold" style={{ fontSize: 15 }} numberOfLines={1}>
                      {e.name} {isMe ? '(sen)' : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                      🔥 {e.streak} gün · 🏋️ {e.weeklyWorkouts} antrenman
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ fontSize: 16, color: theme.primary }}>
                    {e.points}
                  </ThemedText>
                </Card>
              );
            })}
          </View>
        )}

        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
          Sıralaman bu ekranı her açtığında güncellenir.
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
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rankBox: {
    width: 28,
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
