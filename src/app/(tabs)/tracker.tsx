import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CalorieRing } from '@/components/ui/calorie-ring';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { dailyNutrition } from '@/constants/mock-data';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type AIContext, type MealIdea, isAIEnabled, suggestWhatToEat } from '@/lib/ai';
import { MEAL_TYPES, type LoggedMeal, type MealType, dateKey, useDailyLog } from '@/lib/daily-log';
import { allergenLabel, caloriesPerMeal, goalLabel } from '@/lib/plan';
import { useAccountGate } from '@/lib/account-gate';
import { useAiAccess } from '@/lib/ai-credits';
import { useTrackingHistory } from '@/lib/tracking-history';
import { useUserProfile } from '@/lib/user-profile';
import { useWorkoutLog } from '@/lib/workout-log';

/** Dünün tarih anahtarı. */
function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function formatToday(d: Date = new Date()): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`;
}

export default function TrackerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { log, totals, addMeal, removeMeal, setWater } = useDailyLog();
  const { streak } = useTrackingHistory();
  const workout = useWorkoutLog();
  const access = useAiAccess();
  const { requireActiveTrial } = useAccountGate();
  const yesterday = useDailyLog(yesterdayKey());

  const [modalType, setModalType] = useState<MealType | null>(null);
  const [whatToEat, setWhatToEat] = useState(false);

  // "Dünü kopyala": bugün boşsa ve dün öğün varsa göster.
  const canCopyYesterday = log.meals.length === 0 && yesterday.log.meals.length > 0;
  const copyYesterday = () => {
    if (!requireActiveTrial()) return;
    yesterday.log.meals.forEach(({ id, ...meal }) => addMeal(meal));
  };

  // Hedefler gerçek plandan; tüketim artık gerçek günlük kayıttan geliyor.
  const plan = profile?.plan;
  const calorieGoal = plan?.calorieGoal ?? dailyNutrition.calorieGoal;
  const waterGoal = plan?.waterGoal ?? dailyNutrition.water.goal;

  const macros = [
    { label: 'Protein', current: totals.protein, goal: plan?.protein ?? dailyNutrition.protein.goal, color: theme.protein },
    { label: 'Karbonhidrat', current: totals.carbs, goal: plan?.carbs ?? dailyNutrition.carbs.goal, color: theme.carbs },
    { label: 'Yağ', current: totals.fat, goal: plan?.fat ?? dailyNutrition.fat.goal, color: theme.fat },
  ];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 32 }}>
            Bugün
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatToday()}
          </ThemedText>
        </View>
        {streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: theme.accent + '22' }]}>
            <Ionicons name="flame" size={16} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 14 }}>
              {streak} gün
            </ThemedText>
          </View>
        )}
      </View>

      {/* Günün özeti: kalori halkası + makrolar tek kartta */}
      <Card style={{ gap: Spacing.three }}>
        <View style={{ alignItems: 'center', gap: Spacing.three }}>
          <CalorieRing consumed={totals.kcal} goal={calorieGoal} />
          <View style={styles.calorieFooter}>
            <CalStat label="Hedef" value={calorieGoal} color={theme.textSecondary} />
            <CalStat label="Alınan" value={totals.kcal} color={theme.calorie} />
            <CalStat label="Kalan" value={Math.max(0, calorieGoal - totals.kcal)} color={theme.primary} />
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        {macros.map((m) => (
          <View key={m.label} style={{ gap: Spacing.one }}>
            <View style={styles.macroLabelRow}>
              <ThemedText type="small">{m.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {m.current} / {m.goal} g
              </ThemedText>
            </View>
            <ProgressBar progress={m.goal > 0 ? m.current / m.goal : 0} color={m.color} />
          </View>
        ))}
      </Card>

      {/* Bugün ne yesem? (AI) */}
      {isAIEnabled() && (
        <Pressable
          onPress={() => {
            if (!requireActiveTrial()) return;
            if (!access.consume()) {
              router.push('/get-credits' as Href);
              return;
            }
            setWhatToEat(true);
          }}
          style={[styles.whatToEatBtn, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="sparkles" size={18} color={theme.primaryDark} />
          <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 14, flex: 1 }}>
            Bugün ne yesem? — kalan {Math.max(0, calorieGoal - totals.kcal)} kcal'a öneri
          </ThemedText>
          <Ionicons name="chevron-forward" size={18} color={theme.primaryDark} />
        </Pressable>
      )}

      {/* Su takibi */}
      <Card style={{ gap: Spacing.three }}>
        <View style={styles.macroLabelRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Ionicons name="water-outline" size={20} color={theme.protein} />
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>
              Su
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {log.water} / {waterGoal} bardak
          </ThemedText>
        </View>
        <View style={styles.waterRow}>
          {Array.from({ length: waterGoal }).map((_, i) => (
            <Pressable
              key={i}
              // Dolu son bardağa basınca onu boşalt (toggle), aksi halde o seviyeye doldur.
              onPress={() => {
                if (!requireActiveTrial()) return;
                setWater(i + 1 === log.water ? i : i + 1);
              }}
              style={{ flex: 1 }}>
              <View
                style={[
                  styles.waterGlass,
                  {
                    backgroundColor: i < log.water ? theme.protein : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Egzersiz */}
      <Pressable onPress={() => router.push('/workout' as Href)}>
        <Card style={styles.workoutRow}>
          <View style={[styles.mealIcon, { backgroundColor: theme.accent + '22' }]}>
            <Ionicons name="barbell-outline" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              Egzersiz
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              {workout.totals.kcal > 0
                ? `${workout.totals.kcal} kcal yakıldı · ${workout.totals.minutes} dk`
                : 'Antrenmanını ekle, yakılan kaloriyi gör'}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </Card>
      </Pressable>

      {/* Öğünler */}
      <View style={{ gap: Spacing.three }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="smallBold" style={{ fontSize: 18 }}>
            Öğünler
          </ThemedText>
          {canCopyYesterday && (
            <Pressable
              onPress={copyYesterday}
              style={[styles.copyBtn, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="copy-outline" size={15} color={theme.primaryDark} />
              <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 13 }}>
                Dünü kopyala
              </ThemedText>
            </Pressable>
          )}
        </View>
        {MEAL_TYPES.map((section) => {
          const items = log.meals.filter((m) => m.mealType === section.value);
          const total = items.reduce((sum, it) => sum + it.kcal, 0);
          return (
            <Card key={section.value} style={{ gap: Spacing.two }}>
              <View style={styles.mealHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <View style={[styles.mealIcon, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name={section.icon as any} size={18} color={theme.primaryDark} />
                  </View>
                  <View>
                    <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                      {section.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                      {total} kcal
                    </ThemedText>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    if (!requireActiveTrial()) return;
                    setModalType(section.value);
                  }}
                  style={[styles.addBtn, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>

              {items.length === 0 ? (
                <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, paddingLeft: 48 }}>
                  Henüz bir şey eklemedin.
                </ThemedText>
              ) : (
                items.map((item) => (
                  <Pressable
                    key={item.id}
                    onLongPress={() => removeMeal(item.id)}
                    style={styles.mealItem}>
                    <ThemedText type="small" style={{ flex: 1 }} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.portion ? `${item.portion} · ` : ''}{item.kcal} kcal
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </Card>
          );
        })}
        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
          İpucu: bir öğüne uzun basarak silebilirsin.
        </ThemedText>
      </View>

      <AddMealModal
        mealType={modalType}
        onClose={() => setModalType(null)}
        onScan={(mt) => {
          setModalType(null);
          router.push(`/scan?meal=${mt}` as Href);
        }}
        onPhoto={(mt) => {
          setModalType(null);
          router.push(`/photo-meal?meal=${mt}` as Href);
        }}
        onSave={(meal) => {
          addMeal(meal);
          setModalType(null);
        }}
      />

      <WhatToEatModal
        visible={whatToEat}
        onClose={() => setWhatToEat(false)}
        remaining={{
          kcal: Math.max(0, calorieGoal - totals.kcal),
          protein: Math.max(0, (plan?.protein ?? dailyNutrition.protein.goal) - totals.protein),
          carbs: Math.max(0, (plan?.carbs ?? dailyNutrition.carbs.goal) - totals.carbs),
          fat: Math.max(0, (plan?.fat ?? dailyNutrition.fat.goal) - totals.fat),
        }}
        ctx={
          profile
            ? {
                diet: profile.diet,
                allergies: profile.allergies.map(allergenLabel),
                calorieTarget: profile.plan.calorieGoal,
                perMealKcal: caloriesPerMeal(profile.plan, profile.mealsPerDay),
                goal: goalLabel(profile.goal),
              }
            : undefined
        }
        onPick={(idea) => {
          addMeal({ name: idea.name, mealType: 'snack', portion: 'AI önerisi', kcal: idea.kcal, protein: 0, carbs: 0, fat: 0 });
          setWhatToEat(false);
        }}
      />
    </Screen>
  );
}

/** AI ile "bugün ne yesem" öneri modalı. */
function WhatToEatModal({
  visible,
  remaining,
  ctx,
  onClose,
  onPick,
}: {
  visible: boolean;
  remaining: { kcal: number; protein: number; carbs: number; fat: number };
  ctx: AIContext | undefined;
  onClose: () => void;
  onPick: (idea: MealIdea) => void;
}) {
  const theme = useTheme();
  const [ideas, setIdeas] = useState<MealIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setIdeas([]);
    setError(null);
    setLoading(true);
    suggestWhatToEat(remaining, ctx)
      .then(setIdeas)
      .catch((e) => setError(e?.message ?? 'Öneri alınamadı.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <View style={styles.modalHandle} />
          <ThemedText type="subtitle" style={{ fontSize: 20 }}>
            Bugün ne yesem?
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
            Kalan {remaining.kcal} kcal · {remaining.protein}g protein için AI önerileri
          </ThemedText>

          {loading && <ActivityIndicator color={theme.primary} style={{ marginVertical: Spacing.four }} />}
          {error && (
            <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
              {error}
            </ThemedText>
          )}

          <View style={{ gap: Spacing.two }}>
            {ideas.map((idea, i) => (
              <Pressable
                key={i}
                onPress={() => onPick(idea)}
                style={[styles.ideaRow, { backgroundColor: theme.backgroundElement }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                    {idea.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {idea.kcal} kcal · {idea.reason}
                  </ThemedText>
                </View>
                <View style={[styles.ideaAdd, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={18} color="#fff" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Hızlı öğün ekleme modalı — manuel isim + kalori + (opsiyonel) makro. */
function AddMealModal({
  mealType,
  onClose,
  onSave,
  onScan,
  onPhoto,
}: {
  mealType: MealType | null;
  onClose: () => void;
  onSave: (meal: Omit<LoggedMeal, 'id'>) => void;
  onScan: (mealType: MealType) => void;
  onPhoto: (mealType: MealType) => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const visible = mealType !== null;
  const sectionTitle = MEAL_TYPES.find((m) => m.value === mealType)?.title ?? '';
  const canSave = name.trim().length > 0 && Number(kcal) >= 0 && kcal.trim().length > 0;

  const reset = () => {
    setName('');
    setPortion('');
    setKcal('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!mealType || !canSave) return;
    onSave({
      name: name.trim(),
      mealType,
      portion: portion.trim(),
      kcal: Math.round(Number(kcal) || 0),
      protein: Math.round(Number(protein) || 0),
      carbs: Math.round(Number(carbs) || 0),
      fat: Math.round(Number(fat) || 0),
    });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <View style={styles.modalHandle} />
          <ThemedText type="subtitle" style={{ fontSize: 20 }}>
            {sectionTitle} · öğün ekle
          </ThemedText>

          <Pressable
            onPress={() => mealType && onScan(mealType)}
            style={[styles.scanRow, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="barcode-outline" size={20} color={theme.primaryDark} />
            <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 14, flex: 1 }}>
              Barkod tarayarak ekle
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={theme.primaryDark} />
          </Pressable>

          <Pressable
            onPress={() => mealType && onPhoto(mealType)}
            style={[styles.scanRow, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="camera-outline" size={20} color={theme.primaryDark} />
            <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 14, flex: 1 }}>
              Fotoğraftan tahmin et (AI)
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={theme.primaryDark} />
          </Pressable>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 380 }}>
            <View style={{ gap: Spacing.three, paddingTop: Spacing.two }}>
              <Field label="Ne yedin?" theme={theme}>
                <TextInput
                  placeholder="örn. Yulaf ezmesi"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  style={[styles.fieldInput, { color: theme.text }]}
                />
              </Field>

              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                <Field label="Porsiyon" theme={theme} flex>
                  <TextInput
                    placeholder="1 kase"
                    placeholderTextColor={theme.textMuted}
                    value={portion}
                    onChangeText={setPortion}
                    style={[styles.fieldInput, { color: theme.text }]}
                  />
                </Field>
                <Field label="Kalori (kcal)" theme={theme} flex>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    value={kcal}
                    onChangeText={setKcal}
                    keyboardType="numeric"
                    style={[styles.fieldInput, { color: theme.text }]}
                  />
                </Field>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                <Field label="Prot (g)" theme={theme} flex>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                    style={[styles.fieldInput, { color: theme.text }]}
                  />
                </Field>
                <Field label="Karb (g)" theme={theme} flex>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                    style={[styles.fieldInput, { color: theme.text }]}
                  />
                </Field>
                <Field label="Yağ (g)" theme={theme} flex>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                    style={[styles.fieldInput, { color: theme.text }]}
                  />
                </Field>
              </View>
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Pressable onPress={handleClose} style={[styles.modalBtn, { borderColor: theme.border, borderWidth: 1 }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Vazgeç
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={[styles.modalBtn, { backgroundColor: theme.primary, opacity: canSave ? 1 : 0.5, flex: 1 }]}>
              <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                Ekle
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  children,
  theme,
  flex,
}: {
  label: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
  flex?: boolean;
}) {
  return (
    <View style={[{ gap: Spacing.one }, flex && { flex: 1 }]}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {label}
      </ThemedText>
      <View style={[styles.fieldBox, { backgroundColor: theme.backgroundElement }]}>{children}</View>
    </View>
  );
}

function CalStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <ThemedText type="smallBold" style={{ color, fontSize: 17 }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  whatToEatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  ideaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  ideaAdd: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  calorieFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  waterGlass: {
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingLeft: 48,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: Spacing.one,
  },
  fieldBox: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    height: 48,
    justifyContent: 'center',
  },
  fieldInput: {
    fontSize: 15,
    height: '100%',
  },
  modalBtn: {
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
