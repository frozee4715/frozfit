/**
 * Paylaşım katmanı — ekrandaki bir görünümü markalı bir görsele çevirip
 * sistemin paylaşım sayfasına (Instagram, WhatsApp, mesajlar...) verir.
 *
 * BÜYÜME: Uygulamanın tek organik kazanım kanalı bu. Kullanıcı zaten
 * ilerlemesini paylaşmak istiyor; bizim işimiz paylaşılacak nesneyi üretmek.
 * Kartın üstündeki marka + adres, görseli gören herkes için giriş kapısı olur.
 */
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { ComponentRef } from 'react';
import type { View } from 'react-native';

export type ShareableRef = ComponentRef<typeof View> | null;

/** Paylaşım bu cihazda mümkün mü? (Web'de değil.) */
export function isShareAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}

/**
 * Verilen görünümü PNG'ye çevirip paylaşım sayfasını açar.
 * Görünüm EKRANDA GÖRÜNÜR olmalı — gizli/0 opaklıktaki görünümler boş yakalanır.
 */
export async function shareView(ref: ShareableRef, dialogTitle = 'FrozFit'): Promise<void> {
  if (!ref) throw new Error('Paylaşılacak içerik hazır değil.');

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Bu cihazda paylaşım kullanılamıyor.');
  }

  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle,
    UTI: 'public.png',
  });
}
