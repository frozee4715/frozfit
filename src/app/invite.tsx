/**
 * Davet ekranı — viral döngünün kullanıcıya bakan yüzü.
 *
 * İki yön var: kendi kodunu paylaş (getir) ve arkadaşının kodunu gir (kazan).
 * İkisi de aynı ekranda, çünkü yeni kullanıcı buraya "kod girmek" için gelir ve
 * kod girdikten hemen sonra kendi kodunu görüp paylaşması en olası andır.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAiAccess } from '@/lib/ai-credits';
import { claimCode, getMyCode } from '@/lib/referral';

const REWARD = 10;

export default function InviteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium } = useAiAccess();

  const [code, setCode] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [input, setInput] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyCode();
      setCode(res.code);
      setCount(res.count);
    } catch (e: any) {
      setError(e?.message ?? 'Davet kodu alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!code) return;
    await Share.share({
      message:
        `FrozFit'i dene: yemeğinin fotoğrafını çek, kalorisini yapay zekâ söylesin.\n\n` +
        `Davet kodum: ${code}\nKodu girersen ikimiz de ${REWARD} AI kredisi kazanıyoruz.\n\n` +
        `https://frozfit.app`,
    });
  };

  const claim = async () => {
    const value = input.trim().toUpperCase();
    if (!value) return;
    setError(null);
    setClaiming(true);
    try {
      await claimCode(value);
      setClaimed(true);
      setInput('');
      load(); // sayaç/kod tazelensin
    } catch (e: any) {
      setError(e?.message ?? 'Kod kullanılamadı.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <View style={{ alignItems: 'center', gap: Spacing.two }}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="gift" size={34} color={theme.primaryDark} />
          </View>
          <ThemedText type="subtitle" style={{ fontSize: 24, textAlign: 'center' }}>
            Arkadaşını getir, ikiniz de kazanın
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14, textAlign: 'center' }}>
            Kodunu kullanan her arkadaşın için {REWARD} AI kredisi kazanırsın. O da {REWARD} kredi ile başlar.
          </ThemedText>
        </View>

        {/* Kendi kodun */}
        <Card style={{ gap: Spacing.three }}>
          <ThemedText type="smallBold" style={{ fontSize: 16 }}>
            Davet kodun
          </ThemedText>

          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : code ? (
            <>
              <Pressable onPress={copy} style={[styles.codeBox, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}>
                <ThemedText type="subtitle" style={{ fontSize: 28, letterSpacing: 4, color: theme.primaryDark }}>
                  {code}
                </ThemedText>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={theme.primaryDark} />
              </Pressable>

              <Pressable onPress={share} style={[styles.cta, { backgroundColor: theme.primary }]}>
                <Ionicons name="share-social" size={20} color="#fff" />
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                  Arkadaşlarına gönder
                </ThemedText>
              </Pressable>

              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                {count > 0
                  ? `${count} kişi kodunu kullandı — ${count * REWARD} kredi kazandın 🎉`
                  : 'Henüz kimse kodunu kullanmadı. İlk arkadaşını davet et!'}
              </ThemedText>
            </>
          ) : null}
        </Card>

        {/* Arkadaşının kodu */}
        {claimed ? (
          <Card style={[styles.done, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={22} color={theme.primaryDark} />
            <ThemedText type="smallBold" style={{ fontSize: 15, color: theme.primaryDark, flex: 1 }}>
              Kod kullanıldı — {REWARD} AI kredisi hesabına eklendi 🎉
            </ThemedText>
          </Card>
        ) : (
          <Card style={{ gap: Spacing.two }}>
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>
              Arkadaşının kodu var mı?
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
              Kodu gir, {REWARD} AI kredisi kazan. Bir kez kullanılabilir.
            </ThemedText>

            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="ÖRN: K7QM2P"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
              <Pressable
                onPress={claim}
                disabled={claiming || input.trim().length < 4}
                style={[
                  styles.claimBtn,
                  { backgroundColor: theme.primary, opacity: claiming || input.trim().length < 4 ? 0.5 : 1 },
                ]}>
                {claiming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 15 }}>
                    Kullan
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </Card>
        )}

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}

        {isPremium && (
          <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
            Premium&apos;sun; kredilere ihtiyacın yok ama davet ettiğin arkadaşların kazanır.
          </ThemedText>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.pill,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
    letterSpacing: 2,
  },
  claimBtn: {
    minWidth: 90,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
