import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { RecipeImage } from '@/components/recipe-image';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import type { Recipe } from '@/constants/mock-data';
import { aiSuggestedRecipes } from '@/constants/mock-data';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type AIContext, type GeneratedRecipe, generateRecipe, isAIEnabled } from '@/lib/ai';
import { useAiAccess } from '@/lib/ai-credits';
import { useAuth } from '@/lib/auth-context';
import { shareRecipe } from '@/lib/community';
import { useDailyLog } from '@/lib/daily-log';
import { allergenLabel, caloriesPerMeal, goalLabel } from '@/lib/plan';
import { filterRecipes } from '@/lib/recipe-filter';
import { useUserProfile } from '@/lib/user-profile';

/** Saate göre varsayılan öğün tipi. */
function defaultMealType() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast' as const;
  if (h < 16) return 'lunch' as const;
  if (h < 21) return 'dinner' as const;
  return 'snack' as const;
}

type Reason = { icon: keyof typeof Ionicons.glyphMap; label: string };

/** Tarifin neden önerildiğini kurallarla türetir (gerçek AI yok). */
function recipeReason(recipe: Recipe): Reason {
  if (recipe.protein >= 30) return { icon: 'barbell', label: 'Yüksek protein hedefin için' };
  if (recipe.suitableDiets.includes('vegan')) return { icon: 'leaf', label: 'Bitkisel & temiz' };
  if (!recipe.allergens.includes('gluten')) return { icon: 'leaf', label: 'Glutensiz' };
  if (recipe.kcal <= 300) return { icon: 'moon', label: 'Gece için hafif' };
  return { icon: 'sparkles', label: 'Senin için seçildi' };
}

