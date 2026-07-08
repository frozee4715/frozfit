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
    body: 'Yalnızca uygulamanın çalışması için gerekli olanları: e-posta adresin, profil bilgilerin (yaş, boy, kilo, hedefler), beslenme ve tartım kayıtların ile paylaştığın tarifler. Bu bilgiler yalnızca senin hesabına bağlı tutulur.',
  },
  {
    title: 'Verilerin nasıl korunuyor?',
    body: 'Verilerin şifreli bağlantı üzerinden iletilir ve güvenli bulut altyapısında hesabına bağlı olarak saklanır. Bu bilgilere yalnızca sen erişebilirsin. Yalnızca senin herkese açık olarak paylaşmayı seçtiğin tarifler diğer kullanıcılarca görülebilir.',
  },
  {
    title: 'Yapay zeka özellikleri',
    body: 'Tarif, koç ve fotoğraf analizi gibi yapay zeka özelliklerini kullandığında; isteğin güvenli bir bağlantı üzerinden işlenip sana yanıt üretilir. Bu içerikler reklam veya pazarlama amacıyla kullanılmaz, üçüncü kişilerle paylaşılmaz.',
  },
  {
    title: 'Verilerini yönetme ve silme',
    body: 'Verilerin sana aittir. Hesabını ve tüm verilerini istediğin zaman uygulama içinden veya Yardım & Destek üzerinden bize ulaşarak kalıcı olarak sildirebilirsin.',
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
