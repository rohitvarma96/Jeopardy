import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AppText } from '../ui';
import type { CombatCue } from './combatFeedback';

export function ImpactWord({ cue, elapsed, motionEnabled, height, study = false }: {
  cue: CombatCue; elapsed: SharedValue<number>; motionEnabled: boolean; height: number; study?: boolean;
}) {
  const animation = useAnimatedStyle(() => {
    const time = elapsed.value - cue.contactMs;
    const visible = time >= 0 && (cue.finishing || time < 740);
    const pop = Math.max(0, Math.min(1, time / 130));
    return {
      opacity: motionEnabled ? visible ? cue.finishing ? 1 : Math.min(1, (740 - time) / 180) : 0 : 1,
      transform: [
        { scale: motionEnabled ? 0.7 + Math.sin(pop * Math.PI / 2) * 0.4 : 1 },
        { rotate: '-7deg' },
      ],
    };
  });
  if (!study && !cue.blocked && cue.damage <= 0) return null;
  const label = cue.blocked ? 'BLOCK' : cue.finishing ? 'KO' : 'STRIKE';
  const size = Math.max(24, Math.min(cue.finishing ? 84 : 62, height * 0.3));
  return <Animated.View testID={`impact-word-${cue.key}`} pointerEvents="none"
    accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
    style={[styles.container, animation]}>
    <AppText allowFontScaling={false} style={[styles.word, { fontSize: size, lineHeight: size * 1.1 },
      cue.blocked && styles.block, cue.finishing && styles.ko]}>{label}</AppText>
  </Animated.View>;
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: '9%', width: '100%', alignItems: 'center' },
  word: {
    fontFamily: 'Bangers', color: '#F1F0E8', letterSpacing: 2,
    textShadowColor: '#11141D', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 2,
  },
  block: { color: '#9CE2EF' },
  ko: { color: '#E9FF3C', textShadowColor: '#BC1938' },
});
