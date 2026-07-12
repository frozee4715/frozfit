import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type AIContext, type ChatMessage, chefChat, isAIEnabled } from '@/lib/ai';
import { useAccountGate } from '@/lib/account-gate';
import { useAiAccess } from '@/lib/ai-credits';
import { allergenLabel, caloriesPerMeal, goalLabel } from '@/lib/plan';
import { useUserProfile } from '@/lib/user-profile';

const GREETING = 'Merhaba! Ben FrozFit koçunum 💪 Beslenme, öğün fikirleri ya da hedeflerinle ilgili ne istersen sorabilirsin.';

const QUICK_PROMPTS = [
  'Bugün ne yesem?',
  'Protein alımımı nasıl artırırım?',
  'Akşam tatlı krizine ne önerirsin?',
];

export default function CoachScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const access = useAiAccess();
  const { requireActiveTrial } = useAccountGate();
  const scrollRef = useRef<ScrollView>(null);
  const charged = useRef(false); // oturum başına 1 kredi

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = isAIEnabled();

  const ctx: AIContext | undefined = profile
    ? {
        diet: profile.diet,
        allergies: profile.allergies.map(allergenLabel),
        calorieTarget: profile.plan.calorieGoal,
        perMealKcal: caloriesPerMeal(profile.plan, profile.mealsPerDay),
        goal: goalLabel(profile.goal),
      }
    : undefined;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    if (!requireActiveTrial()) return;
    // Kredi kapısı: bu sohbet oturumunda bir kez ücretlendir.
    if (!charged.current) {
      if (!access.consume()) {
        router.push('/get-credits');
        return;
      }
      charged.current = true;
    }
    setInput('');
    setError(null);
    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(history);
    setBusy(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    try {
      // Selamlama mesajını modele göndermeye gerek yok; son konuşmayı ilet.
      const reply = await chefChat(history.slice(1), ctx);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.trim() }]);
    } catch (e: any) {
      setError(e?.message ?? 'Yanıt alınamadı.');
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + Spacing.two, backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Ionicons name="sparkles" size={18} color={theme.primary} />
          <ThemedText type="subtitle" style={{ fontSize: 18 }}>
            AI Koç
          </ThemedText>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === 'user'
                  ? { alignSelf: 'flex-end', backgroundColor: theme.primary }
                  : { alignSelf: 'flex-start', backgroundColor: theme.card, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth },
              ]}>
              <ThemedText
                type="small"
                style={{ fontSize: 15, lineHeight: 21, color: m.role === 'user' ? '#fff' : theme.text }}>
                {m.content}
              </ThemedText>
            </View>
          ))}

          {busy && (
            <View style={[styles.bubble, { alignSelf: 'flex-start', backgroundColor: theme.card, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
              <ActivityIndicator color={theme.primary} />
            </View>
          )}

          {error && (
            <ThemedText type="small" style={{ color: theme.accent, fontSize: 13, textAlign: 'center' }}>
              {error}
            </ThemedText>
          )}

          {/* Hızlı sorular (yalnızca sohbet başında) */}
          {messages.length === 1 && enabled && (
            <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
              {QUICK_PROMPTS.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => send(q)}
                  style={[styles.quick, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ fontSize: 14, flex: 1 }}>
                    {q}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Giriş çubuğu */}
        {enabled ? (
          <View
            style={[
              styles.inputBar,
              { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two },
            ]}>
            <View style={[styles.inputBox, { backgroundColor: theme.backgroundElement }]}>
              <TextInput
                placeholder="Bir şey sor..."
                placeholderTextColor={theme.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                style={[styles.inputText, { color: theme.text }]}
              />
            </View>
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || busy}
              style={[styles.sendBtn, { backgroundColor: input.trim() ? theme.primary : theme.backgroundSelected }]}>
              <Ionicons name="arrow-up" size={22} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.three }]}>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 13, flex: 1 }}>
              AI koçu kullanmak için .env dosyasına OpenRouter anahtarını ekle.
            </ThemedText>
          </View>
        )}
      </KeyboardAvoidingView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.lg,
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputBox: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxHeight: 120,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
