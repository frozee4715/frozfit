/**
 * Moderasyon yardımcıları — topluluk içeriği için "bildir" ve "engelle"
 * akışlarını native Alert ile sunar. (App Store Guideline 1.2)
 */
import { Alert } from 'react-native';

import { reportContent, REPORT_REASONS, type ReportTargetType } from '@/lib/reports';
import { toggleBlock } from '@/lib/user-profile';

/** İçeriği bildir: sebep seç → `reports` koleksiyonuna yaz → onay göster. */
export function promptReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  targetUid?: string | null;
  reporterUid: string;
}): void {
  Alert.alert(
    'İçeriği bildir',
    'Bu içeriği neden bildiriyorsun? Bildirimin incelenecek.',
    [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: () => {
          reportContent({ ...params, reason })
            .then(() =>
              Alert.alert(
                'Teşekkürler',
                'Bildirimin alındı. İçeriği en kısa sürede inceleyeceğiz.',
              ),
            )
            .catch(() => Alert.alert('Hata', 'Bildirim gönderilemedi. Lütfen tekrar dene.'));
        },
      })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ],
  );
}

/** Kullanıcıyı engelle: onay → engelle → içerikleri gizle. */
export function promptBlock(params: {
  uid: string;
  targetUid: string;
  targetName?: string;
  onDone?: () => void;
}): void {
  const who = params.targetName ? `${params.targetName} adlı kullanıcının` : 'Bu kullanıcının';
  Alert.alert(
    'Kullanıcıyı engelle',
    `${who} tarifleri ve yorumları artık sana gösterilmeyecek.`,
    [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: () => {
          toggleBlock(params.uid, params.targetUid, true)
            .then(() => {
              Alert.alert('Engellendi', 'Bu kullanıcının içerikleri artık gizli.');
              params.onDone?.();
            })
            .catch(() => Alert.alert('Hata', 'İşlem gerçekleştirilemedi.'));
        },
      },
    ],
  );
}
