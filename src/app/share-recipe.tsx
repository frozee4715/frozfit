import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Field, NumberInput, TextArea, TextField, formStyles } from '@/components/ui/form';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAccountGate } from '@/lib/account-gate';
import { useAuth } from '@/lib/auth-context';
import { shareRecipe } from '@/lib/community';
import { isUploadEnabled, uploadRecipeImage } from '@/lib/supabase-upload';
import { useUserProfile } from '@/lib/user-profile';

/** Çok satırlı metni satır listesine çevirir (boş satırları atar). */
function toLines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

export default function ShareRecipeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requireAccount } = useAccountGate();
  const { profile } = useUserProfile();

  const [title, setTitle] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim().length > 0 && kcal.trim().length > 0;

  const pickPhoto = async (from: 'camera' | 'library') => {
    setError(null);
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('İzin verilmedi.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    };
    const res =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]?.uri) {
      setPhotoUri(res.assets[0].uri);
      setPhotoBase64(res.assets[0].base64 ?? null);
    }
  };

  const submit = async () => {
    if (!user || !valid) return;
    if (!requireAccount()) return;
    setError(null);
    setBusy(true);
    try {
      // Fotoğraf seçildiyse önce Supabase'e yükle, URL'ini al.
      let imageUrl = '';
      if (photoBase64) {
        try {
          imageUrl = await uploadRecipeImage(user.uid, photoBase64);
        } catch {
          setError('Fotoğraf yüklenemedi. İnternet bağlantını kontrol et.');
          setBusy(false);
          return;
        }
      }
      await shareRecipe(user.uid, profile?.name || 'Bir FrozFit kullanıcısı', {
        title: title.trim(),
        image: imageUrl,
        kcal: Math.round(Number(kcal) || 0),
        minutes: Math.round(Number(minutes) || 0),
        protein: Math.round(Number(protein) || 0),
        carbs: Math.round(Number(carbs) || 0),
        fat: Math.round(Number(fat) || 0),
        ingredients: toLines(ingredients),
        steps: toLines(steps),
      });
      router.replace('/community');
    } catch {
      setError('Paylaşılamadı. İnternet bağlantını kontrol et.');
      setBusy(false);
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
        <ThemedText type="subtitle" style={{ fontSize: 18 }}>
          Tarif paylaş
        </ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <Screen>
        <Field label="Tarif adı">
          <TextField placeholder="örn. Fırında Köfte" value={title} onChangeText={setTitle} />
        </Field>

        {isUploadEnabled() && (
        <Field label="Yemeğinin fotoğrafı" hint="Kendi yaptığın yemeğin net bir fotoğrafını ekle. İstersen boş bırak; varsayılan görsel kullanılır.">
          {photoUri ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
              <Pressable onPress={() => { setPhotoUri(null); setPhotoBase64(null); }} style={[styles.removePhoto, { backgroundColor: theme.card }]} hitSlop={8}>
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Pressable onPress={() => pickPhoto('camera')} style={[styles.photoBtn, { backgroundColor: theme.primary }]}>
                <Ionicons name="camera" size={18} color="#fff" />
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
                  Fotoğraf çek
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => pickPhoto('library')}
                style={[styles.photoBtn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
                <Ionicons name="images-outline" size={18} color={theme.text} />
                <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                  Galeriden
                </ThemedText>
              </Pressable>
            </View>
          )}
        </Field>
        )}

        <View style={formStyles.row}>
          <Field label="Kalori (kcal)" style={{ flex: 1 }}>
            <NumberInput value={kcal} onChangeText={setKcal} placeholder="450" maxLength={4} />
          </Field>
          <Field label="Süre (dk)" style={{ flex: 1 }}>
            <NumberInput value={minutes} onChangeText={setMinutes} placeholder="25" maxLength={3} />
          </Field>
        </View>

        <View style={formStyles.row}>
          <Field label="Protein (g)" style={{ flex: 1 }}>
            <NumberInput value={protein} onChangeText={setProtein} placeholder="30" maxLength={3} />
          </Field>
          <Field label="Karb (g)" style={{ flex: 1 }}>
            <NumberInput value={carbs} onChangeText={setCarbs} placeholder="40" maxLength={3} />
          </Field>
          <Field label="Yağ (g)" style={{ flex: 1 }}>
            <NumberInput value={fat} onChangeText={setFat} placeholder="12" maxLength={3} />
          </Field>
        </View>

        <Field label="Malzemeler" hint="Her satıra bir malzeme yaz.">
          <TextArea
            placeholder={'200 g kıyma\n1 soğan\nTuz, karabiber'}
            value={ingredients}
            onChangeText={setIngredients}
          />
        </Field>

        <Field label="Yapılışı" hint="Her satıra bir adım yaz.">
          <TextArea
            placeholder={'Soğanı kavur.\nKıymayı ekleyip pişir.\nFırında 20 dk tut.'}
            value={steps}
            onChangeText={setSteps}
          />
        </Field>

        {error && (
          <ThemedText type="small" style={{ color: theme.accent, fontSize: 13 }}>
            {error}
          </ThemedText>
        )}

        <Pressable
          onPress={submit}
          disabled={!valid || busy}
          style={[styles.saveBtn, { backgroundColor: valid ? theme.primary : theme.backgroundSelected, opacity: busy ? 0.7 : 1 }]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
              Paylaş
            </ThemedText>
          )}
        </Pressable>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    borderRadius: Radius.pill,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: '#DDE6E1',
  },
  removePhoto: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
