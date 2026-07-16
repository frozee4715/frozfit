import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import {
  ALLERGENS,
  buildSuggestions,
  computePlan,
  COOKING_TIMES,
  DIETS,
  type Activity,
  type AllergenKey,
  type CookingTime,
  type Diet,
  type Gender,
  type Goal,
} from '@/lib/plan';
import { saveOnboarding } from '@/lib/user-profile';

const MEAL_COUNTS = [2, 3, 4, 5];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
];

const GOALS: { value: Goal; label: string; icon: any }[] = [
  { value: 'lose', label: 'Kilo ver', icon: 'trending-down-outline' },
  { value: 'maintain', label: 'Koru', icon: 'remove-outline' },
  { value: 'gain', label: 'Kilo al', icon: 'trending-up-outline' },
  { value: 'muscle', label: 'Kas yap', icon: 'barbell-outline' },
];

const ACTIVITIES: { value: Activity; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Hareketsiz', hint: 'Masa başı, az hareket' },
  { value: 'light', label: 'Az aktif', hint: 'Haftada 1-2 antrenman' },
  { value: 'moderate', label: 'Orta', hint: 'Haftada 3-4 antrenman' },
  { value: 'active', label: 'Çok aktif', hint: 'Haftada 5+ antrenman' },
];

/** Sihirbaz adımları — başlık + alt başlık. Son adım plan önizlemesidir. */
const STEP_META: { title: string; subtitle: string }[] = [
  { title: 'Seni tanıyalım', subtitle: 'Adın ve cinsiyetinle başlayalım.' },
  { title: 'Ölçülerin', subtitle: 'Plan hesabı için birkaç sayı.' },
  { title: 'Hedefin', subtitle: 'Neyi başarmak istiyorsun?' },
  { title: 'Beslenme tercihin', subtitle: 'Sana uygun tarifler için.' },
  { title: 'Mutfak alışkanlıkların', subtitle: 'Öğün ve pişirme tercihlerin.' },
  { title: 'Planın hazır', subtitle: 'Sana özel kalori ve makro hedeflerin.' },
];
const TOTAL_STEPS = STEP_META.length;

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('lose');
  const [activity, setActivity] = useState<Activity>('moderate');
  const [diet, setDiet] = useState<Diet>('omnivore');
  const [allergies, setAllergies] = useState<AllergenKey[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [cookingTime, setCookingTime] = useState<CookingTime>('medium');
  const [dislikes, setDislikes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dislikeList = dislikes
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);

  const toggleAllergy = (key: AllergenKey) =>
    setAllergies((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));

  const prefs = { diet, allergies, mealsPerDay, cookingTime, dislikes: dislikeList };

  const nums = {
    age: Number(age),
    height: Number(height),
    weight: Number(weight),
    targetWeight: Number(targetWeight),
  };

  const valid =
    name.trim().length > 0 &&
    nums.age >= 10 &&
    nums.age <= 100 &&
    nums.height >= 100 &&
    nums.height <= 250 &&
    nums.weight >= 30 &&
    nums.weight <= 300 &&
    nums.targetWeight >= 30 &&
    nums.targetWeight <= 300;

  // Canlı plan önizlemesi (geçerli veriler girildiğinde).
  const preview = useMemo(() => {
    if (!valid) return null;
    return computePlan({ gender, goal, activity, ...nums });
  }, [valid, gender, goal, activity, nums.age, nums.height, nums.weight, nums.targetWeight]);

  const suggestions = useMemo(() => {
    if (!preview) return [];
    return buildSuggestions({ gender, goal, activity, ...nums }, preview, prefs).slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, diet, allergies, mealsPerDay, cookingTime, dislikes]);

  // Ölçüler adımının (1) kendi içinde geçerliliği.
  const measuresValid =
    nums.age >= 10 &&
    nums.age <= 100 &&
    nums.height >= 100 &&
    nums.height <= 250 &&
    nums.weight >= 30 &&
    nums.weight <= 300 &&
    nums.targetWeight >= 30 &&
    nums.targetWeight <= 300;

  // O adımdan ilerlemek için gereken koşul.
  const stepValid = (s: number): boolean => {
    if (s === 0) return name.trim().length > 0;
    if (s === 1) return measuresValid;
    return true; // diğer adımların varsayılanları geçerli
  };
  const canNext = stepValid(step);
  const goNext = () => {
    if (step < TOTAL_STEPS - 1 && canNext) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const save = async () => {
    if (!user || !valid) return;
    setError(null);
    setBusy(true);
    try {
      await saveOnboarding(user.uid, user.isAnonymous, {
        name: name.trim(),
        gender,
        goal,
        activity,
        ...nums,
        ...prefs,
      });
      // Kayıt sonrası kök yönlendirici ana uygulamaya götürür.
    } catch {
      setError('Plan kaydedilemedi. İnternet bağlantını kontrol et.');
      setBusy(false);
    }
  };

  const meta = STEP_META[step];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Başlık + ilerleme */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.stepHead}>
          {step > 0 ? (
            <Pressable onPress={goBack} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color={theme.text} />
            </Pressable>
          ) : (
            <View style={{ width: 26 }} />
          )}
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
            Adım {step + 1} / {TOTAL_STEPS}
          </ThemedText>
          {/* Dönen kullanıcı: kişiselleştirmeyi atlayıp doğrudan giriş yapabilir. */}
          {step === 0 ? (
            <Pressable
              onPress={() => router.push({ pathname: '/login', params: { mode: 'signin' } } as Href)}
              hitSlop={8}>
              <ThemedText type="smallBold" style={{ fontSize: 13, color: theme.primary }}>
                Giriş yap
              </ThemedText>
            </Pressable>
          ) : (
            <View style={{ width: 26 }} />
          )}
        </View>
        <ProgressBar progress={(step + 1) / TOTAL_STEPS} color={theme.primary} />
        <View style={{ gap: Spacing.one, marginTop: Spacing.three }}>
          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 32 }}>
            {meta.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {meta.subtitle}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Adım 1 — İsim + Cinsiyet */}
        {step === 0 && (
          <>
            <Field label="Adın">
        <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            placeholder="Adın"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
            style={[styles.inputText, { color: theme.text }]}
          />
        </View>
      </Field>

      {/* Cinsiyet */}
      <Field label="Cinsiyet">
        <View style={styles.row}>
          {GENDERS.map((g) => (
            <SelectPill
              key={g.value}
              label={g.label}
              selected={gender === g.value}
              onPress={() => setGender(g.value)}
            />
          ))}
        </View>
      </Field>

          </>
        )}

        {/* Adım 2 — Ölçüler */}
        {step === 1 && (
          <>
            <View style={styles.row}>
              <Field label="Yaş" style={{ flex: 1 }}>
                <NumberInput value={age} onChangeText={setAge} placeholder="28" />
              </Field>
              <Field label="Boy (cm)" style={{ flex: 1 }}>
                <NumberInput value={height} onChangeText={setHeight} placeholder="170" />
              </Field>
            </View>
            <View style={styles.row}>
              <Field label="Kilo (kg)" style={{ flex: 1 }}>
                <NumberInput value={weight} onChangeText={setWeight} placeholder="72" />
              </Field>
              <Field label="Hedef (kg)" style={{ flex: 1 }}>
                <NumberInput value={targetWeight} onChangeText={setTargetWeight} placeholder="66" />
              </Field>
            </View>
          </>
        )}

        {/* Adım 3 — Hedef + Aktivite */}
        {step === 2 && (
          <>
            <Field label="Hedefin">
        <View style={styles.row}>
          {GOALS.map((g) => (
            <Pressable
              key={g.value}
              onPress={() => setGoal(g.value)}
              style={[
                styles.goalBtn,
                {
                  backgroundColor: goal === g.value ? theme.primary : theme.backgroundElement,
                  borderColor: goal === g.value ? theme.primary : theme.border,
                },
              ]}>
              <Ionicons
                name={g.icon}
                size={20}
                color={goal === g.value ? '#fff' : theme.textSecondary}
              />
              <ThemedText
                type="smallBold"
                style={{ color: goal === g.value ? '#fff' : theme.textSecondary, fontSize: 13 }}>
                {g.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Field>

      {/* Aktivite */}
      <Field label="Aktivite seviyen">
        <View style={{ gap: Spacing.two }}>
          {ACTIVITIES.map((a) => {
            const on = activity === a.value;
            return (
              <Pressable
                key={a.value}
                onPress={() => setActivity(a.value)}
                style={[
                  styles.activityRow,
                  {
                    backgroundColor: on ? theme.primarySoft : theme.backgroundElement,
                    borderColor: on ? theme.primary : theme.border,
                  },
                ]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                    {a.label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {a.hint}
                  </ThemedText>
                </View>
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={on ? theme.primary : theme.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </Field>

          </>
        )}

        {/* Adım 4 — Diyet + Alerjiler */}
        {step === 3 && (
          <>
            <Field label="Diyet tercihin">
        <View style={styles.wrap}>
          {DIETS.map((d) => (
            <Chip
              key={d.value}
              label={d.label}
              selected={diet === d.value}
              onPress={() => setDiet(d.value)}
            />
          ))}
        </View>
      </Field>

      {/* Alerjiler */}
      <Field label="Alerji / kaçındığın besinler">
        <View style={styles.wrap}>
          {ALLERGENS.map((a) => (
            <Chip
              key={a.value}
              label={a.label}
              selected={allergies.includes(a.value)}
              onPress={() => toggleAllergy(a.value)}
            />
          ))}
        </View>
        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
          Seçtiklerini içeren tarifler senin için gizlenir.
        </ThemedText>
      </Field>

          </>
        )}

        {/* Adım 5 — Öğün + Mutfak + Sevmediğin */}
        {step === 4 && (
          <>
            <Field label="Günde kaç öğün?">
        <View style={styles.row}>
          {MEAL_COUNTS.map((n) => (
            <SelectPill
              key={n}
              label={`${n}`}
              selected={mealsPerDay === n}
              onPress={() => setMealsPerDay(n)}
            />
          ))}
        </View>
      </Field>

      {/* Mutfakta vakit */}
      <Field label="Mutfakta vaktin">
        <View style={{ gap: Spacing.two }}>
          {COOKING_TIMES.map((c) => {
            const on = cookingTime === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCookingTime(c.value)}
                style={[
                  styles.activityRow,
                  {
                    backgroundColor: on ? theme.primarySoft : theme.backgroundElement,
                    borderColor: on ? theme.primary : theme.border,
                  },
                ]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                    {c.label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {c.hint}
                  </ThemedText>
                </View>
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={on ? theme.primary : theme.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </Field>

      {/* Sevmediğin besinler */}
      <Field label="Sevmediğin besinler (virgülle ayır)">
        <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            placeholder="örn. brokoli, mantar, ciğer"
            placeholderTextColor={theme.textMuted}
            value={dislikes}
            onChangeText={setDislikes}
            style={[styles.inputText, { color: theme.text }]}
          />
        </View>
      </Field>

          </>
        )}

        {/* Adım 6 — Plan önizleme */}
        {step === 5 && (
          <>
            {!preview && (
              <ThemedText type="small" themeColor="textSecondary">
                Planını görmek için önceki adımlardaki bilgileri eksiksiz doldur.
              </ThemedText>
            )}
            {preview && (
        <Card style={{ gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Ionicons name="sparkles" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>
              Senin için planın
            </ThemedText>
          </View>
          <View style={styles.statsRow}>
            <PlanStat label="Kalori" value={`${preview.calorieGoal}`} unit="kcal" color={theme.calorie} />
            <PlanStat label="Protein" value={`${preview.protein}`} unit="g" color={theme.protein} />
            <PlanStat label="Karb" value={`${preview.carbs}`} unit="g" color={theme.carbs} />
            <PlanStat label="Yağ" value={`${preview.fat}`} unit="g" color={theme.fat} />
          </View>
          {suggestions.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Ionicons name="bulb-outline" size={15} color={theme.primaryDark} style={{ marginTop: 2 }} />
              <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1, fontSize: 13 }}>
                {s}
              </ThemedText>
            </View>
          ))}
        </Card>
            )}
          </>
        )}
      </ScrollView>

      {/* Alt navigasyon */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three, borderTopColor: theme.border }]}>
        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13, marginBottom: Spacing.two }}>
            {error}
          </ThemedText>
        )}
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {step > 0 && (
            <Pressable
              onPress={goBack}
              style={[styles.navBtn, { borderColor: theme.border, borderWidth: 1 }]}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 16 }}>
                Geri
              </ThemedText>
            </Pressable>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Pressable
              onPress={goNext}
              disabled={!canNext}
              style={[styles.navBtn, { backgroundColor: theme.primary, opacity: canNext ? 1 : 0.5, flex: 1 }]}>
              <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                Devam
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={save}
              disabled={!valid || busy}
              style={[styles.navBtn, { backgroundColor: valid ? theme.primary : theme.backgroundSelected, opacity: busy ? 0.7 : 1, flex: 1 }]}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                  Planımı oluştur
                </ThemedText>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[{ gap: Spacing.two }, style]}>
      <ThemedText type="smallBold" style={{ fontSize: 14 }}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function NumberInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
        style={[styles.inputText, { color: theme.text }]}
      />
    </View>
  );
}

function SelectPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? '#fff' : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function PlanStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 2, flex: 1 }}>
      <ThemedText type="smallBold" style={{ color, fontSize: 18 }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 11 }}>
        {unit}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    height: 50,
    borderRadius: Radius.md,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  goalBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
});
