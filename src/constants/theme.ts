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

// ── Özel renk temaları (Premium) ────────────────────────────────────────
// Marka rengini değiştiren aksan paletleri. 'mint' varsayılandır ve ücretsizdir;
// diğerleri Premium aboneliğiyle açılır (bkz. settings ekranı).

export type AccentKey = 'mint' | 'ocean' | 'sunset' | 'berry';

type AccentOverride = Partial<
  Record<'primary' | 'primaryDark' | 'primarySoft' | 'tabActive', string>
>;

export const Accents: Record<
  AccentKey,
  { label: string; swatch: string; premium: boolean; light: AccentOverride; dark: AccentOverride }
> = {
  mint: {
    label: 'Mint',
    swatch: '#12B886',
    premium: false,
    light: {},
    dark: {},
  },
  ocean: {
    label: 'Okyanus',
    swatch: '#3B82F6',
    premium: true,
    light: { primary: '#3B82F6', primaryDark: '#2563EB', primarySoft: '#DBEAFE', tabActive: '#3B82F6' },
    dark: { primary: '#60A5FA', primaryDark: '#3B82F6', primarySoft: '#16283F', tabActive: '#60A5FA' },
  },
  sunset: {
    label: 'Gün batımı',
    swatch: '#F97316',
    premium: true,
    light: { primary: '#F97316', primaryDark: '#EA580C', primarySoft: '#FFEDD5', tabActive: '#F97316' },
    dark: { primary: '#FB923C', primaryDark: '#F97316', primarySoft: '#3A2313', tabActive: '#FB923C' },
  },
  berry: {
    label: 'Böğürtlen',
    swatch: '#A855F7',
    premium: true,
    light: { primary: '#A855F7', primaryDark: '#9333EA', primarySoft: '#F3E8FF', tabActive: '#A855F7' },
    dark: { primary: '#C084FC', primaryDark: '#A855F7', primarySoft: '#2C1B3D', tabActive: '#C084FC' },
  },
};

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
  // 999 DEĞİL: iOS'ta borderRadius, borderWidth ile birleşince RCTGetCornerInsets
  // (radius - borderWidth) hesabı devasa bir yarıçap üretiyor; RCTPathAddEllipticArc
  // bunu CGPathAddArc'a geçirince yol geometrisi bozuluyor ve Hermes heap'i
  // bozuluyordu (App Store 2.1a crash, iPad). 100 her UI elemanından büyük olduğu
  // için görsel sonuç yine tam yuvarlak ("pill") ama taşma üretmiyor.
  pill: 100,
} as const;

/**
 * Kenarlık kalınlığı. `StyleSheet.hairlineWidth` KULLANMA (kesirli ~0.33px):
 * borderRadius ile birleşince iOS'un köşe geometrisi (RCTPathAddEllipticArc →
 * CGPathAddArc) bozuk CGPath üretiyor ve Hermes heap'ini bozup uygulamayı
 * çökertiyor (native SIGSEGV, iPad, buton/ekran geçişinde). Tam sayı 1 bu alt-piksel
 * köşe-inset matematiğini tetiklemez. borderRadius'lu tüm dolu kenarlıklarda bunu kullan.
 */
export const Hairline = 1;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
