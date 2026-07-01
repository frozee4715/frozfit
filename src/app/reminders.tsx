import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  DEFAULT_REMINDERS,
  type ReminderConfig,
  applyReminders,
  loadReminderConfig,
  saveReminderConfig,
} from '@/lib/reminders';

const ROWS: { key: keyof ReminderConfig; icon: any; title: string; desc: string }[] = [
  { key: 'water', icon: 'water-outline', title: 'Su hatırlatıcısı', desc: 'Gün içinde 10:00–19:00 arası 4 hatırlatma' },
  { key: 'meals', icon: 'restaurant-outline', title: 'Öğün hatırlatıcıları', desc: 'Kahvaltı, öğle ve akşam için' },
  { key: 'weighIn', icon: 'scale-outline', title: 'Tartım hatırlatıcısı', desc: 'Her sabah 08:00’de kilonu kaydet' },
];

export default function RemindersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [config, setConfig] = useState<ReminderConfig>(DEFAULT_REMINDERS);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    loadReminderConfig().then(setConfig);
  }, []);

  const toggle = async (key: keyof ReminderConfig) => {
    const next = { ...config, [key]: !config[key] };
    setConfig(next);
    await saveReminderConfig(next);
    const ok = await applyReminders(next);
    setDenied(!ok && (next.water || next.meals || next.weighIn));
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
          Bildirimler
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
          Hatırlatıcıları aç; uygulama belirli saatlerde sana bildirim göndersin.
        </ThemedText>

        {denied && (
          <View style={[styles.warn, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.primaryDark} />
            <ThemedText type="small" style={{ flex: 1, color: theme.primaryDark, fontSize: 13 }}>
              Bildirim izni verilmedi. Cihaz ayarlarından FrozFit bildirimlerine izin ver.
            </ThemedText>
          </View>
        )}

        {ROWS.map((r) => (
          <Card key={r.key} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name={r.icon} size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                {r.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                {r.desc}
              </ThemedText>
            </View>
            <Switch
              value={config[r.key]}
              onValueChange={() => toggle(r.key)}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </Card>
        ))}

        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
          Not: Expo Go’da bildirimler kısıtlı olabilir; tam destek için derlenmiş uygulama gerekir.
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
});
