import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { dailyNutrition } from '@/constants/mock-data';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDailyLog } from '@/lib/daily-log';
import { useUserProfile } from '@/lib/user-profile';
import { useWeightLog } from '@/lib/weight-log';
import {
  CATEGORY_LABELS,
  DEFAULT_BODY_WEIGHT,
  EXERCISE_LIBRARY,
  type ExerciseCategory,
  type ExerciseType,
  type LoggedExercise,
  estimateBurn,
  useWorkoutLog,
} from '@/lib/workout-log';
import { useAccountGate } from '@/lib/account-gate';

export default function WorkoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { latest } = useWeightLog();
  const { log, totals, addExercise, removeExercise } = useWorkoutLog();
  const { totals: foodTotals } = useDailyLog();
  const { requireActiveTrial } = useAccountGate();

  const [picker, setPicker] = useState(false);

  // Kalori tahmini için vücut ağırlığı: son tartım > profil kilosu > varsayılan.
  const bodyWeight = latest?.weight ?? profile?.weight ?? DEFAULT_BODY_WEIGHT;
  const calorieGoal = profile?.plan?.calorieGoal ?? dailyNutrition.calorieGoal;
  // Net = alınan − yakılan. Egzersiz "yenebilecek" kaloriyi artırır.
  const net = foodTotals.kcal - totals.kcal;
  const adjustedRemaining = Math.max(0, calorieGoal + totals.kcal - foodTotals.kcal);

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
          Egzersiz
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        {/* Özet: yakılan kalori + süre */}
        <Card style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.accent + '22' }]}>
              <Ionicons name="flame" size={20} color={theme.accent} />
            </View>
            <ThemedText style={{ fontSize: 26, fontWeight: '700', color: theme.accent }}>
              {totals.kcal}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              kcal yakıldı
            </ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.primary + '22' }]}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
            </View>
            <ThemedText style={{ fontSize: 26, fontWeight: '700', color: theme.primary }}>
              {totals.minutes}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              dakika
            </ThemedText>
          </View>
        </Card>

        {/* Net kalori dengesi */}
        <Card style={{ gap: Spacing.two }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Ionicons name="swap-vertical-outline" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              Bugünkü kalori dengesi
            </ThemedText>
          </View>
          <View style={styles.balanceRow}>
            <BalancePart label="Alınan" value={foodTotals.kcal} color={theme.calorie} />
            <ThemedText type="subtitle" themeColor="textMuted" style={{ fontSize: 18 }}>
              −
            </ThemedText>
            <BalancePart label="Yakılan" value={totals.kcal} color={theme.accent} />
            <ThemedText type="subtitle" themeColor="textMuted" style={{ fontSize: 18 }}>
              =
            </ThemedText>
            <BalancePart label="Net" value={net} color={theme.text} />
          </View>
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
            Egzersizle birlikte bugün ~{adjustedRemaining} kcal'lık alanın kaldı.
          </ThemedText>
        </Card>

        {/* Egzersiz ekle butonu */}
        <Pressable
          onPress={() => {
            if (!requireActiveTrial()) return;
            setPicker(true);
          }}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={22} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
            Egzersiz ekle
          </ThemedText>
        </Pressable>

        {/* Bugünün antrenmanları */}
        <View style={{ gap: Spacing.three }}>
          <ThemedText type="smallBold" style={{ fontSize: 18 }}>
            Bugünün antrenmanları
          </ThemedText>
          {log.exercises.length === 0 ? (
            <Card style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five }}>
              <Ionicons name="barbell-outline" size={40} color={theme.textMuted} />
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 13 }}>
                Henüz egzersiz eklemedin. Yukarıdaki butonla antrenmanını kaydet.
              </ThemedText>
            </Card>
          ) : (
            log.exercises.map((ex) => (
              <Pressable key={ex.id} onLongPress={() => removeExercise(ex.id)}>
                <Card style={styles.exerciseRow}>
                  <View style={[styles.exerciseIcon, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name={iconFor(ex.typeId) as any} size={20} color={theme.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                      {ex.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                      {ex.minutes} dk · {CATEGORY_LABELS[ex.category]}
                    </ThemedText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText type="smallBold" style={{ fontSize: 16, color: theme.accent }}>
                      {ex.kcal}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 11 }}>
                      kcal
                    </ThemedText>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
          {log.exercises.length > 0 && (
            <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
              İpucu: bir egzersize uzun basarak silebilirsin.
            </ThemedText>
          )}
        </View>
      </Screen>

      <ExercisePickerModal
        visible={picker}
        bodyWeight={bodyWeight}
        onClose={() => setPicker(false)}
        onSave={(ex) => {
          addExercise(ex);
          setPicker(false);
        }}
      />
    </View>
  );
}

function iconFor(typeId: string): string {
  return EXERCISE_LIBRARY.find((e) => e.id === typeId)?.icon ?? 'fitness-outline';
}

function BalancePart({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <ThemedText type="smallBold" style={{ fontSize: 18, color }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
        {label}
      </ThemedText>
    </View>
  );
}

const CATEGORY_ORDER: ExerciseCategory[] = ['cardio', 'strength', 'flexibility', 'sports'];

/** Egzersiz seçimi + süre girişi modalı; kalori tahminini canlı gösterir. */
function ExercisePickerModal({
  visible,
  bodyWeight,
  onClose,
  onSave,
}: {
  visible: boolean;
  bodyWeight: number;
  onClose: () => void;
  onSave: (exercise: Omit<LoggedExercise, 'id'>) => void;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<ExerciseType | null>(null);
  const [minutes, setMinutes] = useState('30');

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: EXERCISE_LIBRARY.filter((e) => e.category === cat),
    }));
  }, []);

  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  const kcal = selected ? estimateBurn(selected.met, mins, bodyWeight) : 0;
  const canSave = selected !== null && mins > 0;

  const reset = () => {
    setSelected(null);
    setMinutes('30');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!selected || !canSave) return;
    onSave({
      typeId: selected.id,
      name: selected.name,
      category: selected.category,
      minutes: mins,
      kcal,
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
            Egzersiz seç
          </ThemedText>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
            <View style={{ gap: Spacing.three }}>
              {grouped.map(({ cat, items }) => (
                <View key={cat} style={{ gap: Spacing.two }}>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {CATEGORY_LABELS[cat]}
                  </ThemedText>
                  <View style={styles.chipWrap}>
                    {items.map((ex) => {
                      const active = selected?.id === ex.id;
                      return (
                        <Pressable
                          key={ex.id}
                          onPress={() => setSelected(ex)}
                          style={[
                            styles.exerciseChip,
                            {
                              backgroundColor: active ? theme.primary : theme.backgroundElement,
                            },
                          ]}>
                          <Ionicons
                            name={ex.icon as any}
                            size={15}
                            color={active ? '#fff' : theme.textSecondary}
                          />
                          <ThemedText
                            type="smallBold"
                            style={{ fontSize: 13, color: active ? '#fff' : theme.text }}>
                            {ex.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Süre + tahmini kalori */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three }}>
            <View style={{ flex: 1, gap: Spacing.one }}>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                Süre (dakika)
              </ThemedText>
              <View style={[styles.fieldBox, { backgroundColor: theme.backgroundElement }]}>
                <TextInput
                  value={minutes}
                  onChangeText={(t) => setMinutes(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.fieldInput, { color: theme.text }]}
                />
              </View>
            </View>
            <View style={{ alignItems: 'center', paddingBottom: Spacing.two }}>
              <ThemedText type="smallBold" style={{ fontSize: 24, color: theme.accent }}>
                {kcal}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                tahmini kcal
              </ThemedText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Pressable
              onPress={handleClose}
              style={[styles.modalBtn, { borderColor: theme.border, borderWidth: 1 }]}>
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

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: '70%',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.one,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
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
