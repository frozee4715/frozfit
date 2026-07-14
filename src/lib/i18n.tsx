/**
 * Basit çoklu dil (i18n) altyapısı.
 *
 * Dil, ayarlardan (`useSettings().language`) okunur — varsayılan Türkçe.
 * `useT()` bir `t(key, vars?)` fonksiyonu döndürür; anahtar bulunamazsa Türkçe'ye,
 * o da yoksa anahtarın kendisine düşer. `{name}` gibi yer tutucular `vars` ile doldurulur.
 *
 * Kademeli çeviri: yeni metinler buraya eklenir, ekranlar `t('...')` ile bunları kullanır.
 * Çevrilmemiş ekranlar Türkçe sabit metinleriyle çalışmaya devam eder (bozulmaz).
 */
import { useCallback } from 'react';

import { type Language, useSettings } from '@/lib/settings';

type Dict = Record<string, string>;

const tr: Dict = {
  // Sekmeler
  'tab.discover': 'Keşfet',
  'tab.tracker': 'Takip',
  'tab.chef': 'AI Şef',
  'tab.exercises': 'Egzersizler',
  'tab.profile': 'Profil',

  // Ortak
  'common.cancel': 'Vazgeç',
  'common.save': 'Kaydet',
  'common.add': 'Ekle',
  'common.back': 'Geri',
  'common.loading': 'Yükleniyor…',
  'common.premium': 'Premium',

  // Ayarlar
  'settings.title': 'Ayarlar',
  'settings.appearance': 'Görünüm',
  'settings.theme': 'Tema',
  'settings.theme.system': 'Sistem',
  'settings.theme.light': 'Açık',
  'settings.theme.dark': 'Koyu',
  'settings.units': 'Birimler',
  'settings.weightUnit': 'Kilo birimi',
  'settings.language': 'Dil',
  'settings.language.tr': 'Türkçe',
  'settings.language.en': 'İngilizce',

  // Profil menüsü
  'profile.goals': 'Hedeflerim',
  'profile.nutritionPrefs': 'Beslenme tercihleri',
  'profile.workout': 'Egzersiz',
  'profile.insights': 'Özet & analiz',
  'profile.achievements': 'Başarılar',
  'profile.challenges': 'Haftalık meydan okumalar',
  'profile.leaderboard': 'Liderlik tablosu',
  'profile.favorites': 'Kaydedilen tarifler',
  'profile.invite': 'Arkadaşını davet et',
  'profile.history': 'Takip geçmişi',
  'profile.settings': 'Ayarlar',
  'profile.notifications': 'Bildirimler',
  'profile.privacy': 'Gizlilik',
  'profile.blocked': 'Engellenen kullanıcılar',
  'profile.help': 'Yardım & Destek',
  'profile.editProfile': 'Profili düzenle',
  'profile.logout': 'Çıkış yap',
  'profile.deleteAccount': 'Hesabı sil',
  'profile.deleteAccount.title': 'Hesabını silmek istiyor musun?',
  'profile.deleteAccount.message':
    'Hesabın ve tüm verilerin (öğünler, antrenmanlar, kilo geçmişi, tarifler) kalıcı olarak silinir. Bu işlem geri alınamaz.\n\nAktif bir Pro aboneliğin varsa, hesabını silmek aboneliği iptal etmez; aboneliği mağaza ayarlarından ayrıca iptal etmelisin.',
  'profile.deleteAccount.confirm': 'Kalıcı olarak sil',
  'profile.deleteAccount.cancel': 'Vazgeç',
  'profile.deleteAccount.passwordTitle': 'Şifreni doğrula',
  'profile.deleteAccount.passwordMessage':
    'Güvenlik için hesabını silmeden önce şifreni gir.',
  'profile.deleteAccount.passwordPlaceholder': 'Şifren',
  'profile.deleteAccount.deleting': 'Hesabın siliniyor…',
  'profile.deleteAccount.errorTitle': 'Silinemedi',
  'profile.deleteAccount.errorWrongPassword': 'Şifre hatalı. Tekrar dene.',
  'profile.deleteAccount.errorRecent':
    'Güvenlik nedeniyle bu işlem için yeniden giriş yapman gerekiyor. Çıkış yapıp tekrar giriş yaptıktan sonra dene.',
  'profile.deleteAccount.errorGeneric':
    'Hesap silinirken bir sorun oluştu. Lütfen tekrar dene.',
  'profile.section.plan': 'Hedef & Plan',
  'profile.section.progress': 'İlerleme & Başarılar',
  'profile.section.recipes': 'Tarifler',
  'profile.section.invite': 'Davet',
  'profile.section.app': 'Uygulama',

  // Premium
  'premium.title': 'FrozFit Premium',
  'premium.subtitle': 'Günde 40 AI işlemi, özel plan ve daha fazlası',
  'premium.cta': 'Premium’a geç',
  'premium.active': 'FrozFit Premium aktif 🎉',
};

