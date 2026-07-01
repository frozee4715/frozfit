import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeCard } from '@/components/recipe-card';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRecipes } from '@/lib/recipes';
import { useUserProfile } from '@/lib/user-profile';

export default function FavoritesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes } = useRecipes();
  const { profile } = useUserProfile();

  const favIds = profile?.favorites ?? [];
  const favorites = recipes.filter((r) => favIds.includes(r.id));

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
          Kaydedilen tarifler
        </ThemedText>
        <Pressable onPress={() => router.push('/shopping-list' as Href)} hitSlop={8}>
          <Ionicons name="cart-outline" size={24} color={theme.primary} />
        </Pressable>
      </View>

      <Screen>
        {favorites.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: Spacing.six, gap: Spacing.three }}>
            <Ionicons name="heart-outline" size={48} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Henüz tarif kaydetmedin. Bir tarifin detayında kalbe dokunarak buraya ekleyebilirsin.
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: Spacing.four }}>
            {favorites.map((r) => (
              <RecipeCard key={r.id} recipe={r} onPress={() => router.push(`/recipe/${r.id}` as Href)} />
            ))}
          </View>
        )}
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
});
