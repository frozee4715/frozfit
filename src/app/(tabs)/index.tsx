import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { RecipeCard } from '@/components/recipe-card';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { categories, userProfile } from '@/constants/mock-data';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { goalLabel } from '@/lib/plan';
import { filterRecipes } from '@/lib/recipe-filter';
import { useRecipes } from '@/lib/recipes';
import { useUserProfile } from '@/lib/user-profile';

export default function DiscoverScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { recipes } = useRecipes();
  const { profile } = useUserProfile();

  const openRecipe = (recipeId: string) => router.push(`/recipe/${recipeId}` as Href);
  const [activeCategory, setActiveCategory] = useState<string>('Tümü');
  const [query, setQuery] = useState('');

  // Gerçek profil yoksa (Firebase kapalıyken) mock'a düş.
  const displayName = profile?.name || userProfile.name;

  // Diyet/alerji/sevmediği tercihlerine uymayan tarifleri ele.
  const prefs = profile
    ? { diet: profile.diet, allergies: profile.allergies, dislikes: profile.dislikes }
    : null;
  const allowed = useMemo(() => filterRecipes(recipes, prefs), [recipes, prefs]);
  const hiddenCount = recipes.length - allowed.length;

  // Günün önerisi: uygun listedeki ikinci tarif (yoksa ilki).
  const featuredRecipe = allowed[1] ?? allowed[0];

  const filtered = useMemo(() => {
    return allowed.filter((r) => {
      const matchCategory =
        activeCategory === 'Tümü' ||
        r.category === activeCategory ||
        r.tags.includes(activeCategory);
      const matchQuery = r.title.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [allowed, activeCategory, query]);

  return (
    <Screen>
      {/* Selamlama */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Merhaba 👋
          </ThemedText>
          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 32 }}>
            {displayName}
          </ThemedText>
        </View>
        {profile && (
          <View style={[styles.streak, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="flag" size={15} color={theme.primaryDark} />
            <ThemedText type="smallBold" style={{ color: theme.primaryDark }}>
              {goalLabel(profile.goal)}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Arama */}
      <View style={[styles.search, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          placeholder="Tarif ara..."
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      {/* Kategoriler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ marginHorizontal: -Spacing.three }}>
        {categories.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={activeCategory === c}
            onPress={() => setActiveCategory(c)}
          />
        ))}
      </ScrollView>

      {/* Topluluk girişi */}
      <PressableScale onPress={() => router.push('/community' as Href)}>
        <Card style={styles.communityBanner}>
          <View style={[styles.communityIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="people" size={22} color={theme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              Topluluk tarifleri
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
              Kullanıcıların tariflerini keşfet, kendi tarifini paylaş
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </Card>
      </PressableScale>

      {/* Günün önerisi */}
      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" style={{ fontSize: 18 }}>
          ⭐ Günün önerisi
        </ThemedText>
      </View>
      {featuredRecipe && (
        <PressableScale onPress={() => openRecipe(featuredRecipe.id)}>
          <Card padded={false} style={styles.featured}>
            <Image
              source={{ uri: featuredRecipe.image }}
              style={styles.featuredImage}
              contentFit="cover"
              transition={250}
            />
            <View style={styles.featuredOverlay}>
              <View style={[styles.featuredBadge, { backgroundColor: theme.accent }]}>
                <ThemedText type="small" style={{ color: '#fff', fontSize: 12 }}>
                  {featuredRecipe.kcal} kcal · {featuredRecipe.minutes} dk
                </ThemedText>
              </View>
              <ThemedText style={styles.featuredTitle}>{featuredRecipe.title}</ThemedText>
            </View>
          </Card>
        </PressableScale>
      )}

      {/* Tarif akışı */}
      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" style={{ fontSize: 18 }}>
          Sağlıklı tarifler
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {filtered.length} tarif
        </ThemedText>
      </View>

      {hiddenCount > 0 && (
        <View style={[styles.hiddenNote, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="shield-checkmark-outline" size={15} color={theme.primaryDark} />
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, flex: 1 }}>
            Diyet ve alerji tercihlerine göre {hiddenCount} tarif gizlendi.
          </ThemedText>
        </View>
      )}

      {filtered.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Bu filtreye uygun tarif bulunamadı.
        </ThemedText>
      ) : (
        <View style={{ gap: Spacing.four }}>
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onPress={() => openRecipe(r.id)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 48,
    borderRadius: Radius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  chipRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hiddenNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  communityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  communityIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featured: {
    overflow: 'hidden',
    height: 200,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DDE6E1',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
});
