/**
 * Firebase başlatma noktası (JS SDK).
 *
 * Yapılandırma `.env` dosyasındaki EXPO_PUBLIC_FIREBASE_* değişkenlerinden okunur.
 * Expo, `EXPO_PUBLIC_` ön ekli değişkenleri otomatik olarak `process.env` üzerinden
 * derleme sırasında gömer (ayrı bir plugin gerekmez).
 *
 * Not: Firebase web apiKey'i gizli bir anahtar DEĞİLDİR; istemciye gömülmesi normaldir.
 * Güvenlik, Firestore/Storage güvenlik kuralları ile sağlanır.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // getReactNativePersistence yalnızca firebase'in React Native derlemesinde bulunur;
  // web tip tanımlarında olmadığı için TS hatasını burada bastırıyoruz.
  // @ts-expect-error - present in the React Native build, absent from web type defs
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Zorunlu alanlar dolu mu? Değilse uygulama yine açılır ama Firebase devre dışı
 * kalır (ekranlar mock veriye düşer). Böylece Console kurulumu bitmeden de çalışır.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);

  // Web'de getAuth varsayılan kalıcılığı kullanır; native'de AsyncStorage ile
  // oturumu cihazda saklarız. Fast Refresh'te tekrar initialize hatası olmaması
  // için try/catch ile getAuth'a düşüyoruz.
  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
  } else {
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(app);
    }
  }

  dbInstance = getFirestore(app);
  // AI proxy artık Cloudflare Worker üzerinde (bkz. src/lib/ai.ts + cloudflare-worker/).
} else if (__DEV__) {
  console.warn(
    '[firebase] Yapılandırma eksik. .env dosyasına EXPO_PUBLIC_FIREBASE_* değerlerini ekleyin. ' +
      'Şimdilik mock veriler kullanılacak.',
  );
}

export const auth = authInstance;
export const db = dbInstance;
export { app };
