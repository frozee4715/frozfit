import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Hangi verileri topluyoruz?',
    body: 'E-posta adresin, profil bilgilerin (yaş, boy, kilo, hedefler), beslenme kayıtların, kilo tartımların ve paylaştığın tarifler hesabına bağlı olarak saklanır.',
  },
  {
    title: 'Verilerin nerede tutuluyor?',
    body: 'Verilerin Google Firebase (Firestore) üzerinde, hesabına bağlı olarak güvenli şekilde saklanır. Sadece sen erişebilirsin; topluluk tarifleri ise herkese açıktır.',
  },
  {
    title: 'AI özellikleri',
    body: 'AI tarif/koç ve fotoğraf analizi özelliklerini kullandığında yazdığın istek, ilgili görsel ve profil bağlamın (diyet, alerji, kalori hedefi) yanıt üretmek için güvenli bir proxy sunucusu (Cloudflare Workers) aracılığıyla AI sağlayıcılarına (Google Gemini ve OpenRouter) iletilir.',
  },
  {
    title: 'Verilerini silme',
    body: 'Hesabını ve verilerini silmek istersen Yardım & Destek üzerinden bize ulaşabilirsin.',
  },
];

export default function PrivacyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          Gizlilik
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        {SECTIONS.map((s) => (
          <View key={s.title} style={{ gap: Spacing.one }}>
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>
              {s.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14, lineHeight: 21 }}>
              {s.body}
            </ThemedText>
          </View>
        ))}
        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
          FrozFit · Gizlilik bildirimi · v1.0.0
        </ThemedText>
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