export default function ChefScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const access = useAiAccess();

  // Önerileri kullanıcının diyet/alerji tercihlerine göre süz.
  const prefs = profile
    ? { diet: profile.diet, allergies: profile.allergies, dislikes: profile.dislikes }
    : null;
  const suggestions = filterRecipes(aiSuggestedRecipes, prefs);

  return (
    <Screen>
      {/* Başlık */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="sparkles" size={26} color={theme.primary} />
          <ThemedText type="subtitle" style={{ fontSize: 28, lineHeight: 34, color: theme.primary }}>
            AI Şef
          </ThemedText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          {/* AI kredi göstergesi */}
          <Pressable
            onPress={() => router.push('/get-credits' as Href)}
            style={[styles.creditChip, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name={access.isPremium ? 'star' : 'flash'} size={15} color={theme.primaryDark} />
            <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 13 }}>
              {access.isPremium ? 'Pro' : access.credits}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push('/coach' as Href)}
            style={[styles.avatar, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color={theme.primaryDark} />
          </Pressable>
        </View>
      </View>

      {/* AI Koç girişi */}
      <Pressable
        onPress={() => router.push('/coach' as Href)}
        style={[styles.coachRow, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="sparkles" size={18} color={theme.primaryDark} />
        <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 14, flex: 1 }}>
          AI Koç'a sor — beslenme & hedef sohbeti
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color={theme.primaryDark} />
      </Pressable>

      {/* Buzdolabını tara girişi */}
      <Pressable
        onPress={() => router.push('/fridge-scan' as Href)}
        style={[styles.coachRow, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="camera" size={18} color={theme.primaryDark} />
        <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 14, flex: 1 }}>
          Buzdolabını tara — malzemenle sağlıklı tarif
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color={theme.primaryDark} />
      </Pressable>

      {/* Haftalık plan girişi */}
      <Pressable
        onPress={() => router.push('/meal-plan' as Href)}
        style={[styles.coachRow, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="calendar" size={18} color={theme.primary} />
        <ThemedText type="smallBold" style={{ fontSize: 14, flex: 1 }}>
          Haftalık öğün planı oluştur
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>

      {/* AI tarif üretici */}
      <AiGenerator />

      {/* Bölüm başlığı */}
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle" style={{ fontSize: 22, lineHeight: 28 }}>
          Senin için özel seçimler
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 15 }}>
          Bugün hedeflerin için en iyisi bunlar.
        </ThemedText>
      </View>

      {/* Öneri kartları */}
      <View style={{ gap: Spacing.four }}>
        {suggestions.map((recipe, index) => (
          <AiPickCard key={recipe.id} recipe={recipe} index={index} />
        ))}
      </View>
    </Screen>
  );
}

/** Kullanıcının isteğine göre OpenRouter ile gerçek tarif üretir. */
function AiGenerator() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { addMeal } = useDailyLog();
  const access = useAiAccess();

  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [result, setResult] = useState<GeneratedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  const enabled = isAIEnabled();

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
    if (!input.trim() || status === 'loading') return;
    // Kredi kapısı: Pro değilse ve kredi yoksa kredi ekranına yönlendir.
    if (!access.consume()) {
      router.push('/get-credits' as Href);
      return;
    }
    setStatus('loading');
    setError(null);
    setResult(null);
    setAdded(false);
    setShared(false);
    try {
      const recipe = await generateRecipe(input.trim(), ctx);
      setResult(recipe);
    } catch (e: any) {
      setError(e?.message ?? 'Tarif üretilemedi.');
    } finally {
      setStatus('idle');
    }
  };

  const addToDay = () => {
    if (!result) return;
    addMeal({
      name: result.title,
      mealType: defaultMealType(),
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

  if (!enabled) {
    return (
      <View style={[styles.aiBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Ionicons name="sparkles" size={18} color={theme.textMuted} />
          <ThemedText type="smallBold" style={{ fontSize: 15 }}>
            AI tarif üretici
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
          AI özelliğini açmak için OpenRouter anahtarını .env dosyasına ekle.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.aiBox, { backgroundColor: theme.card, borderColor: theme.primary }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <Ionicons name="sparkles" size={18} color={theme.primary} />
        <ThemedText type="smallBold" style={{ fontSize: 16 }}>
          AI ile tarif üret
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
        Elindeki malzemeleri ya da isteğini yaz; sana özel bir tarif hazırlayayım.
      </ThemedText>

      <View style={[styles.aiInput, { backgroundColor: theme.backgroundElement }]}>
        <TextInput
          placeholder="örn. tavuk, brokoli ve pirinçle yüksek proteinli akşam yemeği"
          placeholderTextColor={theme.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          style={[styles.aiInputText, { color: theme.text }]}
        />
      </View>

      <Pressable
        onPress={generate}
        disabled={!input.trim() || status === 'loading'}
        style={[
          styles.aiBtn,
          { backgroundColor: input.trim() ? theme.primary : theme.backgroundSelected },
        ]}>
        {status === 'loading' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
              Tarif üret
            </ThemedText>
          </>
        )}
      </Pressable>

      {error && (
        <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
          {error}
        </ThemedText>
      )}

      {/* Üretilen tarif */}
      {result && (
        <View style={[styles.aiResult, { borderColor: theme.border }]}>
          <ThemedText type="subtitle" style={{ fontSize: 18 }}>
            {result.title}
          </ThemedText>
          <View style={styles.macroGrid}>
            {[
              { label: 'Kalori', value: `${result.kcal}` },
              { label: 'Prot', value: `${result.protein}g` },
              { label: 'Karb', value: `${result.carbs}g` },
              { label: 'Yağ', value: `${result.fat}g` },
            ].map((m) => (
              <View key={m.label} style={[styles.macroCell, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                  {m.label}
                </ThemedText>
                <ThemedText type="smallBold" style={{ fontSize: 14, color: theme.primary }}>
                  {m.value}
                </ThemedText>
              </View>
            ))}
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
              {result.steps.map((s, i) => (
                <ThemedText key={i} type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                  {i + 1}. {s}
                </ThemedText>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one }}>
            <Pressable
              onPress={addToDay}
              disabled={added}
              style={[styles.resultBtn, { backgroundColor: added ? theme.primaryDark : theme.primary, flex: 1 }]}>
              <Ionicons name={added ? 'checkmark' : 'add'} size={16} color="#fff" />
              <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
                {added ? 'Eklendi' : 'Güne ekle'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={share}
              disabled={shared || !user}
              style={[styles.resultBtn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth, flex: 1 }]}>
              <Ionicons name={shared ? 'checkmark' : 'share-social-outline'} size={16} color={theme.text} />
              <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                {shared ? 'Paylaşıldı' : 'Paylaş'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/** Tek bir AI öneri kartı — staggered giriş animasyonuyla. */
function AiPickCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const theme = useTheme();
  const router = useRouter();
  const reason = recipeReason(recipe);

  // "Playful" giriş: hafif büyüyerek belirir.
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: 120 + index * 160,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const macros = [
    { label: 'Kalori', value: `${recipe.kcal}` },
    { label: 'Prot', value: `${recipe.protein}g` },
    { label: 'Karb', value: `${recipe.carbs}g` },
    { label: 'Yağ', value: `${recipe.fat}g` },
  ];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        },
      ]}>
      {/* Reason etiketi */}
      <View style={styles.cardBody}>
        <View style={[styles.reasonTag, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name={reason.icon} size={14} color={theme.primaryDark} />
          <ThemedText type="smallBold" style={{ fontSize: 12, color: theme.primaryDark }}>
            {reason.label}
          </ThemedText>
        </View>
      </View>

      {/* Yemek görseli */}
      <View style={styles.imageWrap}>
        <RecipeImage uri={recipe.image} style={styles.image} iconSize={56} />
      </View>

      <View style={styles.cardBody}>
        <ThemedText type="subtitle" style={{ fontSize: 20, lineHeight: 26 }}>
          {recipe.title}
        </ThemedText>

        {/* Makro grid */}
        <View style={styles.macroGrid}>
          {macros.map((m) => (
            <View key={m.label} style={[styles.macroCell, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                {m.label}
              </ThemedText>
              <ThemedText type="smallBold" style={{ fontSize: 14, color: theme.primary }}>
                {m.value}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => router.push(`/recipe/${recipe.id}` as Href)}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
            Tarifi gör
          </ThemedText>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    // hafif "glow" hissi
    shadowColor: '#12B886',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardBody: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  reasonTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
    marginTop: Spacing.three,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    paddingHorizontal: Spacing.three,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  macroCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.pill,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  aiBox: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  aiInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 64,
  },
  aiInputText: {
    fontSize: 15,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    borderRadius: Radius.pill,
  },
  aiResult: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  resultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    height: 46,
    borderRadius: Radius.pill,
  },
});
