/**
 * Apple / Google ile giriş — native modüller güvenli (guarded) yüklenir.
 *
 * - Apple: expo-apple-authentication (yalnızca iOS, production/dev build).
 *   Firebase Console → Authentication → Sign-in method → Apple ETKİN olmalı.
 * - Google: @react-native-google-signin/google-signin (native modül).
 *   Firebase Console → Authentication → Google ETKİN olmalı ve
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID .env'de tanımlı olmalı.
 *
 * Modül veya yapılandırma yoksa ilgili "isAvailable" false döner ve
 * arayüz o butonu hiç göstermez — uygulama çökmez.
 */
import { Platform } from 'react-native';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
// iOS'ta Google girişi AYRI bir iOS OAuth client'ı ister (web client'ı DEĞİL).
// Verilmezse kütüphane Info.plist'teki URL şemasından okur; ama ideal olan bunu
// açıkça vermek. Google Cloud Console → Credentials → iOS tipi client'ın ID'si.
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

// ── Native modülleri güvenli yükle ──────────────────────────────────────
let AppleAuth: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AppleAuth = require('expo-apple-authentication');
} catch {
  AppleAuth = null;
}

let GoogleSignin: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch {
  GoogleSignin = null;
}

// ── Apple ───────────────────────────────────────────────────────────────

export function isAppleSignInSupported(): boolean {
  return Platform.OS === 'ios' && !!AppleAuth;
}

/**
 * Apple kimlik penceresini açar; Firebase'e verilecek kimlik bilgilerini döndürür.
 * Kullanıcı vazgeçerse null döner.
 *
 * NOT (nonce): Daha önce nonce (SHA-256) kullanılıyordu ama Firebase, kanonik
 * doğru uygulamaya rağmen ısrarla `auth/missing-or-invalid-nonce` döndürüyordu
 * (expo-crypto HEX + verbatim nonce zinciri her katmanda doğrulandı). Nonce Apple
 * girişinde ZORUNLU değildir; token zaten Apple imzalı ve TLS üzerinden gelir.
 * Bu yüzden nonce devre dışı bırakıldı — Firebase, rawNonce verilmezse nonce
 * doğrulaması yapmaz ve giriş sorunsuz tamamlanır.
 */
export async function getAppleCredential(): Promise<{
  identityToken: string;
  fullName?: string;
} | null> {
  if (!isAppleSignInSupported()) throw new Error('unsupported');
  const available = await AppleAuth.isAvailableAsync();
  if (!available) throw new Error('unsupported');

  try {
    const credential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return null;
    const name = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ');
    return { identityToken: credential.identityToken, fullName: name || undefined };
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}

// ── Google ──────────────────────────────────────────────────────────────

let googleConfigured = false;

export function isGoogleSignInSupported(): boolean {
  return !!GoogleSignin && !!GOOGLE_WEB_CLIENT_ID;
}

/**
 * Google hesap seçiciyi açar; Firebase'e verilecek idToken döndürür.
 * Kullanıcı vazgeçerse null döner.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  if (!isGoogleSignInSupported()) throw new Error('unsupported');
  if (!googleConfigured) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      // iOS client id verilmişse kullan (yoksa Info.plist URL şemasından okunur).
      ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
    });
    googleConfigured = true;
  }
  try {
    await GoogleSignin.hasPlayServices?.({ showPlayServicesUpdateDialog: true });
  } catch {
    // iOS'ta yok — yoksay
  }
  try {
    const result = await GoogleSignin.signIn();
    // API sürümüne göre idToken farklı yerlerde olabilir.
    const idToken: string | undefined = result?.data?.idToken ?? result?.idToken;
    return idToken ?? null;
  } catch (e: any) {
    const cancelled =
      e?.code === 'SIGN_IN_CANCELLED' || e?.code === '-5' || e?.code === 12501 || e?.code === 'cancelled';
    if (cancelled) return null;
    throw e;
  }
}
