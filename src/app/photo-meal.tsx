import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type AIContext, type FoodEstimate, analyzeFoodPhoto } from '@/lib/ai';
import { useAccountGate } from '@/lib/account-gate';
import { useAiAccess } from '@/lib/ai-credits';
import { MEAL_TYPES, type MealType, useDailyLog } from '@/lib/daily-log';
import { allergenLabel, goalLabel } from '@/lib/plan';
import { useUserProfile } from '@/lib/user-profile';

export default function PhotoMealScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meal } = useLocalSearchParams<{ meal?: string }>();
  const { addMeal } = useDailyLog();
  const { profile } = useUserProfile();
  const access = useAiAccess();
  const { requireAccount } = useAccountGate();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<FoodEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>((meal as MealType) || 'snack');

  const ctx: AIContext | undefined = profile
    ? { diet: profile.diet, allergies: profile.allergies.map(allergenLabel), goal: goalLabel(profile.goal) }
    : undefined;

  const analyze = async (base64: string, uri: string) => {
    setImageUri(uri);
    setEstimate(null);
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeFoodPhoto(`data:image/jpeg;base64,${base64}`, ctx);
      // Model yemek bulamadıysa (kcal 0) tahmini gösterme, uyar.
      if (result.kcal <= 0) {
        setError('Fotoğrafta yemek algılanamadı. Yemeğin net göründüğü bir fotoğraf dene.');
      } else {
        setEstimate(result);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Görsel analiz edilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const pick = async (from: 'camera' | 'library') => {
    setError(null);
    if (!requireAccount()) return;
    if (!access.consume()) {
      router.push('/get-credits' as Href);
      return;
    }
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('İzin verilmedi.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.4 };
    const res =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]?.base64) {
      analyze(res.assets[0].base64, res.assets[0].uri);
    }
  };

  const add = () => {
    if (!estimate) return;
    addMeal({
      name: estimate.name,
      mealType,
      portion: 'Fotoğraf tahmini',
      kcal: estimate.kcal,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
    });
    router.back();
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
          Fotoğraftan kalori
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
          Yemeğinin fotoğrafını çek; AI tahmini kalori ve makroları çıkarsın.
        </ThemedText>

        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Pressable onPress={() => pick('camera')} style={[styles.pickBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="camera" size={18} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
              Fotoğraf çek
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => pick('library')}
            style={[styles.pickBtn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Ionicons name="images-outline" size={18} color={theme.text} />
            <ThemedText type="smallBold" style={{ fontSize: 14 }}>
              Galeriden
            </ThemedText>
          </Pressable>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
        )}

        {loading && (
          <View style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three }}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary">
              Yemek analiz ediliyor...
            </ThemedText>
          </View>
        )}

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}

        {estimate && (
          <View style={{ gap: Spacing.three }}>
            <ThemedText type="subtitle" style={{ fontSize: 20 }}>
              {estimate.name}
            </ThemedText>
            <View style={styles.macroRow}>
              <Macro label="Kalori" value={`${estimate.kcal}`} color={theme.calorie} />
              <Macro label="Prot" value={`${estimate.protein}g`} color={theme.protein} />
              <Macro label="Karb" value={`${estimate.carbs}g`} color={theme.carbs} />
              <Macro label="Yağ" value={`${estimate.fat}g`} color={theme.fat} />
            </View>

            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((mt) => {
                const sel = mt.value === mealType;
                return (
                  <Pressable
                    key={mt.value}
                    onPress={() => setMealType(mt.value)}
                    style={[
                      styles.mealChip,
                      { backgroundColor: sel ? theme.primary : theme.backgroundElement, borderColor: sel ? theme.primary : theme.border },
                    ]}>
                    <ThemedText type="small" style={{ fontSize: 12, color: sel ? '#fff' : theme.textSecondary }}>
                      {mt.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={add} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={20} color="#fff" />
              <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                Güne ekle
              </ThemedText>
            </Pressable>

            <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
              Not: Bu yapay zekâ tahminidir, kesin değildir. Gerekirse değeri elle düzeltebilirsin.
            </ThemedText>
          </View>
        )}
      </Screen>
    </View>
  );
}

function Macro({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.macroCell, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ fontSize: 14, color }}>
        {value}
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
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    borderRadius: Radius.pill,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
    backgroundColor: '#DDE6E1',
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  macroCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mealChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 54,
    borderRadius: Radius.pill,
  },
});
