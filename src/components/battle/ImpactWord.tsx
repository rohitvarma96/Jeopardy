import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AppText } from '../ui';
import type { CombatCue } from './combatFeedback';

export function ImpactWord({ cue, elapsed, motionEnabled, height, top, study = false, untilMs }: {
  cue: CombatCue; elapsed: SharedValue<number>; motionEnabled: boolean; height: number; top: number; study?: boolean; untilMs?: number;
}) {
  const animation = useAnimatedStyle(() => {
    const time = elapsed.value - cue.contactMs;
    const visible = time >= 0 && (untilMs === undefined || elapsed.value < untilMs) && (cue.finishing || time < 500);
    const pop = Math.max(0, Math.min(1, time / 95));
    return {
      opacity: motionEnabled ? visible ? cue.finishing ? 1 : Math.min(1, (500 - time) / 150) : 0 : 1,
      transform: [
        { scale: motionEnabled ? 1.28 - Math.sin(pop * Math.PI / 2) * .28 : 1 },
        { rotate: '-7deg' },
      ],
    };
  });
  if (!study && !cue.blocked && cue.damage <= 0) return null;
  const label = cue.blocked ? 'BLOCK' : cue.finishing ? 'KO' : 'STRIKE';
  const size = Math.max(24, Math.min(cue.finishing ? 76 : 52, height * (cue.finishing ? .25 : .24)));
  return <Animated.View testID={`impact-word-${cue.key}`} pointerEvents="none"
    accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
    style={[styles.container, { top }, animation]}>
    <View style={styles.stamp}>
      <View style={[styles.plate, { width: size * (cue.finishing ? 1.65 : 3.15), height: size * .85 },
        cue.blocked && styles.blockPlate, cue.finishing && styles.koPlate]} />
      <AppText allowFontScaling={false} style={[styles.word, { fontSize: size, lineHeight: size * 1.1 },
        cue.blocked && styles.block, cue.finishing && styles.ko]}>{label}</AppText>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  container: { position: 'absolute', width: '100%', alignItems: 'center' },
  stamp: { alignItems: 'center', justifyContent: 'center' },
  plate: { position: 'absolute', backgroundColor: '#10131AE8', borderBottomWidth: 3, borderBottomColor: '#FF287B', transform: [{ skewX: '-12deg' }, { rotate: '-2deg' }] },
  blockPlate: { borderBottomColor: '#9CE2EF' },
  koPlate: { backgroundColor: '#FF354F', borderBottomColor: '#E9FF3C' },
  word: {
    fontFamily: 'Bangers', color: '#F1F0E8', letterSpacing: 2,
    textShadowColor: '#11141D', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 2,
  },
  block: { color: '#9CE2EF' },
  ko: { color: '#E9FF3C', textShadowColor: '#BC1938' },
});
