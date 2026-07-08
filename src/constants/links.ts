/**
 * Uygulama genelindeki dış bağlantılar — tek yerden yönetilir.
 *
 * ÖNEMLİ: PRIVACY_URL ve SUPPORT_URL, Cloudflare'e yüklenen statik sitenin
 * gerçek adresiyle güncellenmelidir (docs/site klasörü → workers.dev).
 */

/** Apple standart EULA — abonelik paywall'unda zorunlu. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

/** Gizlilik politikası (docs/site/index.html'in yayınlandığı adres). */
export const PRIVACY_URL = 'https://frozfit.frozee4715.workers.dev/';

/** Destek sayfası (docs/site/support.html). */
export const SUPPORT_URL = 'https://frozfit.frozee4715.workers.dev/support';
