import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAccountGate } from '@/lib/account-gate';
import { type MealType, useDailyLog } from '@/lib/daily-log';
import { type FoodProduct, lookupBarcode } from '@/lib/food-search';

export default function ScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meal } = useLocalSearchParams<{ meal?: string }>();
  const mealType = (meal as MealType) || 'snack';
  const { addMeal } = useDailyLog();
  const { requireActiveTrial } = useAccountGate();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [grams, setGrams] = useState('100');
  const [notFound, setNotFound] = useState<string | null>(null);

  const onBarcode = async ({ data }: { data: string }) => {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    setNotFound(null);
    const found = await lookupBarcode(data);
    setLoading(false);
    if (found) {
      setProduct(found);
      setGrams(String(found.servingG && found.servingG > 0 ? found.servingG : 100));
    } else {
      setNotFound(data);
    }
  };

  const rescan = () => {
    setProduct(null);
    setNotFound(null);
    setScanning(true);
  };

  const g = Math.max(0, Number(grams.replace(',', '.')) || 0);
  const factor = g / 100;
  const scaled = product
    ? {
        kcal: Math.round(product.kcalPer100 * factor),
        protein: Math.round(product.proteinPer100 * factor),
        carbs: Math.round(product.carbsPer100 * factor),
        fat: Math.round(product.fatPer100 * factor),
      }
    : null;

  const add = () => {
    if (!product || !scaled) return;
    if (!requireActiveTrial()) return;
    addMeal({
      name: product.brand ? `${product.name} (${product.brand})` : product.name,
      mealType,
      portion: `${g} g`,
      kcal: scaled.kcal,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
    });
    router.back();
  };

  // İzin durumu
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, padding: Spacing.four }]}>
        <Ionicons name="camera-outline" size={48} color={theme.textMuted} />
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginVertical: Spacing.three }}>
          Barkod taramak için kamera iznine ihtiyacımız var.
        </ThemedText>
        <Pressable onPress={requestPermission} style={[styles.btn, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            İzin ver
          </ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            Geri dön
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {scanning && (
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={onBarcode}
        />
      )}

      {/* Üst bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Barkod tara</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tarama çerçevesi */}
      {scanning && !loading && (
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <ThemedText style={{ color: '#fff', marginTop: Spacing.three, textAlign: 'center' }}>
            Ürünün barkodunu çerçeveye getir
          </ThemedText>
        </View>
      )}

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={{ color: '#fff', marginTop: Spacing.two }}>Ürün aranıyor...</ThemedText>
        </View>
      )}

      {/* Bulunamadı */}
      {notFound && (
        <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + Spacing.four }]}>
          <ThemedText type="smallBold" style={{ fontSize: 16 }}>
            Ürün bulunamadı
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
            {notFound} barkodu veritabanında yok. Manuel ekleyebilir veya tekrar deneyebilirsin.
          </ThemedText>
          <Pressable onPress={rescan} style={[styles.btn, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              Tekrar tara
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Bulunan ürün */}
      {product && scaled && (
        <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + Spacing.four }]}>
          <ThemedText type="subtitle" style={{ fontSize: 18 }}>
            {product.name}
          </ThemedText>
          {product.brand && (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
              {product.brand}
            </ThemedText>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <ThemedText type="small" themeColor="textSecondary">
              Miktar
            </ThemedText>
            <View style={[styles.gramInput, { backgroundColor: theme.backgroundElement }]}>
              <TextInput
                value={grams}
                onChangeText={(t) => setGrams(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={[styles.gramText, { color: theme.text }]}
              />
              <ThemedText type="smallBold" themeColor="textSecondary">
                g
              </ThemedText>
            </View>
          </View>

          <View style={styles.macroRow}>
            <Macro label="Kalori" value={`${scaled.kcal}`} color={theme.calorie} />
            <Macro label="Prot" value={`${scaled.protein}g`} color={theme.protein} />
            <Macro label="Karb" value={`${scaled.carbs}g`} color={theme.carbs} />
            <Macro label="Yağ" value={`${scaled.fat}g`} color={theme.fat} />
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Pressable onPress={rescan} style={[styles.btn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Tekrar tara
              </ThemedText>
            </Pressable>
            <Pressable onPress={add} style={[styles.btn, { backgroundColor: theme.primary, flex: 1 }]}>
              <ThemedText type="smallBold" style={{ color: '#fff' }}>
                Güne ekle
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function Macro({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.macroCell, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ fontSize: 14, color }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  gramInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: Radius.md,
  },
  gramText: {
    minWidth: 50,
    fontSize: 16,
    fontWeight: '700',
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  macroCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  btn: {
    height: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
