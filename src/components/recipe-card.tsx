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
        <View>
          <RecipeImage uri={recipe.image} style={styles.image} />
          {/* Görsel üstü rozetler: fotoğrafa bakan göz kaloriyi anında görür. */}
          <View style={styles.imageBadges}>
            <View style={styles.imagePill}>
              <Ionicons name="flame" size={12} color="#FFB199" />
              <ThemedText type="small" style={{ color: '#fff', fontSize: 12 }}>
                {recipe.kcal} kcal
              </ThemedText>
            </View>
            <View style={styles.imagePill}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <ThemedText type="small" style={{ color: '#fff', fontSize: 12 }}>
                {recipe.minutes} dk
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.tagRow}>
            {recipe.tags.slice(0, 2).map((tag) => (
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
            <Meta icon="barbell-outline" color={theme.protein} text={`${recipe.protein}g protein`} />
            <Meta icon="leaf-outline" color={theme.primary} text={recipe.category} />
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
  imageBadges: {
    position: 'absolute',
    bottom: Spacing.two,
    left: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.one + 2,
  },
  imagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
