import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { WeeklyProgressChart } from '@/components/ui/weekly-progress-chart';
import { userProfile } from '@/constants/mock-data';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { flagReturningToLogin } from '@/lib/auth-flow';
import { useT } from '@/lib/i18n';
import { goalLabel } from '@/lib/plan';
import { usePremium } from '@/lib/premium';
import { type WeightUnit, fromDisplayWeight, toDisplayWeight, useSettings, weightLabel } from '@/lib/settings';
import { useUserProfile } from '@/lib/user-profile';
import { useAccountGate } from '@/lib/account-gate';
import { logWeight, useWeightLog } from '@/lib/weight-log';

type SettingItem = { icon: any; labelKey: string; route?: Href };

/** Profil menüsü — karışıklığı önlemek için anlamlı bölümlere ayrıldı. */
const SETTING_SECTIONS: { titleKey: string; items: SettingItem[] }[] = [
  {
    titleKey: 'profile.section.plan',
    items: [
      { icon: 'flag-outline', labelKey: 'profile.goals', route: '/edit-profile' as Href },
      { icon: 'restaurant-outline', labelKey: 'profile.nutritionPrefs', route: '/edit-profile' as Href },
      { icon: 'barbell-outline', labelKey: 'profile.workout', route: '/workout' as Href },
    ],
  },
  {
    titleKey: 'profile.section.progress',
    items: [
      { icon: 'stats-chart-outline', labelKey: 'profile.insights', route: '/insights' as Href },
      { icon: 'trophy-outline', labelKey: 'profile.achievements', route: '/achievements' as Href },
      { icon: 'ribbon-outline', labelKey: 'profile.challenges', route: '/challenges' as Href },
      { icon: 'podium-outline', labelKey: 'profile.leaderboard', route: '/leaderboard' as Href },
      { icon: 'calendar-outline', labelKey: 'profile.history', route: '/history' as Href },
    ],
  },
  {
    titleKey: 'profile.section.recipes',
    items: [{ icon: 'heart-outline', labelKey: 'profile.favorites', route: '/favorites' as Href }],
  },
  {
    titleKey: 'profile.section.app',
    items: [
      { icon: 'settings-outline', labelKey: 'profile.settings', route: '/settings' as Href },
      { icon: 'notifications-outline', labelKey: 'profile.notifications', route: '/reminders' as Href },
      { icon: 'shield-checkmark-outline', labelKey: 'profile.privacy', route: '/privacy' as Href },
      { icon: 'ban-outline', labelKey: 'profile.blocked', route: '/blocked-users' as Href },
      { icon: 'help-circle-outline', labelKey: 'profile.help', route: '/help' as Href },
    ],
  },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { signOut, user } = useAuth();
  const { entries, latest } = useWeightLog();
  const { weightUnit } = useSettings();
  const { isPremium } = usePremium();
  const t = useT();
  const [weightModal, setWeightModal] = useState(false);
  const wl = weightLabel(weightUnit);

  // Gerçek profil yoksa (Firebase kapalı) mock'a düş.
  const name = profile?.name || userProfile.name;
  const goal = profile ? goalLabel(profile.goal) : userProfile.goal;
  const startWeight = profile?.weight ?? userProfile.weight;
  const targetWeight = profile?.targetWeight ?? userProfile.targetWeight;
  const height = profile?.height ?? userProfile.height;
  // Mevcut kilo: en son kaydedilen tartım, yoksa profildeki başlangıç kilosu.
  const currentWeight = latest?.weight ?? startWeight;
  const initials = name.slice(0, 1).toUpperCase();
  const remaining = Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10;

  const stats = [
    { label: 'Mevcut', value: `${toDisplayWeight(currentWeight, weightUnit)} ${wl}` },
    { label: 'Hedef', value: `${toDisplayWeight(targetWeight, weightUnit)} ${wl}` },
    { label: 'Boy', value: `${height} cm` },
  ];

  // Hedefe ilerleme oranı (hedef yönüne duyarlı).
  const total = Math.abs(startWeight - targetWeight) || 1;
  const moved = profile?.goal === 'gain' ? currentWeight - startWeight : startWeight - currentWeight;
  const progress = Math.max(0, Math.min(1, moved / total));

  // Kilo trendi grafiği için son 7 tartım (gün/ay etiketli).
  const weightPoints = entries.slice(-7).map((e) => {
    const [, m, d] = e.date.split('-');
    return { label: `${Number(d)}/${Number(m)}`, value: toDisplayWeight(e.weight, weightUnit) };
  });

  const isGuest = profile?.isGuest;
  const { requireAccount } = useAccountGate();

  const saveWeight = async (kg: number) => {
    setWeightModal(false);
    if (user) await logWeight(user.uid, kg).catch(() => {});
  };

  return (
    <Screen>
      {/* Profil başlığı */}
      <View style={{ alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.two }}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          {profile?.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <ThemedText style={{ color: '#fff', fontSize: 34, fontWeight: '700' }}>
              {initials}
            </ThemedText>
          )}
        </View>
        <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 30 }}>
          {name}
        </ThemedText>
        <View style={[styles.goalBadge, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="trending-down-outline" size={15} color={theme.primaryDark} />
          <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 13 }}>
            {goal}
          </ThemedText>
        </View>
        {profile && (
          <Pressable
            onPress={() => router.push('/edit-profile' as Href)}
            style={[styles.editBtn, { borderColor: theme.border }]}>
            <Ionicons name="create-outline" size={16} color={theme.text} />
            <ThemedText type="smallBold" style={{ fontSize: 13 }}>
              {t('profile.editProfile')}
            </ThemedText>
          </Pressable>
        )}
      </View>

      {/* Misafir bilgisi */}
      {isGuest && (
        <Card style={styles.guestCard}>
          <Ionicons name="person-add-outline" size={20} color={theme.primaryDark} />
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={{ fontSize: 14 }}>
              Misafir olarak geziyorsun
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              Öğün, kilo ve antrenman kaydetmek + verilerini güvende tutmak için ücretsiz hesap oluştur.
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push('/upgrade' as Href)}
            style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 13 }}>
              Kaydol
            </ThemedText>
          </Pressable>
        </Card>
      )}

      {/* Premium kartı */}
      {isPremium ? (
        <Card style={[styles.premiumActive, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="star" size={20} color={theme.primaryDark} />
          <ThemedText type="smallBold" style={{ fontSize: 14, color: theme.primaryDark, flex: 1 }}>
            FrozFit Premium aktif 🎉
          </ThemedText>
          <Pressable onPress={() => router.push('/premium' as Href)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={theme.primaryDark} />
          </Pressable>
        </Card>
      ) : (
        <Pressable onPress={() => router.push('/premium' as Href)}>
          <Card style={[styles.premiumCard, { backgroundColor: theme.primary }]}>
            <View style={[styles.premiumIcon, { backgroundColor: '#fff3' }]}>
              <Ionicons name="star" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ fontSize: 16, color: '#fff' }}>
                FrozFit Premium
              </ThemedText>
              <ThemedText type="small" style={{ fontSize: 12, color: '#fff', opacity: 0.9 }}>
                Sınırsız AI, özel plan ve daha fazlası
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Card>
        </Pressable>
      )}

      {/* İstatistikler */}
      <Card style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={s.label} style={styles.statItem}>
            <ThemedText type="smallBold" style={{ fontSize: 18 }}>
              {s.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              {s.label}
            </ThemedText>
            {i < stats.length - 1 && (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </Card>

      {/* Gerçek özet istatistikler */}
      <View style={styles.activityGrid}>
        <ActivityTile
          icon="body-outline"
          value={`${toDisplayWeight(currentWeight, weightUnit)}`}
          label={`Mevcut ${wl}`}
          hint={latest ? 'Son tartım' : 'Başlangıç'}
          color={theme.primary}
        />
        <ActivityTile
          icon="flag-outline"
          value={`${toDisplayWeight(remaining, weightUnit)}`}
          label={`Hedefe ${wl}`}
          hint={remaining === 0 ? 'Ulaştın!' : 'kaldı'}
          color={theme.accent}
        />
        <ActivityTile
          icon="speedometer-outline"
          value={profile ? `${profile.plan.bmi}` : '—'}
          label="BMI"
          hint="Vücut kitle"
          color={theme.protein}
        />
      </View>

      {/* Kilo değişimi grafiği */}
      <Card style={{ gap: Spacing.three }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="smallBold" style={{ fontSize: 15 }}>
            Kilo değişimi
          </ThemedText>
          <Pressable
            onPress={() => {
              if (!requireAccount()) return;
              setWeightModal(true);
            }}
            style={[styles.weightAddBtn, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="add" size={16} color={theme.primaryDark} />
            <ThemedText type="smallBold" style={{ color: theme.primaryDark, fontSize: 13 }}>
              Kilo ekle
            </ThemedText>
          </Pressable>
        </View>
        {weightPoints.length >= 2 ? (
          <WeeklyProgressChart data={weightPoints} highlightIndex={weightPoints.length - 1} />
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.four, gap: Spacing.two }}>
            <Ionicons name="trending-down-outline" size={28} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 13 }}>
              {weightPoints.length === 1
                ? 'Grafiğin oluşması için bir tartım daha ekle.'
                : 'Kilonu düzenli ekleyerek değişimini buradan takip et.'}
            </ThemedText>
          </View>
        )}
      </Card>

      {/* Plan özeti */}
      {profile && (
        <Card style={{ gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Ionicons name="nutrition-outline" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              Günlük planın
            </ThemedText>
          </View>
          <View style={styles.statsRow}>
            <PlanStat label="Kalori" value={profile.plan.calorieGoal} color={theme.calorie} />
            <PlanStat label="Protein" value={profile.plan.protein} color={theme.protein} />
            <PlanStat label="Karb" value={profile.plan.carbs} color={theme.carbs} />
            <PlanStat label="Yağ" value={profile.plan.fat} color={theme.fat} />
          </View>
        </Card>
      )}

      {/* Hedefe ilerleme */}
      <Card style={{ gap: Spacing.two }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText type="smallBold" style={{ fontSize: 15 }}>
            Hedefe ilerleme
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {remaining} kg kaldı
          </ThemedText>
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.fill, { backgroundColor: theme.primary, width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12 }}>
          {toDisplayWeight(startWeight, weightUnit)} {wl} → {toDisplayWeight(targetWeight, weightUnit)} {wl} · %{Math.round(progress * 100)} tamamlandı
        </ThemedText>
      </Card>

      {/* Ayarlar — bölümlere ayrılmış */}
      {SETTING_SECTIONS.map((section) => (
        <View key={section.titleKey} style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 13, paddingLeft: Spacing.one }}>
            {t(section.titleKey)}
          </ThemedText>
          <Card padded={false}>
            {section.items.map((item, i) => (
              <Pressable key={item.labelKey} onPress={() => item.route && router.push(item.route)}>
                <View
                  style={[
                    styles.settingRow,
                    i < section.items.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}>
                  <View style={[styles.settingIcon, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name={item.icon} size={18} color={theme.text} />
                  </View>
                  <ThemedText type="small" style={{ flex: 1, fontSize: 15 }}>
                    {t(item.labelKey)}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </View>
              </Pressable>
            ))}
          </Card>
        </View>
      ))}

      {/* Çıkış */}
      {user && (
        <Pressable
          onPress={() => {
            flagReturningToLogin();
            signOut();
          }}
          style={[styles.logoutBtn, { borderColor: theme.border }]}>
          <Ionicons name="log-out-outline" size={18} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 15 }}>
            {t('profile.logout')}
          </ThemedText>
        </Pressable>
      )}

      <ThemedText type="small" themeColor="textMuted" style={{ textAlign: 'center', fontSize: 12 }}>
        FrozFit · v0.1.0
      </ThemedText>

      <WeightModal
        visible={weightModal}
        initial={currentWeight}
        unit={weightUnit}
        onClose={() => setWeightModal(false)}
        onSave={saveWeight}
      />
    </Screen>
  );
}

/** Bugünün kilosunu girmek için basit modal. Giriş seçili birimde; kayıt kg olarak yapılır. */
function WeightModal({
  visible,
  initial,
  unit,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: number; // kg
  unit: WeightUnit;
  onClose: () => void;
  onSave: (kg: number) => void;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(String(toDisplayWeight(initial, unit)));
  const [busy, setBusy] = useState(false);

  // Modal her açıldığında mevcut kilodan (seçili birimde) başlat.
  useEffect(() => {
    if (visible) setValue(String(toDisplayWeight(initial, unit)));
  }, [visible, initial, unit]);

  const num = Number(value.replace(',', '.'));
  const kg = fromDisplayWeight(num, unit);
  const valid = kg >= 30 && kg <= 300;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    await onSave(Math.round(kg * 10) / 10);
    setBusy(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.weightSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <ThemedText type="subtitle" style={{ fontSize: 18 }}>
            Bugünkü kilon
          </ThemedText>
          <View style={[styles.weightInput, { backgroundColor: theme.backgroundElement }]}>
            <TextInput
              value={value}
              onChangeText={(t) => setValue(t.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              autoFocus
              style={[styles.weightInputText, { color: theme.text }]}
            />
            <ThemedText type="smallBold" themeColor="textSecondary">
              {weightLabel(unit)}
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Pressable onPress={onClose} style={[styles.weightBtn, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Vazgeç
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!valid || busy}
              style={[styles.weightBtn, { backgroundColor: theme.primary, opacity: valid ? 1 : 0.5, flex: 1 }]}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 15 }}>
                  Kaydet
                </ThemedText>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActivityTile({
  icon,
  value,
  label,
  hint,
  color,
}: {
  icon: any;
  value: string;
  label: string;
  hint: string;
  color: string;
}) {
  return (
    <Card style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <ThemedText style={{ fontSize: 22, fontWeight: '700' }}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
        {label}
      </ThemedText>
      <ThemedText type="small" style={{ fontSize: 11, color }}>
        {hint}
      </ThemedText>
    </Card>
  );
}

function PlanStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2, flex: 1 }}>
      <ThemedText type="smallBold" style={{ color, fontSize: 17 }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.one,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  premiumIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  upgradeBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    position: 'absolute',
    right: 0,
    top: '15%',
    height: '70%',
    width: StyleSheet.hairlineWidth,
  },
  track: {
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  weightAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  weightSheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    height: 64,
    borderRadius: Radius.md,
  },
  weightInputText: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    height: '100%',
  },
  weightBtn: {
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
