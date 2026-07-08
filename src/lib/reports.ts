/**
 * İçerik raporlama — kullanıcıların uygunsuz topluluk içeriğini (tarif, yorum,
 * kullanıcı) bildirmesi için. Raporlar `reports` koleksiyonuna yazılır ve
 * yalnızca yönetici (Firebase Console) tarafından okunur.
 *
 * App Store Guideline 1.2 (kullanıcı içeriği) gereği: uygunsuz içeriği bildirme
 * mekanizması. Engelleme için bkz. `toggleBlock` (user-profile.ts).
 */
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export type ReportTargetType = 'recipe' | 'review' | 'user';

/** Kullanıcıya sunulan hazır şikâyet sebepleri. */
export const REPORT_REASONS = [
  'Uygunsuz veya rahatsız edici içerik',
  'Spam veya yanıltıcı',
  'Taciz veya nefret söylemi',
  'Telif hakkı ihlali',
  'Diğer',
] as const;

export type ReportInput = {
  targetType: ReportTargetType;
  /** Raporlanan içeriğin id'si (tarif/yorum id ya da kullanıcı uid). */
  targetId: string;
  /** Raporlanan içeriğin sahibinin uid'si (biliniyorsa). */
  targetUid?: string | null;
  reporterUid: string;
  reason: string;
};

/** Bir içeriği raporlar (moderasyon için `reports` koleksiyonuna yazar). */
export async function reportContent(input: ReportInput): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırılmamış.');
  await addDoc(collection(db, 'reports'), {
    targetType: input.targetType,
    targetId: input.targetId,
    targetUid: input.targetUid ?? null,
    reporterUid: input.reporterUid,
    reason: input.reason,
    status: 'open',
    createdAt: serverTimestamp(),
  });
}
