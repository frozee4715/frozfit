import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Kalori ve makro hedeflerim nasıl hesaplanıyor?',
    a: 'Mifflin-St Jeor formülü + aktivite seviyen + hedefine göre hesaplanır. Profilini düzenlediğinde plan otomatik güncellenir.',
  },
  {
    q: 'Öğün nasıl eklerim?',
    a: 'Takip ekranında bir öğünün yanındaki + butonuna bas ya da bir tarifin detayından "Güne ekle" de.',
  },
  {
    q: 'AI özellikleri nasıl çalışıyor?',
    a: 'AI Şef’te malzeme/istek yazarak tarif üretebilir, AI Koç ile sohbet edebilirsin. Yanıtlar profiline (diyet, alerji, kalori) göre kişiselleşir.',
  },
  {
    q: 'Misafir hesabımdaki veriler kaybolur mu?',
    a: 'Misafir denemesi 7 gündür. Verilerini kalıcı tutmak için Profil’den ücretsiz hesaba yükselt.',
  },
];

export default function HelpScreen() {
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
          Yardım & Destek
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <ThemedText type="subtitle" style={{ fontSize: 20 }}>
          Sıkça sorulanlar
        </ThemedText>
        {FAQ.map((f) => (
          <Card key={f.q} style={{ gap: Spacing.one }}>
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              {f.q}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14, lineHeight: 21 }}>
              {f.a}
            </ThemedText>
          </Card>
        ))}

        <Pressable
          onPress={() => Linking.openURL('mailto:destek@frozfit.app')}
          style={[styles.contactBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="mail-outline" size={18} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 15 }}>
            Bize yaz: destek@frozfit.app
          </ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
          FrozFit · v0.1.0
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
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.pill,
  },
});
