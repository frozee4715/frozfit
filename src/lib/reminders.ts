/**
 * Yerel bildirim hatırlatıcıları (su / öğün / tartım).
 * expo-notifications ile cihazda zamanlanır; sunucu/push gerekmez.
 * Tercihler AsyncStorage'da saklanır.
 *
 * Not: Expo Go'da yerel bildirimler kısıtlı olabilir; tam destek için
 * development build önerilir. Hata durumunda sessizce devre dışı kalır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = 'frozfit:reminders';

export type ReminderConfig = {
  water: boolean;
  meals: boolean;
  weighIn: boolean;
};

export const DEFAULT_REMINDERS: ReminderConfig = { water: false, meals: false, weighIn: false };

// Bildirim geldiğinde nasıl gösterileceği.
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }) as any,
});

export async function loadReminderConfig(): Promise<ReminderConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_REMINDERS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_REMINDERS;
}

export async function saveReminderConfig(config: ReminderConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config)).catch(() => {});
}

export async function ensurePermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function scheduleDaily(hour: number, minute: number, title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

/**
 * Mevcut tüm zamanlı bildirimleri temizler ve config'e göre yeniden kurar.
 * İzin yoksa ister; reddedilirse hiçbir şey kurulmaz.
 */
export async function applyReminders(config: ReminderConfig): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const anyOn = config.water || config.meals || config.weighIn;
    if (!anyOn) return true;

    const ok = await ensurePermission();
    if (!ok) return false;

    if (config.water) {
      for (const h of [10, 13, 16, 19]) {
        await scheduleDaily(h, 0, 'Su molası 💧', 'Bir bardak su içmeyi unutma!');
      }
    }
    if (config.meals) {
      await scheduleDaily(8, 30, 'Kahvaltı zamanı 🍳', 'Güne sağlıklı bir kahvaltıyla başla.');
      await scheduleDaily(13, 0, 'Öğle yemeği 🥗', 'Öğününü kaydetmeyi unutma.');
      await scheduleDaily(19, 30, 'Akşam yemeği 🍽️', 'Bugünkü öğünlerini tamamla.');
    }
    if (config.weighIn) {
      await scheduleDaily(8, 0, 'Tartım zamanı ⚖️', 'Sabah kilonu kaydet, ilerlemeni takip et.');
    }
    return true;
  } catch {
    return false;
  }
}
