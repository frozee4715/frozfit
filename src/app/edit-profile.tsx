import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import {
  Field,
  NumberInput,
  OptionRow,
  PlanStatItem,
  SelectPill,
  TextField,
  formStyles,
} from '@/components/ui/form';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import {
  ALLERGENS,
  COOKING_TIMES,
  DIETS,
  computePlan,
  type Activity,
  type AllergenKey,
  type CookingTime,
  type Diet,
  type Gender,
  type Goal,
} from '@/lib/plan';
import { isUploadEnabled, uploadRecipeImage } from '@/lib/supabase-upload';
import { updateProfile, useUserProfile } from '@/lib/user-profile';

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

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [name, setName] = useState(profile?.name ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(profile?.photoUri ?? null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'female');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [height, setHeight] = useState(profile?.height ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile?.weight ? String(profile.weight) : '');
  const [targetWeight, setTargetWeight] = useState(
    profile?.targetWeight ? String(profile.targetWeight) : '',
  );
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'lose');
  const [activity, setActivity] = useState<Activity>(profile?.activity ?? 'moderate');
  const [diet, setDiet] = useState<Diet>(profile?.diet ?? 'omnivore');
  const [allergies, setAllergies] = useState<AllergenKey[]>(profile?.allergies ?? []);
  const [mealsPerDay, setMealsPerDay] = useState(profile?.mealsPerDay ?? 3);
  const [cookingTime, setCookingTime] = useState<CookingTime>(profile?.cookingTime ?? 'medium');
  const [dislikes, setDislikes] = useState((profile?.dislikes ?? []).join(', '));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Galeriden fotoğraf seç → mümkünse Supabase'e yükle (kalıcı URL), değilse
  // yerel URI'yi kullan (yalnızca bu cihazda görünür).
  const pickPhoto = async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Fotoğraf seçmek için galeri izni gerekli.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: isUploadEnabled(),
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    setPhotoBusy(true);
    try {
      if (isUploadEnabled() && asset.base64 && user) {
        const url = await uploadRecipeImage(user.uid, asset.base64);
        setPhotoUri(url);
      } else {
        // Supabase kapalıysa yerel URI (cihaz değişince kaybolur — bilgilendirici).
        setPhotoUri(asset.uri);
      }
    } catch {
      setError('Fotoğraf yüklenemedi. İnternet bağlantını kontrol et.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const dislikeList = dislikes.split(',').map((d) => d.trim()).filter(Boolean);
  const toggleAllergy = (key: AllergenKey) =>
    setAllergies((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));

  const nums = {
    age: Number(age),
    height: Number(height),
    weight: Number(weight),
    targetWeight: Number(targetWeight),
  };

  const valid =
    name.trim().length > 0 &&
    nums.age >= 10 && nums.age <= 100 &&
    nums.height >= 100 && nums.height <= 250 &&
    nums.weight >= 30 && nums.weight <= 300 &&
    nums.targetWeight >= 30 && nums.targetWeight <= 300;

  const preview = useMemo(() => {
    if (!valid) return null;
    return computePlan({ gender, goal, activity, ...nums });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, gender, goal, activity, age, height, weight, targetWeight]);

  const save = async () => {
    if (!user || !valid) return;
    setError(null);
    setBusy(true);
    try {
      await updateProfile(user.uid, {
        name: name.trim(),
        photoUri,
        gender,
        goal,
        activity,
        ...nums,
        diet,
        allergies,
        mealsPerDay,
        cookingTime,
        dislikes: dislikeList,
      });
      router.back();
    } catch {
      setError('Kaydedilemedi. İnternet bağlantını kontrol et.');
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Üst bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + Spacing.two, backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={{ fontSize: 18 }}>
          Profili düzenle
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        {/* Profil fotoğrafı */}
        <View style={{ alignItems: 'center', gap: Spacing.two }}>
          <Pressable onPress={pickPhoto} disabled={photoBusy}>
            <View style={[styles.photo, { backgroundColor: theme.primary, borderColor: theme.card }]}>
              {photoBusy ? (
                <ActivityIndicator color="#fff" />
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImg} contentFit="cover" />
              ) : (
                <ThemedText style={{ color: '#fff', fontSize: 34, fontWeight: '700' }}>
                  {name.trim().slice(0, 1).toUpperCase() || '👤'}
                </ThemedText>
              )}
              <View style={[styles.photoBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="camera" size={16} color={theme.text} />
              </View>
            </View>
          </Pressable>
          <Pressable onPress={pickPhoto} disabled={photoBusy} hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 13 }}>
              {photoUri ? 'Fotoğrafı değiştir' : 'Profil fotoğrafı ekle'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Kişisel bilgiler */}
        <Field label="Adın">
          <TextField placeholder="Adın" value={name} onChangeText={setName} />
        </Field>

        <Field label="Cinsiyet">
          <View style={formStyles.row}>
            {GENDERS.map((g) => (
              <SelectPill key={g.value} label={g.label} selected={gender === g.value} onPress={() => setGender(g.value)} />
            ))}
          </View>
        </Field>

        <View style={formStyles.row}>
          <Field label="Yaş" style={{ flex: 1 }}>
            <NumberInput value={age} onChangeText={setAge} placeholder="28" maxLength={3} />
          </Field>
          <Field label="Boy (cm)" style={{ flex: 1 }}>
            <NumberInput value={height} onChangeText={setHeight} placeholder="170" maxLength={3} />
          </Field>
        </View>

        <View style={formStyles.row}>
          <Field label="Kilo (kg)" style={{ flex: 1 }}>
            <NumberInput value={weight} onChangeText={setWeight} placeholder="72" maxLength={3} />
          </Field>
          <Field label="Hedef (kg)" style={{ flex: 1 }}>
            <NumberInput value={targetWeight} onChangeText={setTargetWeight} placeholder="66" maxLength={3} />
          </Field>
        </View>

        {/* Hedef */}
        <Field label="Hedefin">
          <View style={formStyles.row}>
            {GOALS.map((g) => {
              const on = goal === g.value;
              return (
                <Pressable
                  key={g.value}
                  onPress={() => setGoal(g.value)}
                  style={[
                    styles.goalBtn,
                    { backgroundColor: on ? theme.primary : theme.backgroundElement, borderColor: on ? theme.primary : theme.border },
                  ]}>
                  <Ionicons name={g.icon} size={20} color={on ? '#fff' : theme.textSecondary} />
                  <ThemedText type="smallBold" style={{ color: on ? '#fff' : theme.textSecondary, fontSize: 13 }}>
                    {g.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {/* Aktivite */}
        <Field label="Aktivite seviyen">
          <View style={{ gap: Spacing.two }}>
            {ACTIVITIES.map((a) => (
              <OptionRow key={a.value} title={a.label} hint={a.hint} selected={activity === a.value} onPress={() => setActivity(a.value)} />
            ))}
          </View>
        </Field>

        {/* Diyet */}
        <Field label="Diyet tercihin">
          <View style={formStyles.wrap}>
            {DIETS.map((d) => (
              <Chip key={d.value} label={d.label} selected={diet === d.value} onPress={() => setDiet(d.value)} />
            ))}
          </View>
        </Field>

        {/* Alerjiler */}
        <Field label="Alerji / kaçındığın besinler" hint="Seçtiklerini içeren tarifler senin için gizlenir.">
          <View style={formStyles.wrap}>
            {ALLERGENS.map((a) => (
              <Chip key={a.value} label={a.label} selected={allergies.includes(a.value)} onPress={() => toggleAllergy(a.value)} />
            ))}
          </View>
        </Field>

        {/* Öğün sayısı */}
        <Field label="Günde kaç öğün?">
          <View style={formStyles.row}>
            {MEAL_COUNTS.map((n) => (
              <SelectPill key={n} label={`${n}`} selected={mealsPerDay === n} onPress={() => setMealsPerDay(n)} />
            ))}
          </View>
        </Field>

        {/* Mutfak vakti */}
        <Field label="Mutfakta vaktin">
          <View style={{ gap: Spacing.two }}>
            {COOKING_TIMES.map((c) => (
              <OptionRow key={c.value} title={c.label} hint={c.hint} selected={cookingTime === c.value} onPress={() => setCookingTime(c.value)} />
            ))}
          </View>
        </Field>

        {/* Sevmediği besinler */}
        <Field label="Sevmediğin besinler (virgülle ayır)">
          <TextField placeholder="örn. brokoli, mantar, ciğer" value={dislikes} onChangeText={setDislikes} />
        </Field>

        {/* Plan önizleme */}
        {preview && (
          <Card style={{ gap: Spacing.three }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Ionicons name="sparkles" size={18} color={theme.primary} />
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                Güncellenen planın
              </ThemedText>
            </View>
            <View style={formStyles.statsRow}>
              <PlanStatItem label="Kalori" value={preview.calorieGoal} unit="kcal" color={theme.calorie} />
              <PlanStatItem label="Protein" value={preview.protein} unit="g" color={theme.protein} />
              <PlanStatItem label="Karb" value={preview.carbs} unit="g" color={theme.carbs} />
              <PlanStatItem label="Yağ" value={preview.fat} unit="g" color={theme.fat} />
            </View>
          </Card>
        )}

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}

        <Pressable
          onPress={save}
          disabled={!valid || busy}
          style={[styles.saveBtn, { backgroundColor: valid ? theme.primary : theme.backgroundSelected, opacity: busy ? 0.7 : 1 }]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
              Değişiklikleri kaydet
            </ThemedText>
          )}
        </Pressable>
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
  photo: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    overflow: 'visible',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.pill,
  },
  photoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
  saveBtn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
