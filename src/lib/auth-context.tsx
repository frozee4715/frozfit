/**
 * Kimlik doğrulama (Authentication) durumunu uygulama geneline sağlar.
 *
 * Kullanım:
 *   const { user, loading, signIn, signUp, signOut } = useAuth();
 *
 * Firebase yapılandırılmamışsa (env boşsa) hata vermez; user = null,
 * loading = false döner ve uygulama mock verilerle çalışmaya devam eder.
 */
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deleteAllUserData } from '@/lib/delete-user-data';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { getAppleCredential, getGoogleIdToken } from '@/lib/social-auth';

type AuthContextValue = {
  user: User | null;
  /** İlk oturum kontrolü sürerken true. */
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  /** Apple ile giriş. Kullanıcı vazgeçerse sessizce döner. */
  signInWithApple: () => Promise<void>;
  /** Google ile giriş. Kullanıcı vazgeçerse sessizce döner. */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Şifre sıfırlama e-postası gönderir. */
  resetPassword: (email: string) => Promise<void>;
  /** Doğrulama e-postasını yeniden gönderir. */
  resendVerification: () => Promise<void>;
  /** Sunucudan kullanıcıyı tazeler (emailVerified güncellenir). */
  reloadUser: () => Promise<void>;
  /** Misafir (anonim) hesabı e-posta/şifreyle kalıcı hesaba bağlar; veriler korunur. */
  upgradeGuest: (email: string, password: string) => Promise<void>;
  /**
   * Hesabı ve tüm verileri kalıcı olarak siler (Apple zorunluluğu).
   * E-posta/şifre hesabında yakın zamanda giriş gerekir; `password` verilirse
   * önce yeniden doğrulama yapılır. Gerekirse 'auth/requires-recent-login' fırlatır.
   */
  deleteAccount: (password?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Firebase yoksa beklemeye gerek yok.
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      signIn: async (email, password) => {
        if (!auth) throw new Error('Firebase yapılandırılmamış.');
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signUp: async (email, password) => {
        if (!auth) throw new Error('Firebase yapılandırılmamış.');
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // E-posta doğrulama maili gönder (hata olursa kayıt yine de tamamlanır)
        sendEmailVerification(result.user).catch(() => {});
      },
      signInGuest: async () => {
        if (!auth) throw new Error('Firebase yapılandırılmamış.');
        await signInAnonymously(auth);
      },
      signInWithApple: async () => {
        if (!auth) throw new Error('Firebase yapılandırılmamış.');
        const apple = await getAppleCredential();
        if (!apple) return; // kullanıcı vazgeçti
        const provider = new OAuthProvider('apple.com');
        // Nonce KULLANILMIYOR (bkz. social-auth.ts getAppleCredential notu):
        // rawNonce verilmediğinde Firebase nonce doğrulaması yapmaz.
        const credential = provider.credential({
          idToken: apple.identityToken,
        });
        // Misafir (onboarding yapmış) kullanıcı: verisi korunsun diye aynı hesaba BAĞLA.
        const current = auth.currentUser;
        if (current?.isAnonymous) {
          try {
            const linked = await linkWithCredential(current, credential);
            if (apple.fullName && !linked.user.displayName) {
              updateProfile(linked.user, { displayName: apple.fullName }).catch(() => {});
            }
            return;
          } catch (e: any) {
            // Bu Apple hesabı zaten kayıtlı → normal girişe düş (misafir verisi bırakılır).
            if (e?.code !== 'auth/credential-already-in-use') throw e;
          }
        }
        const result = await signInWithCredential(auth, credential);
        // Apple adı yalnızca İLK girişte verir — profile yaz.
        if (apple.fullName && !result.user.displayName) {
          updateProfile(result.user, { displayName: apple.fullName }).catch(() => {});
        }
      },
      signInWithGoogle: async () => {
        if (!auth) throw new Error('Firebase yapılandırılmamış.');
        const idToken = await getGoogleIdToken();
        if (!idToken) return; // kullanıcı vazgeçti
        const credential = GoogleAuthProvider.credential(idToken);
        // Misafir (onboarding yapmış) kullanıcı: verisi korunsun diye aynı hesaba BAĞLA.
        const current = auth.currentUser;
        if (current?.isAnonymous) {
          try {
            await linkWithCredential(current, credential);
            return;
          } catch (e: any) {
            if (e?.code !== 'auth/credential-already-in-use') throw e;
          }
        }
        await signInWithCredential(auth, credential);
      },
      signOut: async () => {
        if (!auth) return;
        await fbSignOut(auth);
      },
      resetPassword: async (email) => {
        if (!auth) throw new Error('Firebase yapılandırılmamış.');
        await sendPasswordResetEmail(auth, email.trim());
      },
      resendVerification: async () => {
        if (!auth?.currentUser) throw new Error('Oturum yok.');
        await sendEmailVerification(auth.currentUser);
      },
      reloadUser: async () => {
        if (!auth?.currentUser) return;
        await reload(auth.currentUser);
        // onAuthStateChanged reload'da tetiklenmez; state'i elle tazele.
        setUser({ ...auth.currentUser } as User);
      },
      upgradeGuest: async (email, password) => {
        if (!auth?.currentUser) throw new Error('Oturum yok.');
        const credential = EmailAuthProvider.credential(email.trim(), password);
        const result = await linkWithCredential(auth.currentUser, credential);
        sendEmailVerification(result.user).catch(() => {});
      },
      deleteAccount: async (password) => {
        const current = auth?.currentUser;
        if (!current) throw new Error('Oturum yok.');
        // E-posta hesabı + şifre verildiyse önce yeniden doğrula.
        if (password && current.email) {
          const credential = EmailAuthProvider.credential(current.email, password);
          await reauthenticateWithCredential(current, credential);
        }
        // Önce veriler (Auth silinince kurallar erişimi kapatır), sonra hesap.
        try {
          await deleteAllUserData(current.uid);
        } catch {
          // veri temizliği en iyi çaba — hesap silmeye devam
        }
        await deleteUser(current);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>.');
  return ctx;
}
