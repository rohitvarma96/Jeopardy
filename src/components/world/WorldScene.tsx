import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Image, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { battleAssets } from '../../assets/registry';
import { useBattleMotion } from '../../hooks/useBattleMotion';
import { usePlayerStore } from '../../store/player-store';
import { useBattleStore } from '../../features/battle/store';
import { routes } from '../../navigation/routes';
import { volt } from '../../theme';
import { BrandLogo } from '../brand/BrandLogo';
import { AppText } from '../ui';
import { PlayerDataNotice } from '../player/PlayerDataNotice';
import { SceneText, SigilButton, worldColors } from './SceneControls';
import { WorldIcon } from './WorldIcon';

export function SceneEntrance({ children, style, eventKey = 'scene' }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; eventKey?: string;
}) {
  const motion = useBattleMotion();
  const progress = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = motion ? 0 : 1;
    if (motion) progress.value = withTiming(1, { duration: 260 });
    return () => cancelAnimation(progress);
  }, [motion, eventKey, progress]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + progress.value * 0.35,
    transform: [{ translateX: (1 - progress.value) * -18 }, { rotate: `${(1 - progress.value) * -0.5}deg` }],
  }));
  return <Animated.View testID="scene-entrance" style={[styles.entrance, animatedStyle, style]}>{children}</Animated.View>;
}

export function WorldScene({ title, children, footer, onBack, backLabel = 'Back to Arena', tab = false, utilities = true, notices = true, recoveryAction, entrance = true }: {
  title: string; children: ReactNode; footer?: ReactNode; onBack?: () => void;
  backLabel?: string; tab?: boolean; utilities?: boolean; notices?: boolean;
  recoveryAction?: ReactNode;
  entrance?: boolean;
}) {
  const router = useRouter();
  const { height, width, fontScale } = useWindowDimensions();
  const compact = height < 720 || fontScale >= 1.5;
  const ready = usePlayerStore((state) => state.status === 'ready');
  const error = usePlayerStore((state) => state.error);
  const matches = usePlayerStore((state) => state.matches);
  const battle = useBattleStore((state) => state.battle);
  const profile = usePlayerStore((state) => state.profile);
  const unsaved = !!battle?.outcome && !matches.some((match) => match.matchId === battle.setup.matchId);
  const recovery = notices && (!ready || !!error || unsaved);
  return <SafeAreaView testID="world-scene" edges={tab ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']} style={styles.screen}>
    <Image source={battleAssets.arena.source} resizeMode="cover" accessible={false}
      style={[StyleSheet.absoluteFill, styles.backdrop]} />
    <View pointerEvents="none" style={styles.scrim} />
    <View pointerEvents="none" style={[styles.paint, width > 800 && { left: '50%' }]} />
    <View style={[styles.layout, compact && styles.compact]}>
      <View style={styles.top}>
        {onBack ? <SigilButton icon="back" label={backLabel} onPress={onBack} /> : <BrandLogo width={compact ? 100 : 126} />}
        <View style={styles.topTitle}>
          <AppText accessibilityRole="header" maxFontSizeMultiplier={1.2}
            accessibilityLabel={title} style={styles.title}>{title.toUpperCase()}</AppText>
          {!compact && width >= 600 ? <AppText variant="caption" style={styles.kicker}>THE RELAY / LOCAL PLAY</AppText> : null}
        </View>
        {utilities ? <>
          {ready && width >= 360 ? <View style={styles.balances}>
            <View accessible accessibilityLabel={`Coins: ${profile.coins}`} style={styles.balance}><WorldIcon name="coin" size={14} color={worldColors.acid} /><SceneText>{profile.coins.toLocaleString()}</SceneText></View>
            <View accessible accessibilityLabel={`Shards: ${profile.shards}`} style={styles.balance}><WorldIcon name="shard" size={14} color={worldColors.pink} /><SceneText>{profile.shards}</SceneText></View>
          </View> : null}
          <SigilButton icon="settings" label="Settings" onPress={() => router.push(routes.settings)} />
        </> : null}
      </View>
      <View style={styles.bodyClip}>
        {recovery ? <View style={styles.recovery}><PlayerDataNotice />{recoveryAction}</View>
          : entrance ? <SceneEntrance eventKey={title} style={styles.body}>{children}</SceneEntrance>
            : <View style={styles.body}>{children}</View>}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: worldColors.ink },
  backdrop: { width: '100%', height: '100%', opacity: 0.56 },
  scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#090D1690' },
  paint: { position: 'absolute', left: '19%', top: '8%', width: '63%', height: '70%', backgroundColor: '#FF287B19', transform: [{ rotate: '-13deg' }] },
  layout: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, gap: 10 },
  compact: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 6, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  topTitle: { flex: 1, minWidth: 0 },
  title: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 22, lineHeight: 25 },
  kicker: { color: worldColors.muted, fontSize: 8, letterSpacing: 0.6 },
  balances: { gap: 1 },
  balance: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  body: { flex: 1, minHeight: 0 },
  bodyClip: { flex: 1, minHeight: 0, overflow: 'hidden' },
  recovery: { flex: 1, minHeight: 0, justifyContent: 'center' },
  entrance: { flex: 1, minHeight: 0 },
  footer: { gap: 8, flexShrink: 0 },
});
