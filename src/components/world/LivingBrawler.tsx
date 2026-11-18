import { BlurMask, Canvas, Circle, Group, Line, Oval, Path, vec } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { humanFighters } from '../../assets/human-fighters';
import { getFighter } from '../../data/fighters';
import type { FighterId } from '../../game/types/fighter';
import { useAmbientClock } from '../../hooks/useAmbientClock';
import { useBattleMotion } from '../../hooks/useBattleMotion';
import { SceneAtmosphere } from '../atmosphere/SceneAtmosphere';
import { AMBIENT_PERIOD_MS } from '../atmosphere/motion';
import { FighterArt } from '../fighters/FighterArt';
import { HumanCombatArt } from '../fighters/HumanCombatArt';
import { COMBAT_ROSTER } from '../fighters/combat/roster';
import { PAINTED_ANATOMY } from '../fighters/combat/painted-mesh';

function Signature({ fighterId, time }: { fighterId: FighterId; time: SharedValue<number> }) {
  const art = humanFighters[fighterId], anatomy = PAINTED_ANATOMY[fighterId];
  const hand = anatomy.attachment
    ? [(anatomy.attachment.bounds[0] + anatomy.attachment.bounds[2]) / 2, (anatomy.attachment.bounds[1] + anatomy.attachment.bounds[3]) / 2]
    : anatomy.frontArm[3];
  const x = 260 + (hand[0] - .5) * 480 * art.width / art.height, y = 66 + hand[1] * 480;
  const accent = COMBAT_ROSTER[fighterId].accent;
  const opacity = useDerivedValue(() => .12 + (1 - Math.cos(time.get() / 6000 * Math.PI * 2)) * .14);
  const turn = useDerivedValue(() => [
    { translateX: x }, { translateY: y }, { rotate: time.get() / AMBIENT_PERIOD_MS * Math.PI * 8 },
  ]);
  const sparkleX = useDerivedValue(() => x + Math.cos(time.get() / 6000 * Math.PI * 2) * 18);
  const sparkleY = useDerivedValue(() => y + Math.sin(time.get() / 6000 * Math.PI * 2) * 8);
  const emberY = useDerivedValue(() => y - (time.get() % 6000) / 6000 * 24);
  const emberFade = useDerivedValue(() => Math.sin((time.get() % 6000) / 6000 * Math.PI) ** 2 * .7);
  if (fighterId === 'arcane' || fighterId === 'frost') return <Group opacity={opacity}>
    <Group transform={turn}>
      <Oval x={-18} y={-8} width={36} height={16} color={accent} style="stroke" strokeWidth={.9} />
      {fighterId === 'frost' ? <Oval x={-13} y={-5} width={26} height={10} color={accent} style="stroke" strokeWidth={.7} /> : null}
    </Group>
    <Circle cx={sparkleX} cy={sparkleY} r={1.8} color="#F1F0E8" />
  </Group>;
  if (fighterId === 'ember') return <Group>
    <Circle cx={x} cy={y} r={7} color={accent} opacity={opacity}><BlurMask blur={5} style="normal" /></Circle>
    <Circle cx={x + 5} cy={emberY} r={1.4} color="#FFD68D" opacity={emberFade} />
    <Circle cx={x - 6} cy={sparkleY} r={.9} color={accent} opacity={opacity} />
  </Group>;
  if (fighterId === 'sylva') return <Group opacity={opacity} transform={turn}>
    <Path path="M-19 0 Q-24 -6 -27 -1 Q-24 5 -19 0Z" color={accent} />
    <Circle cx={12} cy={-5} r={1.4} color={accent} />
  </Group>;
  if (fighterId === 'titan') return <Group opacity={opacity}>
    <Line p1={vec(x - 7, y - 28)} p2={vec(x + 2, y + 23)} color={accent} strokeWidth={1.3} />
    <Circle cx={x} cy={y} r={4} color={accent}><BlurMask blur={5} style="normal" /></Circle>
  </Group>;
  return <Group opacity={opacity}>
    <Circle cx={x} cy={y - 12} r={4} color={accent}><BlurMask blur={4} style="normal" /></Circle>
    <Line p1={vec(x - 3, y - 12)} p2={vec(x + 3, y - 12)} color={accent} strokeWidth={1} />
  </Group>;
}

function AnimatedBrawler({ fighterId, width, height, artHeight }: {
  fighterId: FighterId; width: number; height: number; artHeight: number;
}) {
  const time = useAmbientClock(true);
  const [ready, setReady] = useState(false);
  const loaded = useCallback(() => setReady(true), []);
  const scale = artHeight / 480;
  return <View testID="arena-living-canvas" style={StyleSheet.absoluteFill} pointerEvents="none" accessible accessibilityRole="image"
    accessibilityLabel={`${getFighter(fighterId).name} artwork`}>
    <Canvas style={{ width, height }} accessible={false}>
      <SceneAtmosphere width={width} height={height} time={time} kind="arena" enabled />
      <Oval x={width * .24} y={height - 7} width={width * .52} height={8} color="#050811" opacity={.75}>
        <BlurMask blur={3} style="normal" />
      </Oval>
      <Group transform={[{ translateX: width / 2 }, { translateY: height - artHeight },
        { scale }, { translateX: -260 }, { translateY: -66 }]}>
        <HumanCombatArt fighterId={fighterId} mode="lobby" clock={time} onLoad={loaded} />
        <Signature fighterId={fighterId} time={time} />
      </Group>
    </Canvas>
    {!ready ? <View testID="brawler-loading-art" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.fallback}>
      <FighterArt fighterId={fighterId} height={artHeight} />
    </View> : null}
  </View>;
}

export function LivingBrawler(props: { fighterId: FighterId; width: number; height: number; artHeight: number }) {
  const enabled = useBattleMotion();
  return enabled ? <AnimatedBrawler key={props.fighterId} {...props} />
    : <FighterArt fighterId={props.fighterId} height={props.artHeight} />;
}

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-end' },
});
