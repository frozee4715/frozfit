/**
 * Hesap kapısı (account gate) — "değer-önce / yumuşak duvar" stratejisi.
 *
 * İki seviye var:
 *
 * 1. `requireActiveTrial()` — kişisel özellikler için (öğün/kilo/antrenman
 *    kaydı, AI, favori). Misafir 7 günlük deneme boyunca bunları SERBESTÇE
 *    kullanır ("Ücretsiz başla" sözünün gereği); yalnızca deneme süresi
 *    dolunca "Hesap oluştur" duvarı çıkar. Hesap ücretsizdir, veriler taşınır.
 *
 * 2. `requireAccount()` — topluluk eylemleri için (tarif paylaşma, yorum,
 *    beğeni, takip). Misafire HER ZAMAN kapalı: App Store Guideline 1.2
 *    kullanıcı içeriğinde hesap sorumluluğu ister (şikayet/engelleme anlamlı
 *    olmalı), anonim kimlikle topluluk olmaz.
 *
 * Kullanım:
 *   const { requireActiveTrial } = useAccountGate();
 *   const onAdd = () => {
 *     if (!requireActiveTrial()) return; // süresi dolmuş misafirse durur + modal
 *     ...gerçek aksiyon...
 *   };
 */
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { GUEST_TRIAL_DAYS, isGuestExpired, useUserProfile } from '@/lib/user-profile';

export function useAccountGate() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const isGuest = Boolean(user?.isAnonymous);

  /** Topluluk eylemleri: misafire her zaman kapalı. */
  const requireAccount = useCallback(
    (message?: string): boolean => {
      if (!isGuest) return true;
      Alert.alert(
        'Ücretsiz hesap oluştur',
        message ??
          'Topluluk özellikleri için ücretsiz bir hesap gerekli. Verilerin aynen taşınır, hiçbir şey kaybolmaz.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Hesap oluştur', onPress: () => router.push('/upgrade' as Href) },
        ],
      );
      return false;
    },
    [isGuest, router],
  );

  /** Kişisel özellikler: misafir deneme süresi bitene kadar serbest. */
  const requireActiveTrial = useCallback((): boolean => {
    if (!isGuest) return true;
    if (!isGuestExpired(profile)) return true;
    Alert.alert(
      'Deneme süren doldu',
      `${GUEST_TRIAL_DAYS} günlük misafir denemen bitti. Devam etmek için ücretsiz bir hesap oluştur — planın, kayıtların ve kredilerin aynen taşınır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ücretsiz hesap oluştur', onPress: () => router.push('/upgrade' as Href) },
      ],
    );
    return false;
  }, [isGuest, profile, router]);

  return { isGuest, requireAccount, requireActiveTrial };
}
