import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRecipes } from '@/lib/recipes';
import { useUserProfile } from '@/lib/user-profile';

export default function ShoppingListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes } = useRecipes();
  const { profile } = useUserProfile();

  const favIds = profile?.favorites ?? [];
  const favorites = recipes.filter((r) => favIds.includes(r.id));

  // Favori tariflerin malzemelerini tekilleştirerek topla.
  const items = useMemo(() => {
    const set = new Set<string>();
    favorites.forEach((r) => (r.ingredients ?? []).forEach((ing) => set.add(ing.trim())));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [favorites]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (item: string) => setChecked((prev) => ({ ...prev, [item]: !prev[item] }));

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
          Alışveriş listesi
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
          Kaydettiğin tariflerin malzemeleri burada toplanır.
        </ThemedText>

        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: Spacing.five, gap: Spacing.three }}>
            <Ionicons name="cart-outline" size={44} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Liste boş. Tarif detaylarından kalbe dokunup favorilere ekledikçe malzemeler burada birikecek.
            </ThemedText>
          </View>
        ) : (
          items.map((item) => {
            const on = checked[item];
            return (
              <Pressable
                key={item}
                onPress={() => toggle(item)}
                style={[styles.row, { borderBottomColor: theme.border }]}>
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={on ? theme.primary : theme.textMuted}
                />
                <ThemedText
                  type="small"
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: on ? theme.textMuted : theme.text,
                    textDecorationLine: on ? 'line-through' : 'none',
                  }}>
                  {item}
                </ThemedText>
              </Pressable>
            );
          })
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
