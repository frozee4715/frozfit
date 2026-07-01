import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  type AIContext,
  type GeneratedRecipe,
  detectFridgeIngredients,
  generateRecipe,
  isAIEnabled,
} from '@/lib/ai';
import { useAccountGate } from '@/lib/account-gate';
import { useAiAccess } from '@/lib/ai-credits';
import { useAuth } from '@/lib/auth-context';
import { shareRecipe } from '@/lib/community';
import { MEAL_TYPES, type MealType, useDailyLog } from '@/lib/daily-log';
import { allergenLabel, caloriesPerMeal, goalLabel } from '@/lib/plan';
import { useUserProfile } from '@/lib/user-profile';

/** Saate göre varsayılan öğün. */
function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

const STYLE_OPTIONS = [
  'Hafif',
  'Doyurucu',
  'Yüksek protein',
  'Düşük kalori',
  'Hızlı (20 dk)',
  'Tek tencere',
];

type Phase = 'capture' | 'ingredients' | 'result';

export default function FridgeScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { addMeal } = useDailyLog();
  const access = useAiAccess();
  const { requireAccount } = useAccountGate();

  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIng, setNewIng] = useState('');

  const [mealType, setMealType] = useState<MealType>(defaultMealType());
  const [styles_, setStyles] = useState<string[]>([]);
  const [extra, setExtra] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedRecipe | null>(null);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  const ctx: AIContext | undefined = profile
    ? {
        diet: profile.diet,
        allergies: profile.allergies.map(allergenLabel),
        calorieTarget: profile.plan.calorieGoal,
        perMealKcal: caloriesPerMeal(profile.plan, profile.mealsPerDay),
        goal: goalLabel(profile.goal),
      }
    : undefined;

  const scan = async (from: 'camera' | 'library') => {
    setError(null);
    if (!requireAccount()) return;
    // Kredi kapısı (Pro değilse ve kredi yoksa).
    if (!access.consume()) {
      router.push('/get-credits');
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
    if (res.canceled || !res.assets[0]?.base64) return;

    setImageUri(res.assets[0].uri);
    setLoading(true);
    setError(null);
    try {
      const found = await detectFridgeIngredients(`data:image/jpeg;base64,${res.assets[0].base64}`);
      if (found.length === 0) {
        setError('Fotoğrafta malzeme algılanamadı. Malzemelerin net göründüğü bir fotoğraf dene.');
      } else {
        setIngredients(found);
        setPhase('ingredients');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Malzemeler tanınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const removeIng = (ing: string) => setIngredients((prev) => prev.filter((i) => i !== ing));
  const addIng = () => {
    const v = newIng.trim();
    if (v && !ingredients.includes(v)) setIngredients((prev) => [...prev, v]);
    setNewIng('');
  };
  const toggleStyle = (s: string) =>
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const generate = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAdded(false);
    setShared(false);
    const mealTitle = MEAL_TYPES.find((m) => m.value === mealType)?.title ?? 'öğün';
    const styleText = styles_.length ? styles_.join(', ') + ' tarzında, ' : '';
    const req =
      `Buzdolabımda şu malzemeler var: ${ingredients.join(', ')}. ` +
      `Bu malzemelerle ${mealTitle} için ${styleText}sağlıklı bir tarif öner. ` +
      `Mümkün olduğunca SADECE bu malzemeleri kullan; sadece temel baharat/yağ/su eklenebilir.` +
      (extra.trim() ? ` Ek isteğim: ${extra.trim()}.` : '');
    try {
      setResult(await generateRecipe(req, ctx));
      setPhase('result');
    } catch (e: any) {
      setError(e?.message ?? 'Tarif üretilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const addToDay = () => {
    if (!result) return;
    addMeal({
      name: result.title,
      mealType,
      portion: '1 porsiyon',
      kcal: result.kcal,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
    });
    setAdded(true);
  };

  const share = async () => {
    if (!result || !user) return;
    try {
      await shareRecipe(user.uid, profile?.name || 'Bir FrozFit kullanıcısı', {
        title: result.title,
        image: '',
        kcal: result.kcal,
        minutes: result.minutes,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        ingredients: result.ingredients,
        steps: result.steps,
      });
      setShared(true);
    } catch {
      setError('Paylaşılamadı.');
    }
  };

  const restart = () => {
    setPhase('capture');
    setImageUri(null);
    setIngredients([]);
    setResult(null);
    setError(null);
    setStyles([]);
    setExtra('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={[
          s.topBar,
          { paddingTop: insets.top + Spacing.two, backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={{ fontSize: 18 }}>
          Buzdolabını tara
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        {!isAIEnabled() ? (
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
            Bu özellik için AI gerekli. OpenRouter anahtarını/proxy’yi etkinleştir.
          </ThemedText>
        ) : (
          <>
            {/* AÇIKLAMA */}
            {phase === 'capture' && (
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
                Buzdolabının ya da malzemelerinin fotoğrafını çek; AI içindekileri tanıyıp sana
                sağlıklı bir tarif önersin.
              </ThemedText>
            )}

            {/* FOTO */}
            {imageUri && <Image source={{ uri: imageUri }} style={s.preview} contentFit="cover" />}

            {phase === 'capture' && (
              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                <Pressable onPress={() => scan('camera')} style={[s.pickBtn, { backgroundColor: theme.primary }]}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
                    Fotoğraf çek
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => scan('library')}
                  style={[s.pickBtn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
                  <Ionicons name="images-outline" size={18} color={theme.text} />
                  <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                    Galeriden
                  </ThemedText>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three }}>
                <ActivityIndicator color={theme.primary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {phase === 'result' || result ? 'Tarif hazırlanıyor...' : 'Malzemeler tanınıyor...'}
                </ThemedText>
              </View>
            )}

            {error && (
              <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
                {error}
              </ThemedText>
            )}

            {/* MALZEMELER + SORULAR */}
            {phase === 'ingredients' && !loading && (
              <>
                <Card style={{ gap: Spacing.three }}>
                  <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                    Bulunan malzemeler
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    Yanlış olanı kaldır, eksik olanı ekle.
                  </ThemedText>
                  <View style={s.chipWrap}>
                    {ingredients.map((ing) => (
                      <Pressable key={ing} onPress={() => removeIng(ing)} style={[s.ingChip, { backgroundColor: theme.primarySoft }]}>
                        <ThemedText type="smallBold" style={{ fontSize: 13, color: theme.primaryDark }}>
                          {ing}
                        </ThemedText>
                        <Ionicons name="close" size={14} color={theme.primaryDark} />
                      </Pressable>
                    ))}
                  </View>
                  <View style={[s.addRow, { backgroundColor: theme.backgroundElement }]}>
                    <TextInput
                      placeholder="Malzeme ekle..."
                      placeholderTextColor={theme.textMuted}
                      value={newIng}
                      onChangeText={setNewIng}
                      onSubmitEditing={addIng}
                      style={[s.addInput, { color: theme.text }]}
                    />
                    <Pressable onPress={addIng} hitSlop={8}>
                      <Ionicons name="add-circle" size={26} color={theme.primary} />
                    </Pressable>
                  </View>
                </Card>

                {/* SORULAR: tam olarak ne istiyor? */}
                <Card style={{ gap: Spacing.three }}>
                  <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                    Nasıl bir şey istersin?
                  </ThemedText>

                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    Hangi öğün?
                  </ThemedText>
                  <View style={s.chipWrap}>
                    {MEAL_TYPES.map((mt) => {
                      const sel = mt.value === mealType;
                      return (
                        <Pressable
                          key={mt.value}
                          onPress={() => setMealType(mt.value)}
                          style={[s.opt, { backgroundColor: sel ? theme.primary : theme.backgroundElement }]}>
                          <ThemedText type="smallBold" style={{ fontSize: 13, color: sel ? '#fff' : theme.text }}>
                            {mt.title}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    Tarz (birden çok seçebilirsin)
                  </ThemedText>
                  <View style={s.chipWrap}>
                    {STYLE_OPTIONS.map((st) => {
                      const sel = styles_.includes(st);
                      return (
                        <Pressable
                          key={st}
                          onPress={() => toggleStyle(st)}
                          style={[s.opt, { backgroundColor: sel ? theme.primary : theme.backgroundElement }]}>
                          <ThemedText type="smallBold" style={{ fontSize: 13, color: sel ? '#fff' : theme.text }}>
                            {st}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    Ekstra isteğin (opsiyonel)
                  </ThemedText>
                  <View style={[s.addRow, { backgroundColor: theme.backgroundElement }]}>
                    <TextInput
                      placeholder="örn. acılı olsun, fırın istemiyorum"
                      placeholderTextColor={theme.textMuted}
                      value={extra}
                      onChangeText={setExtra}
                      style={[s.addInput, { color: theme.text }]}
                    />
                  </View>
                </Card>

                <Pressable onPress={generate} style={[s.cta, { backgroundColor: theme.primary }]}>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                    Tarif öner
                  </ThemedText>
                </Pressable>
              </>
            )}

            {/* SONUÇ */}
            {phase === 'result' && result && !loading && (
              <View style={{ gap: Spacing.three }}>
                <ThemedText type="subtitle" style={{ fontSize: 20 }}>
                  {result.title}
                </ThemedText>
                <View style={s.macroRow}>
                  <Macro label="Kalori" value={`${result.kcal}`} color={theme.calorie} />
                  <Macro label="Prot" value={`${result.protein}g`} color={theme.protein} />
                  <Macro label="Karb" value={`${result.carbs}g`} color={theme.carbs} />
                  <Macro label="Yağ" value={`${result.fat}g`} color={theme.fat} />
                </View>

                {result.ingredients.length > 0 && (
                  <View style={{ gap: Spacing.one }}>
                    <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                      Malzemeler
                    </ThemedText>
                    {result.ingredients.map((ing, i) => (
                      <ThemedText key={i} type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                        • {ing}
                      </ThemedText>
                    ))}
                  </View>
                )}

                {result.steps.length > 0 && (
                  <View style={{ gap: Spacing.one }}>
                    <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                      Yapılışı
                    </ThemedText>
                    {result.steps.map((st, i) => (
                      <ThemedText key={i} type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                        {i + 1}. {st}
                      </ThemedText>
                    ))}
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                  <Pressable
                    onPress={addToDay}
                    disabled={added}
                    style={[s.resultBtn, { backgroundColor: added ? theme.primaryDark : theme.primary, flex: 1 }]}>
                    <Ionicons name={added ? 'checkmark' : 'add'} size={16} color="#fff" />
                    <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
                      {added ? 'Eklendi' : 'Güne ekle'}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={share}
                    disabled={shared || !user}
                    style={[s.resultBtn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth, flex: 1 }]}>
                    <Ionicons name={shared ? 'checkmark' : 'share-social-outline'} size={16} color={theme.text} />
                    <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                      {shared ? 'Paylaşıldı' : 'Paylaş'}
                    </ThemedText>
                  </Pressable>
                </View>

                <Pressable onPress={restart} style={[s.secondaryBtn, { borderColor: theme.border }]}>
                  <Ionicons name="camera-outline" size={16} color={theme.text} />
                  <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                    Yeniden tara
                  </ThemedText>
                </Pressable>

                <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
                  Not: Bu yapay zekâ önerisidir; değerler tahminidir.
                </ThemedText>
              </View>
            )}
          </>
        )}
      </Screen>
    </View>
  );
}

function Macro({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={[s.macroCell, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ fontSize: 14, color }}>
        {value}
      </ThemedText>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: '#DDE6E1',
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  ingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  opt: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 48,
    borderRadius: Radius.md,
  },
  addInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 54,
    borderRadius: Radius.pill,
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
  resultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    height: 46,
    borderRadius: Radius.pill,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 46,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
