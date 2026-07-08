/**
 * Oturum akışı bayrağı.
 *
 * Yeni akış: oturumu olmayan kullanıcı İLK ÖNCE kişiselleştirme (onboarding) görür.
 * Ancak hâlihazırda hesabı olup ÇIKIŞ yapan bir kullanıcıyı tekrar onboarding'e değil,
 * doğrudan giriş ekranına göndermeliyiz. Çıkış anında bu bayrak set edilir; kök
 * yönlendirici bir kez okuyup temizler.
 */
let returningToLogin = false;

/** Çıkış yaparken çağır: sonraki yönlendirme giriş ekranına gitsin. */
export function flagReturningToLogin(): void {
  returningToLogin = true;
}

/** Kök yönlendirici okur; bayrak set ise true döner ve tek seferlik temizler. */
export function consumeReturningToLogin(): boolean {
  if (!returningToLogin) return false;
  returningToLogin = false;
  return true;
}
