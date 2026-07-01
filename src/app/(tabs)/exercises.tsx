import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchExerciseVideoUrl, isVideoEnabled, videoQueryFor } from '@/lib/exercise-video';
import {
  EXERCISE_GROUPS,
  type ExerciseGroup,
  type ExerciseMove,
  dailyWorkout,
  frameUrl,
} from '@/lib/exercises';

export default function ExercisesScreen() {
  const theme = useTheme();
  const [groupId, setGroupId] = useState<string>(EXERCISE_GROUPS[0].id);
  const [active, setActive] = useState<ExerciseMove | null>(null);

  const daily = dailyWorkout();
  const activeGroup = EXERCISE_GROUPS.find((g) => g.id === groupId) ?? EXERCISE_GROUPS[0];

  return (
    <Screen>
      <View>
        <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 32 }}>
          Egzersizler
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Telifsiz gösterimlerle evde antrenman yap
        </ThemedText>
      </View>

      {/* Günün antrenmanı */}
      <Card style={{ gap: Spacing.three }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <View style={[styles.dailyIcon, { backgroundColor: theme.accent + '22' }]}>
            <Ionicons name="flame" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>
              Günün antrenmanı
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              {daily.groupTitle} · {daily.moves.length} hareket
            </ThemedText>
          </View>
        </View>
        {daily.moves.map((m) => (
          <MoveRow key={`daily-${m.id}`} move={m} color={theme.accent} onPress={() => setActive(m)} />
        ))}
      </Card>

      {/* Kategori seçimi */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.two, paddingVertical: Spacing.one }}>
        {EXERCISE_GROUPS.map((g) => {
          const on = g.id === groupId;
          const c = theme[g.color];
          return (
            <Pressable
              key={g.id}
              onPress={() => setGroupId(g.id)}
              style={[styles.catChip, { backgroundColor: on ? c : theme.backgroundElement }]}>
              <Ionicons name={g.icon as any} size={16} color={on ? '#fff' : theme.textSecondary} />
              <ThemedText type="smallBold" style={{ fontSize: 13, color: on ? '#fff' : theme.text }}>
                {g.title}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Seçili kategori hareketleri */}
      <View style={{ gap: Spacing.three }}>
        {activeGroup.moves.map((m) => (
          <VideoCard key={m.id} move={m} group={activeGroup} onPress={() => setActive(m)} />
        ))}
      </View>

      <ThemedText type="small" themeColor="textMuted" style={{ fontSize: 12, textAlign: 'center' }}>
        Görseller telifsiz Free Exercise DB’den. Bir harekete dokun, animasyonlu gösterimi izle.
      </ThemedText>

      <ExerciseModal move={active} onClose={() => setActive(null)} />
    </Screen>
  );
}

const DEMO_HEIGHT = 240;

/** İki kareyi sırayla göstererek hareket animasyonu (fotoğraf yedeği). */
function AnimatedDemo({ dbId, height = DEMO_HEIGHT }: { dbId: string; height?: number }) {
  const theme = useTheme();
  const [frame, setFrame] = useState<0 | 1>(0);

  useEffect(() => {
    setFrame(0);
    const t = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 700);
    return () => clearInterval(t);
  }, [dbId]);

  return (
    <View style={{ height, backgroundColor: theme.backgroundElement, borderRadius: Radius.md, overflow: 'hidden' }}>
      <Image
        source={{ uri: frameUrl(dbId, frame) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
      />
    </View>
  );
}

/** Gerçek video oynatıcı (telifsiz Pixabay klibi). */
function VideoDemo({ url, height = DEMO_HEIGHT }: { url: string; height?: number }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ height, borderRadius: Radius.md, overflow: 'hidden' }}
      contentFit="cover"
      nativeControls
    />
  );
}

/**
 * Hareket gösterimi: video anahtarı varsa telifsiz video çekip oynatır;
 * yoksa / yüklenemezse fotoğraf animasyonuna düşer.
 */
function ExerciseDemo({ move }: { move: ExerciseMove }) {
  const theme = useTheme();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(isVideoEnabled());

  useEffect(() => {
    let alive = true;
    setVideoUrl(null);
    if (!isVideoEnabled()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchExerciseVideoUrl(videoQueryFor(move.dbId))
      .then((url) => {
        if (alive) setVideoUrl(url);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [move.dbId]);

  if (loading) {
    return (
      <View
        style={{
          height: DEMO_HEIGHT,
          backgroundColor: theme.backgroundElement,
          borderRadius: Radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (videoUrl) return <VideoDemo url={videoUrl} />;
  return <AnimatedDemo dbId={move.dbId} />;
}

/** Hareket detay modalı — gösterim + Türkçe bilgi. */
function ExerciseModal({ move, onClose }: { move: ExerciseMove | null; onClose: () => void }) {
  const theme = useTheme();
  const visible = move !== null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <View style={styles.modalHandle} />
          {move && (
            <>
              <ExerciseDemo move={move} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <ThemedText type="subtitle" style={{ fontSize: 20, flex: 1 }}>
                  {move.name}
                </ThemedText>
                <View style={[styles.amountPill, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText type="smallBold" style={{ fontSize: 14, color: theme.primaryDark }}>
                    {move.amount}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13 }}>
                {move.target}
              </ThemedText>
              <View style={[styles.tipRow, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="bulb-outline" size={18} color={theme.primary} style={{ marginTop: 1 }} />
                <ThemedText type="small" style={{ flex: 1, fontSize: 14 }}>
                  {move.tip}
                </ThemedText>
              </View>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 16 }}>
                  Tamam
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Büyük gösterim kartı — başlangıç karesi küçük resim + oynat rozeti. */
function VideoCard({ move, group, onPress }: { move: ExerciseMove; group: ExerciseGroup; onPress: () => void }) {
  const theme = useTheme();
  const color = theme[group.color];

  return (
    <Pressable onPress={onPress}>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <View style={styles.thumb}>
          <Image source={{ uri: frameUrl(move.dbId, 0) }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={[styles.playBtn, { backgroundColor: color }]}>
            <Ionicons name="play" size={24} color="#fff" />
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>
              {move.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              {move.target}
            </ThemedText>
          </View>
          <View style={[styles.amountPill, { backgroundColor: color + '22' }]}>
            <ThemedText type="smallBold" style={{ fontSize: 13, color }}>
              {move.amount}
            </ThemedText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

/** Kompakt satır (günün antrenmanı listesi). */
function MoveRow({ move, color, onPress }: { move: ExerciseMove; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.moveRow}>
      <Image source={{ uri: frameUrl(move.dbId, 0) }} style={styles.moveThumb} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <ThemedText type="small" style={{ fontSize: 14 }} numberOfLines={1}>
          {move.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
          {move.amount}
        </ThemedText>
      </View>
      <Ionicons name="play-circle" size={26} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dailyIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  thumb: {
    height: 160,
    backgroundColor: '#0001',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  amountPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  moveThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: '#0001',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: Spacing.one,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  closeBtn: {
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
