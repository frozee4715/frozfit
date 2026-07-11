/**
 * AI'ye gönderilecek görselleri hazırlar.
 *
 * MALİYET: Gemini görseli 768×768'lik karolara böler ve her karoyu ~258 token
 * sayar. Telefonun çektiği ham fotoğraf (ör. 3024×4032) ~12 karo = ~3.000 token
 * ederken, uzun kenarı 768'e indirilmiş hâli 2 karo = ~516 token eder. Yemek/
 * malzeme tanımak için bu çözünürlük fazlasıyla yeterli, ama fatura ~6 kat düşer.
 * Ayrıca gövde küçüldüğü için yükleme de hızlanır.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Gemini'nin karo boyutu; bunun üstüne çıkmak ekstra karo = ekstra token demek. */
const MAX_EDGE = 768;

/**
 * Görseli küçültüp AI'nin beklediği base64 data URL'ine çevirir.
 * Genişlik 768'e indirilir (yükseklik oranı korur), JPEG olarak sıkıştırılır.
 * `width` verilirse ve görsel zaten küçükse büyütmeden geçilir.
 */
export async function prepareImageForAI(uri: string, width?: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  if (!width || width > MAX_EDGE) context.resize({ width: MAX_EDGE });

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
    base64: true,
  });

  if (!result.base64) throw new Error('Görsel işlenemedi.');
  return `data:image/jpeg;base64,${result.base64}`;
}
