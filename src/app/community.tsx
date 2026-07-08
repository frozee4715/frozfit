import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeCard } from '@/components/recipe-card';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCommunityRecipes } from '@/lib/community';
import { useUserProfile } from '@/lib/user-profile';

type Filter = 'all' | 'following';

export default function CommunityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes, loading } = useCommunityRecipes();
  const { profile } = useUserProfile();
  const [filter, setFilter] = useState<Filter>('all');

  const following = profile?.following ?? [];
  const blocked = profile?.blockedUsers ?? [];
  // Engellenen kullanıcıların tarifleri hiçbir sekmede gösterilmez.
  const notBlocked = recipes.filter((r) => !r.authorUid || !blocked.includes(r.authorUid));
  const visible =
    filter === 'following'
      ? notBlocked.filter((r) => r.authorUid && following.includes(r.authorUid))
      : notBlocked;

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
          Topluluk
        </ThemedText>
        <Pressable onPress={() => router.push('/share-recipe' as Href)} hitSlop={8}>
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        </Pressable>
      </View>

      <Screen>
        <View style={{ gap: Spacing.one }}>
          <ThemedText type="subtitle" style={{ fontSize: 22 }}>
            Topluluk tarifleri
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
            FrozFit kullanıcılarının paylaştığı tarifler. Sen de kendi tarifini paylaş!
          </ThemedText>
        </View>

        <Pressable
          onPress={() => router.push('/share-recipe' as Href)}
          style={[styles.shareBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={20} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
            Tarif paylaş
          </ThemedText>
        </Pressable>

        {/* Tümü / Takip ettiklerin filtresi */}
        <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
          {(['all', 'following'] as Filter[]).map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.segmentItem, active && { backgroundColor: theme.card }]}>
                <ThemedText
                  type="smallBold"
                  style={{ fontSize: 14, color: active ? theme.text : theme.textSecondary }}>
                  {f === 'all' ? 'Tümü' : 'Takip ettiklerin'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {!loading && visible.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: Spacing.five, gap: Spacing.three }}>
            <Ionicons name="people-outline" size={44} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              {filter === 'following'
                ? 'Takip ettiğin kişilerden henüz tarif yok. Bir tarifin detayından yazarını takip edebilirsin.'
                : 'Henüz paylaşılan tarif yok. İlk paylaşan sen ol!'}
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: Spacing.four }}>
            {visible.map((r) => (
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
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.pill,
  },
  segment: {
    flexDirection: 'row',
    padding: Spacing.half,
    borderRadius: Radius.pill,
    gap: Spacing.half,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
});
