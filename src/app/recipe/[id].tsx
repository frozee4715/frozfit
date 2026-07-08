import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeImage } from '@/components/recipe-image';
import { ThemedText } from '@/components/themed-text';
import { Stars, StarInput } from '@/components/ui/stars';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { toggleLike, useCommunityRecipes } from '@/lib/community';
import { MEAL_TYPES, type MealType, useDailyLog } from '@/lib/daily-log';
import { promptBlock, promptReport } from '@/lib/moderation';
import { useRecipes } from '@/lib/recipes';
import { submitReview, useReviews } from '@/lib/reviews';
import { toggleFavorite, toggleFollow, useUserProfile } from '@/lib/user-profile';
import { useAccountGate } from '@/lib/account-gate';

/** Saate göre varsayılan öğün tipi. */
function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export default function RecipeDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes } = useRecipes();
  const { recipes: communityRecipes } = useCommunityRecipes();
  const { addMeal } = useDailyLog();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { requireAccount } = useAccountGate();

  // Hem standart hem topluluk tarifleri arasında ara.
  const recipe = recipes.find((r) => r.id === id) ?? communityRecipes.find((r) => r.id === id);
  const isFavorite = Boolean(id && profile?.favorites?.includes(id));
  const onToggleFavorite = () => {
    if (!requireAccount()) return;
    if (user && id) toggleFavorite(user.uid, id, !isFavorite).catch(() => {});
  };
  const [mealType, setMealType] = useState<MealType>(defaultMealType());
  const [portion, setPortion] = useState(1);
  const [added, setAdded] = useState(false);

  // Değerlendirmeler
  const { reviews, average, count } = useReviews(id);
  const blocked = profile?.blockedUsers ?? [];
  // Engellenen kullanıcıların yorumlarını gizle (kendi yorumun her zaman görünür).
  const visibleReviews = reviews.filter((r) => r.uid === user?.uid || !blocked.includes(r.uid));
  const myReview = reviews.find((r) => r.uid === user?.uid);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [sending, setSending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Kendi değerlendirmem yüklenince formu onunla doldur.
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setReviewText(myReview.text);
    }
  }, [myReview?.id]);

  const sendReview = async () => {
    if (!user || !id || rating < 1 || sending) return;
    setSending(true);
    setReviewError(null);
    try {
      await submitReview(id, user.uid, profile?.name || 'Bir FrozFit kullanıcısı', rating, reviewText);
    } catch {
      setReviewError('Değerlendirme gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  if (!recipe) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Tarif bulunamadı.
        </ThemedText>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            Geri dön
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  // Porsiyon çarpanına göre ölçeklenmiş değerler.
  const sc = (n: number) => Math.round(n * portion);
  const macros = [
    { label: 'Kalori', value: `${sc(recipe.kcal)}`, color: theme.calorie },
    { label: 'Protein', value: `${sc(recipe.protein)}g`, color: theme.protein },
    { label: 'Karb', value: `${sc(recipe.carbs)}g`, color: theme.carbs },
    { label: 'Yağ', value: `${sc(recipe.fat)}g`, color: theme.fat },
  ];

  const PORTIONS = [0.5, 1, 1.5, 2];

  const handleAdd = () => {
    if (!requireAccount()) return;
    addMeal({
      name: recipe.title,
      mealType,
      portion: `${portion} porsiyon`,
      kcal: sc(recipe.kcal),
      protein: sc(recipe.protein),
      carbs: sc(recipe.carbs),
      fat: sc(recipe.fat),
      recipeId: recipe.id,
    });
    setAdded(true);
    setTimeout(() => router.back(), 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}>
        {/* Görsel + geri butonu */}
        <View>
          <RecipeImage uri={recipe.image} style={styles.hero} iconSize={64} />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + Spacing.two, backgroundColor: theme.card }]}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          {user && (
            <Pressable
              onPress={onToggleFavorite}
              style={[styles.favBtn, { top: insets.top + Spacing.two, backgroundColor: theme.card }]}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? theme.accent : theme.text}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.body}>
          {/* Etiketler */}
          <View style={styles.tagRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: theme.primarySoft }]}>
                <ThemedText type="small" style={{ color: theme.primaryDark, fontSize: 12 }}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>

          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 32 }}>
            {recipe.title}
          </ThemedText>

          {count > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Stars rating={average} size={16} />
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                {average} · {count} değerlendirme
              </ThemedText>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {recipe.minutes} dk hazırlık
              </ThemedText>
            </View>
            <View style={styles.meta}>
              <Ionicons name="restaurant-outline" size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {recipe.category}
              </ThemedText>
            </View>
          </View>

          {recipe.authorName && (
            <View style={styles.meta}>
              <Ionicons name="person-circle-outline" size={16} color={theme.primary} />
              <ThemedText type="small" themeColor="textSecondary">
                {recipe.authorName} paylaştı
              </ThemedText>
            </View>
          )}

          {/* Topluluk: beğeni + takip */}
          {recipe.authorUid && user && (
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Pressable
                onPress={() => {
                  if (!requireAccount()) return;
                  toggleLike(recipe.id, user.uid, !(recipe.likedBy ?? []).includes(user.uid)).catch(() => {});
                }}
                style={[styles.socialBtn, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons
                  name={(recipe.likedBy ?? []).includes(user.uid) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={(recipe.likedBy ?? []).includes(user.uid) ? theme.accent : theme.text}
                />
                <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                  {(recipe.likedBy ?? []).length}
                </ThemedText>
              </Pressable>
              {recipe.authorUid !== user.uid && (
                <Pressable
                  onPress={() => {
                    if (!requireAccount()) return;
                    toggleFollow(user.uid, recipe.authorUid!, !(profile?.following ?? []).includes(recipe.authorUid!)).catch(() => {});
                  }}
                  style={[
                    styles.socialBtn,
                    (profile?.following ?? []).includes(recipe.authorUid)
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Ionicons
                    name={(profile?.following ?? []).includes(recipe.authorUid) ? 'checkmark' : 'person-add-outline'}
                    size={16}
                    color={(profile?.following ?? []).includes(recipe.authorUid) ? '#fff' : theme.text}
                  />
                  <ThemedText
                    type="smallBold"
                    style={{ fontSize: 13, color: (profile?.following ?? []).includes(recipe.authorUid) ? '#fff' : theme.text }}>
                    {(profile?.following ?? []).includes(recipe.authorUid) ? 'Takiptesin' : 'Takip et'}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {/* Moderasyon: bildir / engelle (topluluk tarifleri, başkasının içeriği) */}
          {recipe.authorUid && user && recipe.authorUid !== user.uid && (
            <View style={styles.moderationRow}>
              <Pressable
                onPress={() =>
                  promptReport({
                    targetType: 'recipe',
                    targetId: recipe.id,
                    targetUid: recipe.authorUid,
                    reporterUid: user.uid,
                  })
                }
                style={styles.moderationBtn}
                hitSlop={6}>
                <Ionicons name="flag-outline" size={15} color={theme.textMuted} />
                <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
                  Bildir
                </ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
                ·
              </ThemedText>
              <Pressable
                onPress={() =>
                  promptBlock({
                    uid: user.uid,
                    targetUid: recipe.authorUid!,
                    targetName: recipe.authorName,
                    onDone: () => router.back(),
                  })
                }
                style={styles.moderationBtn}
                hitSlop={6}>
                <Ionicons name="ban-outline" size={15} color={theme.textMuted} />
                <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
                  Kullanıcıyı engelle
                </ThemedText>
              </Pressable>
            </View>
          )}

          {/* Makro grid */}
          <View style={styles.macroGrid}>
            {macros.map((m) => (
              <View key={m.label} style={[styles.macroCell, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                  {m.label}
                </ThemedText>
                <ThemedText type="smallBold" style={{ fontSize: 16, color: m.color }}>
                  {m.value}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Malzemeler */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                Malzemeler
              </ThemedText>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                  <ThemedText type="small" style={{ flex: 1, fontSize: 14 }}>
                    {ing}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Yapılışı */}
          {recipe.steps && recipe.steps.length > 0 && (
            <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                Yapılışı
              </ThemedText>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: theme.primarySoft }]}>
                    <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 13 }}>
                      {i + 1}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
                    {step}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Porsiyon */}
          <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              Porsiyon
            </ThemedText>
            <View style={styles.mealTypeRow}>
              {PORTIONS.map((p) => {
                const selected = p === portion;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPortion(p)}
                    style={[
                      styles.mealTypeChip,
                      {
                        backgroundColor: selected ? theme.primary : theme.backgroundElement,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}>
                    <ThemedText type="small" style={{ fontSize: 13, color: selected ? '#fff' : theme.textSecondary }}>
                      {p}x
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Öğün seçimi */}
          <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              Hangi öğüne eklensin?
            </ThemedText>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((mt) => {
                const selected = mt.value === mealType;
                return (
                  <Pressable
                    key={mt.value}
                    onPress={() => setMealType(mt.value)}
                    style={[
                      styles.mealTypeChip,
                      {
                        backgroundColor: selected ? theme.primary : theme.backgroundElement,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}>
                    <ThemedText
                      type="small"
                      style={{ fontSize: 12, color: selected ? '#fff' : theme.textSecondary }}>
                      {mt.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, marginTop: Spacing.two }}>
            Bu tarifi günlük takibine eklediğinde kalorisi ve makroları otomatik sayılır.
          </ThemedText>

          {/* Değerlendirmeler */}
          <View style={[styles.reviewsSection, { borderTopColor: theme.border }]}>
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>
              Değerlendirmeler {count > 0 ? `(${count})` : ''}
            </ThemedText>

            {/* Kendi değerlendirme formun */}
            {user ? (
              <View style={[styles.reviewForm, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                  {myReview ? 'Değerlendirmeni güncelle' : 'Bu tarifi puanla'}
                </ThemedText>
                <StarInput value={rating} onChange={setRating} />
                <View style={[styles.reviewInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <TextInput
                    placeholder="Yorumun (isteğe bağlı)..."
                    placeholderTextColor={theme.textMuted}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                    style={[styles.reviewInputText, { color: theme.text }]}
                  />
                </View>
                {reviewError && (
                  <ThemedText type="small" style={{ color: theme.accent, fontSize: 12 }}>
                    {reviewError}
                  </ThemedText>
                )}
                <Pressable
                  onPress={sendReview}
                  disabled={rating < 1 || sending}
                  style={[styles.reviewBtn, { backgroundColor: rating >= 1 ? theme.primary : theme.backgroundSelected }]}>
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
                      {myReview ? 'Güncelle' : 'Gönder'}
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            ) : (
              <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
                Değerlendirme yapmak için giriş yapmalısın.
              </ThemedText>
            )}

            {/* Diğer değerlendirmeler */}
            {visibleReviews.filter((r) => r.uid !== user?.uid).length === 0 && !myReview ? (
              <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 13 }}>
                Henüz değerlendirme yok. İlk yorumu sen yap!
              </ThemedText>
            ) : (
              visibleReviews.map((r) => (
                <View key={r.id} style={[styles.reviewItem, { borderTopColor: theme.border }]}>
                  <View style={styles.reviewItemHead}>
                    <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                      {r.uid === user?.uid ? 'Sen' : r.authorName}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                      <Stars rating={r.rating} size={13} />
                      {user && r.uid !== user.uid && (
                        <Pressable
                          onPress={() =>
                            promptReport({
                              targetType: 'review',
                              targetId: r.id,
                              targetUid: r.uid,
                              reporterUid: user.uid,
                            })
                          }
                          hitSlop={8}>
                          <Ionicons name="flag-outline" size={14} color={theme.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                  {r.text.length > 0 && (
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14, lineHeight: 20 }}>
                      {r.text}
                    </ThemedText>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Alt sabit aksiyon */}
      <View
        style={[
          styles.footer,
          { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.three },
        ]}>
        <Pressable
          onPress={handleAdd}
          disabled={added}
          style={[styles.cta, { backgroundColor: added ? theme.primaryDark : theme.primary }]}>
          <Ionicons name={added ? 'checkmark' : 'add'} size={20} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
            {added ? 'Güne eklendi' : 'Güne ekle'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    width: '100%',
    height: 280,
    backgroundColor: '#DDE6E1',
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.three,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  favBtn: {
    position: 'absolute',
    right: Spacing.three,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  moderationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  moderationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  macroCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  reviewsSection: {
    marginTop: Spacing.four,
    paddingTop: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  reviewForm: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  reviewInput: {
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 56,
  },
  reviewInputText: {
    fontSize: 14,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  reviewBtn: {
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewItem: {
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  reviewItemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTypeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 54,
    borderRadius: Radius.pill,
  },
});
