import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useCommunityRecipes } from '@/lib/community';
import { toggleBlock, useUserProfile } from '@/lib/user-profile';

export default function BlockedUsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { recipes } = useCommunityRecipes();

  const blocked = profile?.blockedUsers ?? [];

  // Engellenen uid için topluluk tariflerinden bir isim çözmeye çalış.
  const nameFor = (uid: string): string => {
    const r = recipes.find((rec) => rec.authorUid === uid && rec.authorName);
    return r?.authorName ?? 'FrozFit kullanıcısı';
  };

  const unblock = (uid: string) => {
    if (user) toggleBlock(user.uid, uid, false).catch(() => {});
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
          Engellenen kullanıcılar
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
          Engellediğin kullanıcıların tarifleri ve yorumları sana gösterilmez. İstediğin
          zaman engeli kaldırabilirsin.
        </ThemedText>

        {blocked.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: Spacing.five, gap: Spacing.three }}>
            <Ionicons name="checkmark-circle-outline" size={44} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Engellediğin kimse yok.
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: Spacing.two }}>
            {blocked.map((uid) => (
              <View key={uid} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 }}>
                  <Ionicons name="person-circle-outline" size={28} color={theme.textSecondary} />
                  <ThemedText type="smallBold" style={{ fontSize: 15, flex: 1 }} numberOfLines={1}>
                    {nameFor(uid)}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => unblock(uid)}
                  style={[styles.unblockBtn, { backgroundColor: theme.backgroundElement }]}
                  hitSlop={6}>
                  <ThemedText type="smallBold" style={{ fontSize: 13, color: theme.primary }}>
                    Engeli kaldır
                  </ThemedText>
                </Pressable>
              </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  unblockBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
});
