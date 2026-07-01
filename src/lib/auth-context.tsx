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
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, isFirebaseConfigured } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  /** İlk oturum kontrolü sürerken true. */
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Şifre sıfırlama e-postası gönderir. */
  resetPassword: (email: string) => Promise<void>;
  /** Misafir (anonim) hesabı e-posta/şifreyle kalıcı hesaba bağlar; veriler korunur. */
  upgradeGuest: (email: string, password: string) => Promise<void>;
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
      signOut: async () => {
        if (!auth) return;
        await fbSignOut(auth);
      },
      resetPassword: async (email) => {
        if (!auth) throw new Error('Firebase yapılandırılmamış.');
        await sendPasswordResetEmail(auth, email.trim());
      },
      upgradeGuest: async (email, password) => {
        if (!auth?.currentUser) throw new Error('Oturum yok.');
        const credential = EmailAuthProvider.credential(email.trim(), password);
        await linkWithCredential(auth.currentUser, credential);
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
