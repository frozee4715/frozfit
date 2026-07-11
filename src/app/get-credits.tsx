import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAiAccess } from '@/lib/ai-credits';

export default function GetCreditsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { credits, isPremium } = useAiAccess();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <View style={{ alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.two }}>
          <View style={[styles.coin, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="sparkles" size={34} color={theme.primaryDark} />
          </View>
          <ThemedText type="subtitle" style={{ fontSize: 24, textAlign: 'center' }}>
            AI kredilerin
          </ThemedText>
          <View style={[styles.creditPill, { backgroundColor: theme.primary }]}>
            <Ionicons name="flash" size={18} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 18 }}>
              {isPremium ? 'Günde 40 işlem' : `${credits} kredi`}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14, textAlign: 'center' }}>
            Her AI işlemi 1 kredi harcar (tarif üret, buzdolabı tara, koç, fotoğraf analizi).
          </ThemedText>
        </View>

        {isPremium ? (
          <Card style={[styles.activeCard, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="star" size={22} color={theme.primaryDark} />
            <ThemedText type="smallBold" style={{ fontSize: 15, color: theme.primaryDark, flex: 1 }}>
              Premium&apos;sun — krediye ihtiyacın yok, günde 40 AI işlemi hakkın var 🎉
            </ThemedText>
          </Card>
        ) : (
          <>
            <Card style={{ gap: Spacing.two }}>
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                Kredin bitince ne olur?
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                Kredi biriktirmek yerine Premium&apos;a geçebilirsin: günde 40 AI işlemiyle
                kredi derdi olmadan tarif üret, koça sor, fotoğraf ve buzdolabı tara.
              </ThemedText>
            </Card>

            {/* Pro teşviki */}
            <Pressable onPress={() => router.push('/premium' as Href)}>
              <Card style={[styles.proCard, { backgroundColor: theme.primary }]}>
                <View style={[styles.icon, { backgroundColor: '#fff3' }]}>
                  <Ionicons name="star" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ fontSize: 16, color: '#fff' }}>
                    Günde 40 AI işlemi → Premium
                  </ThemedText>
                  <ThemedText type="small" style={{ fontSize: 12, color: '#fff', opacity: 0.9 }}>
                    Krediyle uğraşma; tüm AI özellikleri her gün açık.
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Card>
            </Pressable>
          </>
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
  },
  coin: {
    width: 76,
    height: 76,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
