import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { RecipeImage } from '@/components/recipe-image';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import type { Recipe } from '@/constants/mock-data';
import { useTheme } from '@/hooks/use-theme';

type RecipeCardProps = {
  recipe: Recipe;
  onPress?: () => void;
};

/** Tarif listesi için kart: görsel + başlık + kalori/süre/makro rozetleri. */
export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const theme = useTheme();

  return (
    <PressableScale onPress={onPress}>
      <Card padded={false} style={styles.card}>
        <RecipeImage uri={recipe.image} style={styles.image} />
        <View style={styles.body}>
          <View style={styles.tagRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: theme.primarySoft }]}>
                <ThemedText type="small" style={{ color: theme.primaryDark, fontSize: 12 }}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>

          <ThemedText type="smallBold" style={{ fontSize: 17 }} numberOfLines={2}>
            {recipe.title}
          </ThemedText>

          <View style={styles.metaRow}>
            <Meta icon="flame-outline" color={theme.calorie} text={`${recipe.kcal} kcal`} />
            <Meta icon="time-outline" color={theme.textSecondary} text={`${recipe.minutes} dk`} />
            <Meta icon="barbell-outline" color={theme.protein} text={`${recipe.protein}g protein`} />
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}

function Meta({ icon, color, text }: { icon: any; color: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={15} color={color} />
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: '#DDE6E1',
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
    marginTop: Spacing.one,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
