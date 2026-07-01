/**
 * Hesap kapısı (account gate) — "değer-önce / yumuşak duvar" stratejisi.
 *
 * Misafir (anonim) kullanıcılar uygulamayı GEZEBİLİR (Keşfet, tarifler, plan
 * önizlemesi) ama kalıcı bir şey yapmaya çalıştıklarında (öğün/kilo/antrenman
 * kaydı, AI, favori, paylaşım, takip) nazik bir "Hesap oluştur" duvarı çıkar.
 *
 * Kullanım:
 *   const { requireAccount, isGuest } = useAccountGate();
 *   const onAdd = () => {
 *     if (!requireAccount()) return;   // misafirse durur + kaydol modalı
 *     ...gerçek aksiyon...
 *   };
 */
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/lib/auth-context';

export function useAccountGate() {
  const { user } = useAuth();
  const router = useRouter();
  const isGuest = Boolean(user?.isAnonymous);

  const requireAccount = useCallback(
    (message?: string): boolean => {
      if (!isGuest) return true;
      Alert.alert(
        'Ücretsiz hesap oluştur',
        message ??
          'Bunu yapmak için ücretsiz bir hesap oluştur. Verilerin güvenle kaydedilir ve cihazların arasında eşitlenir.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Hesap oluştur', onPress: () => router.push('/upgrade' as Href) },
        ],
      );
      return false;
    },
    [isGuest, router],
  );

  return { isGuest, requireAccount };
}
