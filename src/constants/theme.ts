/**
 * FrozFit tema sistemi.
 * Tüm renkler hem açık (light) hem koyu (dark) mod için tanımlıdır.
 * Marka: taze/sağlıklı hissi veren mint-yeşil + sıcak vurgu renkleri.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Yüzeyler
    background: '#F4F8F6', // ekran arka planı (yumuşak kırık beyaz-mint)
    card: '#FFFFFF', // kart yüzeyi
    backgroundElement: '#EAF1EE', // input / chip arka planı
    backgroundSelected: '#D8E6E0', // seçili eleman
    border: '#E3ECE7',

    // Metin
    text: '#0F1B15',
    textSecondary: '#5C6B63',
    textMuted: '#8A988F',

    // Marka & vurgu
    primary: '#12B886', // ana mint-yeşil
    primaryDark: '#0E9E73',
    primarySoft: '#E2F7EF', // açık mint zemin (primary üstüne metin)
    accent: '#FF7A59', // sıcak mercan vurgusu

    // Makro / kalori renkleri
    calorie: '#FF7A59',
    protein: '#4C8DFF',
    carbs: '#F5A623',
    fat: '#FF6B9D',

    // Sekme çubuğu
    tabActive: '#12B886',
    tabInactive: '#9AA8A0',
  },
  dark: {
    background: '#0E1512',
    card: '#17211C',
    backgroundElement: '#1E2A24',
    backgroundSelected: '#2A3831',
    border: '#24332C',

    text: '#F1F5F3',
    textSecondary: '#9DB0A6',
    textMuted: '#6E7F76',

    primary: '#2DD4A7',
    primaryDark: '#1FB890',
    primarySoft: '#15332A',
    accent: '#FF8A6A',

    calorie: '#FF8A6A',
    protein: '#6BA3FF',
    carbs: '#FBBF24',
    fat: '#FF89B0',

    tabActive: '#2DD4A7',
    tabInactive: '#6B7C73',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Köşe yuvarlaklığı ölçeği — modern, yumuşak kartlar için. */
export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
