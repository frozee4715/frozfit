/**
 * AI kredi sistemi — krediler Firestore'da `users/{uid}.aiCredits` alanında tutulur.
 *
 * Güvenlik:
 * - İstemci krediyi yalnızca AZALTABİLİR (Firestore kuralı artışı engeller).
 * - Krediyi artırmanın tek yolu Premium'a geçmek (Pro = sınırsız). Reklam yok.
 * - Pro kullanıcılar kredi harcamaz (isPremium=true → sınırsız).
 */
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { usePremium } from '@/lib/premium';

export const START_CREDITS = 5;
export const MAX_CREDITS = 60;

type CreditsContextValue = {
  credits: number;
  ready: boolean;
  setCredits: (n: number) => void;
};

const CreditsContext = createContext<CreditsContextValue>({
  credits: START_CREDITS,
  ready: false,
  setCredits: () => {},
});

export function AiCreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [credits, setCreditsState] = useState(START_CREDITS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setCreditsState(START_CREDITS);
      setReady(true);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const raw = snap.data()?.aiCredits;
        if (raw === undefined) {
          // İlk kez: başlangıç kredisini yaz
          setDoc(doc(db!, 'users', user.uid), { aiCredits: START_CREDITS, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
          setCreditsState(START_CREDITS);
        } else {
          const n = Number(raw);
          setCreditsState(Number.isFinite(n) ? Math.max(0, n) : START_CREDITS);
        }
        setReady(true);
      },
      () => {
        setCreditsState(START_CREDITS);
        setReady(true);
      },
    );
    return unsub;
  }, [user]);

  // Yalnızca azaltmaya izin var — Firestore kuralı artışı engeller
  const setCredits = (n: number) => {
    if (!user || !db) return;
    const clamped = Math.max(0, Math.min(MAX_CREDITS, Math.round(n)));
    setCreditsState(clamped);
    setDoc(doc(db, 'users', user.uid), { aiCredits: clamped, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
  };

  return (
    <CreditsContext.Provider value={{ credits, ready, setCredits }}>{children}</CreditsContext.Provider>
  );
}

export type AiAccess = {
  isPremium: boolean;
  unlimited: boolean;
  credits: number;
  ready: boolean;
  canUse: boolean;
  consume: () => boolean;
};

export function useAiAccess(): AiAccess {
  const { isPremium } = usePremium();
  const { credits, ready, setCredits } = useContext(CreditsContext);

  return {
    isPremium,
    unlimited: isPremium,
    credits,
    ready,
    canUse: isPremium || credits > 0,
    consume: () => {
      if (isPremium) return true;
      if (credits > 0) {
        setCredits(credits - 1);
        return true;
      }
      return false;
    },
  };
}
