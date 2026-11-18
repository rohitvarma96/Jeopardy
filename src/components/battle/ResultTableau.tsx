import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { getFighter } from '../../data/fighters';
import type { RewardRecord } from '../../game/rewards';
import type { PlayerProfile } from '../../game/types/player';
import { useSceneMotion } from '../../hooks/useBattleMotion';
import { FighterArt } from '../fighters/FighterArt';
import { AppText } from '../ui';
import { SceneText, worldColors } from '../world/SceneControls';

// Only the latest live result is eligible; history and repeated entry are receipts.
let lastCelebratedMatch: string | null = null;
const clamp = (value: number) => {
  'worklet';
  return Math.max(0, Math.min(1, value));
};

export function ResultTableau({ record, fresh, account }: {
  record: RewardRecord; fresh: boolean; account?: PlayerProfile;
}) {
  const { enabled, ready } = useSceneMotion();
  const forfeit = record.outcome.reason === 'forfeit', won = record.outcome.winner === 'player';
  const animate = fresh && !forfeit;
  const progress = useSharedValue(animate ? 0 : 1);
  const played = useRef(false);
  const [size, setSize] = useState({ width: 300, height: 240 });
  useEffect(() => {
    cancelAnimation(progress);
    if (!ready) {
      if (played.current) progress.set(1);
      return;
    }
    if (played.current) { progress.set(1); return; }
    played.current = true;
    const first = animate && lastCelebratedMatch !== record.matchId;
    if (animate) lastCelebratedMatch = record.matchId;
    progress.set(first && enabled ? 0 : 1);
    if (first && enabled) progress.set(withTiming(1, { duration: won ? 820 : 520, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(progress);
  }, [animate, enabled, ready, record.matchId, won, progress]);
  const fighter = getFighter(record.fighters[record.outcome.winner].fighterId);
  const artHeight = Math.max(1, Math.min(size.height - 8, size.width * 1.4));
  const wordSize = Math.max(26, Math.min(82, size.width * .24, size.height * .3));
  const wordTop = Math.max(12, size.height - artHeight + artHeight * .29);
  const banner = useAnimatedStyle(() => {
    const p = clamp(progress.get() / .4);
    return { opacity: .35 + p * .65, transform: [{ translateX: (1 - p) * -36 }, { rotate: '-7deg' }] };
  });
  const portrait = useAnimatedStyle(() => {
    const p = clamp((progress.get() - .08) / .64);
    return { opacity: .3 + p * .7, transform: [{ translateX: (1 - p) * (won ? 26 : 9) }] };
  });
  const word = useAnimatedStyle(() => {
    const p = clamp((progress.get() - .08) / .3);
    return { opacity: .3 + p * .7, transform: [{ scale: 1.16 - p * .16 }, { rotate: '-5deg' }] };
  });
  const receipt = useAnimatedStyle(() => ({
    opacity: .6 + clamp((progress.get() - .38) / .62) * .4,
    transform: [{ translateY: (1 - clamp((progress.get() - .38) / .62)) * 8 }],
  }));
  const after = account ? account.xp / account.xpForNextLevel : 0;
  const before = account && record.levelBefore === record.levelAfter
    ? Math.max(0, account.xp - record.xp) / account.xpForNextLevel : 0;
  const fill = useAnimatedStyle(() => ({
    width: `${(before + (after - before) * clamp((progress.get() - .45) / .55)) * 100}%`,
  }));
  const accuracy = Math.round(record.fighters.player.stats.correct / Math.max(1,
    record.fighters.player.stats.correct + record.fighters.player.stats.wrong + record.fighters.player.stats.timeouts) * 100);
  const title = forfeit ? won ? 'WON BY FORFEIT' : 'FORFEIT' : won ? 'VICTORY' : 'DEFEAT';
  return <View style={styles.root}>
    <View testID="result-tableau" style={styles.poster} onLayout={event => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) setSize(current => current.width === width && current.height === height ? current : { width, height });
    }}>
      <View pointerEvents="none" style={styles.silhouette} />
      <Animated.View pointerEvents="none" style={[styles.ink, {
        top: wordTop - 8, height: wordSize * 1.15,
        backgroundColor: won && !forfeit ? worldColors.acid : worldColors.pink,
      }, banner]} />
      <View pointerEvents="none" style={styles.ground} />
      <Animated.View style={[styles.portrait, portrait]}>
        <FighterArt fighterId={fighter.id} height={artHeight} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.headline, { top: wordTop }, word]}>
        <AppText accessibilityRole="header" accessibilityLabel={title} allowFontScaling={false}
          style={[styles.title, { fontSize: forfeit ? wordSize * .65 : wordSize, lineHeight: wordSize * 1.04 }]}>{title}</AppText>
      </Animated.View>
      <View style={styles.identity}>
        <AppText maxFontSizeMultiplier={1.2} style={styles.winnerName}>{fighter.name.toUpperCase()}</AppText>
        <AppText allowFontScaling={false} style={styles.micro}>{won ? 'YOUR BRAWLER' : 'RIVAL BRAWLER'} / SAVED RESULT</AppText>
      </View>
    </View>
    <SceneText>{won ? 'You defeated' : 'You lost to'} {record.fighters.opponent.name}</SceneText>
    <View style={styles.scoreboard}>
      {[['DAMAGE', record.fighters.player.score], ['ACCURACY', `${accuracy}%`], ['BEST COMBO', record.fighters.player.bestCombo]].map(([label, value]) =>
        <View key={label} style={styles.stat}><AppText allowFontScaling={false} style={styles.value}>{value}</AppText>
          <AppText allowFontScaling={false} style={styles.micro}>{label}</AppText></View>)}
    </View>
    <Animated.View testID="saved-result-receipt" style={[styles.receipt, receipt]}>
      <SceneText>+{record.xp} XP / +{record.coins} coins</SceneText>
      <AppText maxFontSizeMultiplier={1.2} style={styles.savedLevel}>{forfeit ? 'FORFEIT / NO REWARD CHEST'
        : record.levelAfter > record.levelBefore ? `LEVEL ${record.levelBefore} -> ${record.levelAfter} / SAVED` : `SAVED / LEVEL ${record.levelAfter}`}</AppText>
      {account ? <View accessible accessibilityRole="progressbar" accessibilityLabel="Saved account XP"
        aria-valuemin={0} aria-valuemax={account.xpForNextLevel} aria-valuenow={account.xp}
        aria-valuetext={`Level ${account.level}: ${account.xp} of ${account.xpForNextLevel} XP`}
        accessibilityValue={{ min: 0, max: account.xpForNextLevel, now: account.xp, text: `Level ${account.level}: ${account.xp} of ${account.xpForNextLevel} XP` }}>
        <View style={styles.track}><Animated.View testID="saved-xp-fill" style={[styles.fill, fill]} /></View>
        <AppText allowFontScaling={false} style={styles.micro}>{account.xp} / {account.xpForNextLevel} XP TO LEVEL {account.level + 1}</AppText>
      </View> : null}
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, gap: 7 },
  poster: { flex: 1, minHeight: 88, overflow: 'hidden' },
  silhouette: { position: 'absolute', top: '8%', bottom: '5%', left: '12%', right: '2%', backgroundColor: '#FF287B0F', transform: [{ skewX: '-12deg' }] },
  ink: { position: 'absolute', left: '-7%', width: '87%' },
  ground: { position: 'absolute', bottom: 1, right: '9%', width: '62%', height: 7, borderRadius: 100, backgroundColor: '#050811B0' },
  portrait: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '84%', alignItems: 'center', justifyContent: 'flex-end' },
  headline: { position: 'absolute', left: '3%', right: '2%' },
  title: { color: worldColors.paper, fontFamily: 'Bangers', textShadowColor: worldColors.ink, textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 1 },
  identity: { position: 'absolute', left: 0, bottom: '8%', maxWidth: '68%', padding: 5, borderLeftWidth: 3, borderLeftColor: worldColors.pink, backgroundColor: '#10131ADC' },
  winnerName: { color: worldColors.paper, fontFamily: 'BarlowCondensed-ExtraBold', fontSize: 24, lineHeight: 26 },
  micro: { color: worldColors.muted, fontFamily: 'SpaceMono-Regular', fontSize: 8, lineHeight: 13 },
  scoreboard: { flexDirection: 'row', gap: 6, borderTopWidth: 1, borderTopColor: '#677183', paddingTop: 6 },
  stat: { flex: 1, alignItems: 'center' },
  value: { color: worldColors.paper, fontFamily: 'BarlowCondensed-ExtraBold', fontSize: 27, lineHeight: 29 },
  receipt: { gap: 4, paddingBottom: 3 },
  savedLevel: { color: worldColors.acid, fontFamily: 'SpaceMono-Regular', fontSize: 10, lineHeight: 15 },
  track: { height: 4, backgroundColor: '#050811', overflow: 'hidden', marginBottom: 3 },
  fill: { height: '100%', backgroundColor: worldColors.acid },
});
