/**
 * Uygulama ayarları — cihazda (AsyncStorage) saklanır, hesaptan bağımsızdır.
 * Tema modu (açık/koyu/sistem) ve kilo birimi (kg/lb).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { AccentKey } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type WeightUnit = 'kg' | 'lb';
export type Language = 'tr' | 'en';

type Settings = {
  themeMode: ThemeMode;
  weightUnit: WeightUnit;
  language: Language;
  /** Özel renk teması (Premium; 'mint' ücretsiz varsayılan). */
  accent: AccentKey;
};
const DEFAULTS: Settings = { themeMode: 'system', weightUnit: 'kg', language: 'tr', accent: 'mint' };
const STORAGE_KEY = 'frozfit:settings';

type SettingsContextValue = Settings & {
  ready: boolean;
  setThemeMode: (m: ThemeMode) => void;
  setWeightUnit: (u: WeightUnit) => void;
  setLanguage: (l: Language) => void;
  setAccent: (a: AccentKey) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  ...DEFAULTS,
  ready: false,
  setThemeMode: () => {},
  setWeightUnit: () => {},
  setLanguage: () => {},
  setAccent: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
          } catch {}
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persist = (next: Settings) => {
    setSettings(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const value: SettingsContextValue = {
    ...settings,
    ready,
    setThemeMode: (themeMode) => persist({ ...settings, themeMode }),
    setWeightUnit: (weightUnit) => persist({ ...settings, weightUnit }),
    setLanguage: (language) => persist({ ...settings, language }),
    setAccent: (accent) => persist({ ...settings, accent }),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

/** Tema moduna ve sistem temasına göre çözülmüş şema ('light' | 'dark'). */
export function useResolvedScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const { themeMode } = useSettings();
  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

// --- Kilo birimi yardımcıları ---
const KG_TO_LB = 2.20462;

export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? Math.round(kg * KG_TO_LB * 10) / 10 : kg;
}

export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? Math.round((value / KG_TO_LB) * 10) / 10 : value;
}

export function weightLabel(unit: WeightUnit): string {
  return unit === 'lb' ? 'lb' : 'kg';
}
