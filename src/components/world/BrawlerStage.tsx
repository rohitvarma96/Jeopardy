import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { FighterId } from '../../game/types/fighter';
import { FighterArt } from '../fighters/FighterArt';
import { LivingBrawler } from './LivingBrawler';
import { SagePerformance, type BrawlerPerformanceHandle } from './SagePerformance';

export function BrawlerStage({ fighterId, mirror = false, animated = false, interactive = false, onInspect, ref }: {
  fighterId: FighterId; mirror?: boolean; animated?: boolean; interactive?: boolean; onInspect?: () => void;
  ref?: Ref<BrawlerPerformanceHandle>;
}) {
  const [size, setSize] = useState({ width: 180, height: 240 });
  const height = Math.max(1, Math.min(size.height - 4, size.width * 1.65));
  return <View testID="brawler-stage" style={styles.stage} onLayout={(event) => {
    const { width, height: measured } = event.nativeEvent.layout;
    if (width > 0 && measured > 0) setSize((current) => current.width === width && current.height === measured ? current : { width, height: measured });
  }}>
    <View pointerEvents="none" style={styles.orbit} />
    <View pointerEvents="none" style={styles.floor} />
    {interactive && fighterId === 'arcane' && !mirror
      ? <SagePerformance width={size.width} height={size.height} artHeight={height} allowed={animated} ref={ref} />
      : <Pressable disabled={!onInspect} accessibilityRole={onInspect ? 'button' : undefined}
        accessibilityLabel={onInspect ? 'Inspect Brawler' : undefined} onPress={onInspect}
        style={styles.presentation}>
        {animated && !mirror ? <LivingBrawler fighterId={fighterId} width={size.width} height={size.height} artHeight={height} />
          : <View style={mirror ? styles.mirror : undefined}><FighterArt fighterId={fighterId} height={height} /></View>}
      </Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  stage: { flex: 1, minHeight: 0, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end' },
  orbit: { position: 'absolute', width: '86%', aspectRatio: 1, borderRadius: 500, top: '9%', borderWidth: 1, borderColor: '#FF287B70', backgroundColor: '#FF287B0A' },
  floor: { position: 'absolute', bottom: 3, width: '72%', height: 12, borderRadius: 100, backgroundColor: '#050811BB', borderBottomWidth: 1, borderBottomColor: '#EEFA3660', transform: [{ scaleY: 0.6 }] },
  mirror: { transform: [{ scaleX: -1 }] },
  presentation: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-end' },
});
