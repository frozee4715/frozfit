import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type AIContext, type FoodEstimate, analyzeFoodPhoto } from '@/lib/ai';
import { useAccountGate } from '@/lib/account-gate';
import { useAiAccess } from '@/lib/ai-credits';
import { MEAL_TYPES, type MealType, useDailyLog } from '@/lib/daily-log';
import { prepareImageForAI } from '@/lib/image';
import { allergenLabel, goalLabel } from '@/lib/plan';
import { shareView } from '@/lib/share';
import { useUserProfile } from '@/lib/user-profile';

export default function PhotoMealScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meal } = useLocalSearchParams<{ meal?: string }>();
  const { addMeal } = useDailyLog();
  const { profile } = useUserProfile();
  const access = useAiAccess();
  const { requireAccount } = useAccountGate();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<FoodEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>((meal as MealType) || 'snack');

  // Paylaşılacak görsel, ekrandaki tarama çerçevesinin ta kendisi (fotoğraf +
  // makro baloncukları + marka izi). Ayrı bir kart çizmek yerine görüneni
  // yakalıyoruz: kullanıcı ne paylaşacağını birebir görüyor.
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const ctx: AIContext | undefined = profile
    ? { diet: profile.diet, allergies: profile.allergies.map(allergenLabel), goal: goalLabel(profile.goal) }
    : undefined;

  const analyze = async (uri: string, width?: number) => {
    setImageUri(uri);
    setEstimate(null);
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeFoodPhoto(await prepareImageForAI(uri, width), ctx);
      // Model yemek bulamadıysa (kcal 0) tahmini gösterme, uyar.
      if (result.kcal <= 0) {
        setError('Fotoğrafta yemek algılanamadı. Yemeğin net göründüğü bir fotoğraf dene.');
      } else {
        setEstimate(result);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Görsel analiz edilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const pick = async (from: 'camera' | 'library') => {
    setError(null);
    if (!requireAccount()) return;
    if (!access.consume()) {
      router.push('/get-credits' as Href);
      return;
    }
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('İzin verilmedi.');
      return;
    }
    // base64'ü picker'dan istemiyoruz: görsel önce küçültülüp sonra kodlanıyor
    // (bkz. prepareImageForAI) — ham fotoğrafın base64'ü hem bellek hem token israfı.
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const res =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    const asset = res.canceled ? null : res.assets[0];
    if (asset?.uri) {
      analyze(asset.uri, asset.width);
    }
  };

  const share = async () => {
    setError(null);
    setSharing(true);
    try {
      await shareView(cardRef.current, 'Öğününü paylaş');
    } catch (e: any) {
      setError(e?.message ?? 'Paylaşılamadı.');
    } finally {
      setSharing(false);
    }
  };

  const add = () => {
    if (!estimate) return;
    addMeal({
      name: estimate.name,
      mealType,
      portion: 'Fotoğraf tahmini',
      kcal: estimate.kcal,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
    });
    router.back();
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
        <ThemedText type="subtitle" style={{ fontSize: 18 }}>
          Fotoğraftan kalori
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14 }}>
          Yemeğinin fotoğrafını çek; AI tahmini kalori ve makroları çıkarsın.
        </ThemedText>

        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Pressable onPress={() => pick('camera')} style={[styles.pickBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="camera" size={18} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
              Fotoğraf çek
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => pick('library')}
            style={[styles.pickBtn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Ionicons name="images-outline" size={18} color={theme.text} />
            <ThemedText type="smallBold" style={{ fontSize: 14 }}>
              Galeriden
            </ThemedText>
          </Pressable>
        </View>

        {imageUri && (
          // collapsable={false}: Android'de yakalanabilmesi için görünüm ağaçta
          // gerçek bir node olarak kalmalı.
          <View ref={cardRef} collapsable={false} style={styles.scanFrame}>
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />

            {/* Köşe çerçeveleri (tarama görünümü) */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: theme.primary }]} />

            {loading && (
              <View style={styles.scanOverlayCenter}>
                <View style={styles.loadingPill}>
                  <ActivityIndicator color="#fff" />
                  <ThemedText type="small" style={{ color: '#fff', fontSize: 13 }}>
                    Analiz ediliyor…
                  </ThemedText>
                </View>
              </View>
            )}

            {estimate && !loading && (
              <>
                <View style={[styles.pos, styles.posTop]}>
                  <Bubble big value={`${estimate.kcal}`} unit="Kcal" label="Kalori" color={theme.calorie} />
                </View>
                <View style={[styles.pos, styles.posLeft]}>
                  <Bubble value={`${estimate.fat}`} unit="g" label="Yağ" color={theme.fat} />
                </View>
                <View style={[styles.pos, styles.posRight]}>
                  <Bubble value={`${estimate.protein}`} unit="g" label="Protein" color={theme.protein} />
                </View>
                <View style={[styles.pos, styles.posBottom]}>
                  <Bubble value={`${estimate.carbs}`} unit="g" label="Karb" color={theme.carbs} />
                </View>

                {/* Marka izi: bu görsel WhatsApp/Instagram'a gittiğinde onu gören
                    herkes için uygulamanın giriş kapısı. Organik kazanımın tamamı
                    buradan geçiyor, o yüzden silme. */}
                <View style={styles.watermark}>
                  <Ionicons name="leaf" size={12} color="#fff" />
                  <ThemedText type="smallBold" style={{ fontSize: 12, color: '#fff' }}>
                    FrozFit
                  </ThemedText>
                  <ThemedText type="small" style={{ fontSize: 11, color: '#fff', opacity: 0.75 }}>
                    frozfit.app
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        )}

        {loading && !imageUri && (
          <View style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three }}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary">
              Yemek analiz ediliyor...
            </ThemedText>
          </View>
        )}

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}

        {estimate && (
          <View style={{ gap: Spacing.three }}>
            <ThemedText type="subtitle" style={{ fontSize: 20 }}>
              {estimate.name}
            </ThemedText>

            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((mt) => {
                const sel = mt.value === mealType;
                return (
                  <Pressable
                    key={mt.value}
                    onPress={() => setMealType(mt.value)}
                    style={[
                      styles.mealChip,
                      { backgroundColor: sel ? theme.primary : theme.backgroundElement, borderColor: sel ? theme.primary : theme.border },
                    ]}>
                    <ThemedText type="small" style={{ fontSize: 12, color: sel ? '#fff' : theme.textSecondary }}>
                      {mt.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Pressable onPress={add} style={[styles.addBtn, { flex: 1, backgroundColor: theme.primary }]}>
                <Ionicons name="add" size={20} color="#fff" />
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                  Güne ekle
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={share}
                disabled={sharing}
                style={[styles.shareBtn, { borderColor: theme.border, opacity: sharing ? 0.6 : 1 }]}>
                {sharing ? (
                  <ActivityIndicator color={theme.text} />
                ) : (
                  <Ionicons name="share-social-outline" size={20} color={theme.text} />
                )}
              </Pressable>
            </View>

            <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
              Not: Bu yapay zekâ tahminidir, kesin değildir. Gerekirse değeri elle düzeltebilirsin.
            </ThemedText>
          </View>
        )}
      </Screen>
    </View>
  );
}

/** Fotoğrafın üstünde yüzen makro baloncuğu (tarama görünümü). */
function Bubble({
  value,
  unit,
  label,
  color,
  big,
}: {
  value: string;
  unit: string;
  label: string;
  color: string;
  big?: boolean;
}) {
  return (
    <View style={[styles.bubble, big && styles.bubbleBig]}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <ThemedText type="smallBold" style={{ fontSize: big ? 22 : 16, color }}>
          {value}
        </ThemedText>
        <ThemedText type="small" style={{ fontSize: big ? 12 : 10, color }}>
          {unit}
        </ThemedText>
      </View>
      <ThemedText type="small" style={{ fontSize: 10, color: '#5B6B63' }}>
        {label}
      </ThemedText>
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
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    borderRadius: Radius.pill,
  },
  scanFrame: {
    width: '100%',
    height: 320,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#DDE6E1',
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  cornerTL: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  scanOverlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  bubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleBig: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // Sol altta, köşe işaretinin (bottom:14, 28px) üstünde ve orta-alt karb
  // baloncuğunun solunda kalacak şekilde konumlanır — hiçbiriyle çakışmaz.
  watermark: {
    position: 'absolute',
    left: 14,
    bottom: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shareBtn: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pos: { position: 'absolute' },
  posTop: { top: 22, left: 0, right: 0, alignItems: 'center' },
  posBottom: { bottom: 22, left: 0, right: 0, alignItems: 'center' },
  posLeft: { left: 18, top: '44%' },
  posRight: { right: 18, top: '36%' },
  mealTypeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mealChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 54,
    borderRadius: Radius.pill,
  },
});