const en: Dict = {
  // Tabs
  'tab.discover': 'Discover',
  'tab.tracker': 'Track',
  'tab.chef': 'AI Chef',
  'tab.exercises': 'Workouts',
  'tab.profile': 'Profile',

  // Common
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.add': 'Add',
  'common.back': 'Back',
  'common.loading': 'Loading…',
  'common.premium': 'Premium',

  // Settings
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.theme.system': 'System',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.units': 'Units',
  'settings.weightUnit': 'Weight unit',
  'settings.language': 'Language',
  'settings.language.tr': 'Turkish',
  'settings.language.en': 'English',

  // Profile menu
  'profile.goals': 'My goals',
  'profile.nutritionPrefs': 'Nutrition preferences',
  'profile.workout': 'Exercise',
  'profile.insights': 'Summary & analytics',
  'profile.achievements': 'Achievements',
  'profile.challenges': 'Weekly challenges',
  'profile.leaderboard': 'Leaderboard',
  'profile.favorites': 'Saved recipes',
  'profile.invite': 'Invite a friend',
  'profile.history': 'Tracking history',
  'profile.settings': 'Settings',
  'profile.notifications': 'Notifications',
  'profile.privacy': 'Privacy',
  'profile.blocked': 'Blocked users',
  'profile.help': 'Help & Support',
  'profile.editProfile': 'Edit profile',
  'profile.logout': 'Log out',
  'profile.deleteAccount': 'Delete account',
  'profile.deleteAccount.title': 'Delete your account?',
  'profile.deleteAccount.message':
    'Your account and all your data (meals, workouts, weight history, recipes) will be permanently deleted. This cannot be undone.\n\nIf you have an active Pro subscription, deleting your account does not cancel it — cancel separately in your store settings.',
  'profile.deleteAccount.confirm': 'Delete permanently',
  'profile.deleteAccount.cancel': 'Cancel',
  'profile.deleteAccount.passwordTitle': 'Confirm your password',
  'profile.deleteAccount.passwordMessage':
    'For your security, enter your password before deleting your account.',
  'profile.deleteAccount.passwordPlaceholder': 'Your password',
  'profile.deleteAccount.deleting': 'Deleting your account…',
  'profile.deleteAccount.errorTitle': "Couldn't delete",
  'profile.deleteAccount.errorWrongPassword': 'Incorrect password. Please try again.',
  'profile.deleteAccount.errorRecent':
    'For security, you need to sign in again before doing this. Log out, sign back in, and retry.',
  'profile.deleteAccount.errorGeneric':
    'Something went wrong while deleting your account. Please try again.',
  'profile.section.plan': 'Goal & Plan',
  'profile.section.progress': 'Progress & Achievements',
  'profile.section.recipes': 'Recipes',
  'profile.section.invite': 'Invite',
  'profile.section.app': 'App',

  // Premium
  'premium.title': 'FrozFit Premium',
  'premium.subtitle': '40 AI actions per day, custom plans and more',
  'premium.cta': 'Go Premium',
  'premium.active': 'FrozFit Premium active 🎉',
};

const DICTS: Record<Language, Dict> = { tr, en };

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Geçerli dile göre çeviri fonksiyonu döndürür. */
export function useT(): TFunction {
  const { language } = useSettings();
  return useCallback(
    (key, vars) => {
      const value = DICTS[language]?.[key] ?? tr[key] ?? key;
      return interpolate(value, vars);
    },
    [language],
  );
}
