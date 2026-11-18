import {
  BlurMask, Canvas, Group, Line, LinearGradient, Oval, RadialGradient, Rect, vec,
} from '@shopify/react-native-skia';
import { memo, useEffect, useRef } from 'react';
import {
  Easing, cancelAnimation, useDerivedValue, useSharedValue, withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { SIDES, type Side } from '../../game/battle';
import { humanAdvance, type HumanPose } from '../fighters/combat/human-rig';
import { HumanCombatArt } from '../fighters/HumanCombatArt';
import { COMBAT_ROSTER } from '../fighters/combat/roster';
import type { CombatPresentation } from './combatPresentation';
import { SceneAtmosphere } from '../atmosphere/SceneAtmosphere';
import { useAmbientClock } from '../../hooks/useAmbientClock';
import { actorPosition, type StageGeometry } from './combatGeometry';
import { koFrame, presentedPose } from './signature-motion';
import { SignatureHit } from './SignatureHit';

export type CombatClock = { elapsed: SharedValue<number>; idle: SharedValue<number> };
export { actorPosition, type StageGeometry } from './combatGeometry';

export function useCombatClock(presentation: CombatPresentation, motionEnabled: boolean, motionReady = true): CombatClock {
  const elapsed = useSharedValue(0);
  const idle = useSharedValue(0);
  const { key, endMs, finished } = presentation;
  const context = useRef({ key, started: false, settled: false });
  useEffect(() => {
    cancelAnimation(elapsed);
    if (context.current.key !== key) {
      context.current = { key, started: false, settled: false };
      elapsed.set(0);
    }
    if (!motionReady) {
      if (context.current.started) { context.current.settled = true; elapsed.set(endMs); }
    } else if (!motionEnabled) {
      context.current.settled = true;
      elapsed.set(endMs);
    } else if (context.current.settled) {
      elapsed.set(endMs);
    } else {
      context.current.started = true;
      const remaining = Math.max(0, endMs - elapsed.get());
      elapsed.set(remaining > 0 ? withTiming(endMs, { duration: remaining, easing: Easing.linear }) : endMs);
    }
    return () => cancelAnimation(elapsed);
  }, [key, endMs, elapsed, motionEnabled, motionReady]);
  useEffect(() => {
    cancelAnimation(idle);
    idle.value = 0;
    if (motionEnabled && !finished) {
      idle.value = withRepeat(withTiming(3000, { duration: 3000, easing: Easing.linear }), -1, false);
    }
    return () => cancelAnimation(idle);
  }, [idle, motionEnabled, finished]);
  return { elapsed, idle };
}

function Actor({ side, presentation, geometry, clock, motionEnabled }: {
  side: Side; presentation: CombatPresentation; geometry: StageGeometry; clock: CombatClock; motionEnabled: boolean;
}) {
  const fighterId = presentation.fighters[side];
  const commands = presentation.commands[side];
  const position = actorPosition(side, geometry);
  const { elapsed, idle } = clock;
  const opponentPosition = actorPosition(side === 'player' ? 'opponent' : 'player', geometry);
  const advance = humanAdvance(Math.abs(position.x - opponentPosition.x) / position.scale);
  const defeatedAt = presentation.defeats[side];
  const pose = useDerivedValue<HumanPose>(() => presentedPose(
    fighterId, commands, elapsed.get(), idle.get(), advance, motionEnabled, defeatedAt,
  ));
  return <Group transform={[
    { translateX: position.x }, { translateY: position.ground },
    { scaleX: position.direction * position.scale }, { scaleY: position.scale },
    { translateX: -260 }, { translateY: -540 },
  ]}>
    <HumanCombatArt fighterId={fighterId} pose={pose}
      defeat={defeatedAt === undefined ? undefined : { atMs: defeatedAt, elapsed, motionEnabled }} />
  </Group>;
}

function ActorShadow({ side, geometry, presentation, clock, motionEnabled }: {
  side: Side; geometry: StageGeometry; presentation: CombatPresentation; clock: CombatClock; motionEnabled: boolean;
}) {
  const atMs = presentation.defeats[side], position = actorPosition(side, geometry);
  const opacity = useDerivedValue(() => atMs === undefined ? 1 : koFrame(clock.elapsed.get() - atMs, motionEnabled).shadow);
  return <Group opacity={opacity}>
    <Oval x={position.x - geometry.fighterHeight * .2} y={position.ground - 3}
      width={geometry.fighterHeight * .4} height={8} color="#03070B" opacity={.8}>
      <BlurMask blur={3} style="normal" />
    </Oval>
    <Line p1={vec(position.x - 12, position.ground + 2)} p2={vec(position.x + 12, position.ground + 2)}
      color={COMBAT_ROSTER[presentation.fighters[side]].accent} opacity={.25} />
  </Group>;
}

function Floor({ geometry, presentation, clock, motionEnabled }: {
  geometry: StageGeometry; presentation: CombatPresentation; clock: CombatClock; motionEnabled: boolean;
}) {
  const { width, height } = geometry;
  const ground = actorPosition('player', geometry).ground;
  return <Group>
    <Rect x={0} y={0} width={width} height={height}>
      <LinearGradient start={vec(0, 0)} end={vec(0, height)}
        colors={['#10142330', '#14152955', '#0B101DD9']} positions={[0, 0.65, 1]} />
    </Rect>
    {SIDES.map(side => <ActorShadow key={side} side={side} geometry={geometry}
      presentation={presentation} clock={clock} motionEnabled={motionEnabled} />)}
    {Array.from({ length: 9 }, (_, i) => <Line key={i}
      p1={vec(width * (0.14 + i * 0.09), ground + 4)}
      p2={vec(width * (0.14 + i * 0.09) + 3, ground + 7)} color="#EAD6A2" strokeWidth={1} opacity={0.3} />)}
  </Group>;
}

export const CombatStage = memo(function CombatStage({ presentation, geometry, clock, motionEnabled }: {
  presentation: CombatPresentation; geometry: StageGeometry; clock: CombatClock; motionEnabled: boolean;
}) {
  const ambienceEnabled = motionEnabled && !presentation.finished;
  const ambience = useAmbientClock(ambienceEnabled);
  return <Canvas testID="combat-skia-canvas" style={{ width: geometry.width, height: geometry.height }} accessible={false}>
    <Floor geometry={geometry} presentation={presentation} clock={clock} motionEnabled={motionEnabled} />
    <SceneAtmosphere width={geometry.width} height={geometry.height} time={ambience} kind="battle" enabled={ambienceEnabled} />
    {SIDES.map((side) => <Actor key={`${side}-${presentation.fighters[side]}`} side={side}
      presentation={presentation} geometry={geometry} clock={clock} motionEnabled={motionEnabled} />)}
    {motionEnabled ? presentation.cues.map(cue => <SignatureHit key={cue.key} cue={cue}
      presentation={presentation} geometry={geometry} elapsed={clock.elapsed} />) : null}
    <Rect x={0} y={0} width={geometry.width} height={geometry.height}>
      <RadialGradient c={vec(geometry.width / 2, geometry.height * 0.52)}
        r={geometry.width * 0.7} colors={['#0B0F1A00', '#080B1555']} />
    </Rect>
  </Canvas>;
}, (before, after) =>
  before.presentation.key === after.presentation.key &&
  before.presentation.fighters.player === after.presentation.fighters.player &&
  before.presentation.fighters.opponent === after.presentation.fighters.opponent &&
  before.geometry.width === after.geometry.width &&
  before.geometry.height === after.geometry.height &&
  before.geometry.fighterHeight === after.geometry.fighterHeight &&
  before.presentation.finished === after.presentation.finished &&
  before.clock.elapsed === after.clock.elapsed && before.clock.idle === after.clock.idle &&
  before.motionEnabled === after.motionEnabled,
);
