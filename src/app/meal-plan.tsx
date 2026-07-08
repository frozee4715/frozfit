import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type AIContext, type MealPlanDay, generateMealPlan, isAIEnabled } from '@/lib/ai';
import { allergenLabel, caloriesPerMeal, goalLabel } from '@/lib/plan';
import { usePremium } from '@/lib/premium';
import { useUserProfile } from '@/lib/user-profile';

export default function MealPlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { isPremium } = usePremium();

  const [plan, setPlan] = useState<MealPlanDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctx: AIContext | undefined = profile
    ? {
        diet: profile.diet,
        allergies: profile.allergies.map(allergenLabel),
        calorieTarget: profile.plan.calorieGoal,
        perMealKcal: caloriesPerMeal(profile.plan, profile.mealsPerDay),
        goal: goalLabel(profile.goal),
      }
    : undefined;

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      setPlan(await generateMealPlan(ctx));
    } catch (e: any) {
      setError(e?.message ?? 'Plan oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

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
          Haftalık plan
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
          Profiline (diyet, alerji, kalori hedefi) göre 7 günlük öğün planı oluştur.
        </ThemedText>

        {!isAIEnabled() ? (
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
            AI özelliğini açmak için .env dosyasına OpenRouter anahtarını ekle.
          </ThemedText>
        ) : !isPremium ? (
          <Pressable onPress={() => router.push('/premium' as Href)}>
            <Card style={[styles.premiumGate, { backgroundColor: theme.primarySoft }]}>
              <View style={[styles.gateIcon, { backgroundColor: theme.primary }]}>
                <Ionicons name="star" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ fontSize: 15, color: theme.primaryDark }}>
                  Premium özellik
                </ThemedText>
                <ThemedText type="small" style={{ fontSize: 12, color: theme.primaryDark }}>
                  Haftalık AI öğün planı için Premium'a geç.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.primaryDark} />
            </Card>
          </Pressable>
        ) : (
          <Pressable
            onPress={generate}
            disabled={loading}
            style={[styles.genBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                  {plan.length ? 'Yeniden oluştur' : 'Plan oluştur'}
                </ThemedText>
              </>
            )}
          </Pressable>
        )}

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}

        {plan.map((day, i) => {
          const total = day.meals.reduce((s, m) => s + (m.kcal || 0), 0);
          return (
            <Card key={i} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText type="smallBold" style={{ fontSize: 13, color: theme.primaryDark }}>
                    {i + 1}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={{ flex: 1, fontSize: 17 }}>
                  {day.day}
                </ThemedText>
                {total > 0 ? (
                  <View style={[styles.totalPill, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name="flame" size={13} color={theme.calorie} />
                    <ThemedText type="smallBold" style={{ fontSize: 12, color: theme.calorie }}>
                      {total} kcal
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={{ gap: Spacing.two }}>
                {day.meals.map((m, j) => {
                  const mi = mealVisual(m.meal, theme);
                  return (
                    <View
                      key={j}
                      style={[styles.mealRow, { backgroundColor: theme.backgroundElement }]}>
                      <View style={[styles.mealIcon, { backgroundColor: mi.bg }]}>
                        <Ionicons name={mi.icon} size={16} color={mi.color} />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 11 }}>
                          {m.meal}
                        </ThemedText>
                        <ThemedText type="smallBold" style={{ fontSize: 14 }} numberOfLines={2}>
                          {m.name}
                        </ThemedText>
                      </View>
                      {m.kcal > 0 ? (
                        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                          {m.kcal} kcal
                        </ThemedText>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </Screen>
    </View>
  );
}

/** Öğün adına göre ikon + renk (kahvaltı/öğle/akşam/ara öğün). */
function mealVisual(
  meal: string,
  theme: ReturnType<typeof useTheme>,
): { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string } {
  const m = meal.toLocaleLowerCase('tr');
  if (m.includes('kahvalt')) return { icon: 'sunny', bg: '#FFF4D6', color: '#E6A100' };
  if (m.includes('öğle') || m.includes('ogle')) return { icon: 'restaurant', bg: theme.primarySoft, color: theme.primaryDark };
  if (m.includes('akşam') || m.includes('aksam')) return { icon: 'moon', bg: '#E3E0FF', color: '#5A4FCF' };
  return { icon: 'nutrition', bg: '#FFE3EC', color: '#D6336C' };
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
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.pill,
  },
  dayCard: {
    gap: Spacing.three,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dayBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  mealIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumGate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  gateIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
