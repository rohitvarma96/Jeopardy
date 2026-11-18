import {
  BlurMask, Canvas, Circle, Group, Line, LinearGradient, Oval, Path, RadialGradient, Rect, Skia, vec,
} from '@shopify/react-native-skia';
import { memo, useEffect } from 'react';
import {
  Easing, cancelAnimation, useDerivedValue, useSharedValue, withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { SIDES, type Side } from '../../game/battle';
import type { FighterId } from '../../game/types/fighter';
import { actionContact, actionDuration } from '../fighters/combat/actions';
import { humanAdvance, sampleHumanPose, type HumanPose } from '../fighters/combat/human-rig';
import { HumanCombatArt } from '../fighters/HumanCombatArt';
import { COMBAT_ROSTER } from '../fighters/combat/roster';
import type { CombatCue } from './combatFeedback';
import type { CombatPresentation } from './combatPresentation';

export type CombatClock = { elapsed: SharedValue<number>; idle: SharedValue<number> };
export type StageGeometry = { width: number; height: number; fighterHeight: number };

export function useCombatClock(presentation: CombatPresentation, motionEnabled: boolean): CombatClock {
  const elapsed = useSharedValue(0);
  const idle = useSharedValue(0);
  const { key, endMs, finished } = presentation;
  useEffect(() => {
    cancelAnimation(elapsed);
    elapsed.value = motionEnabled ? 0 : endMs;
    if (motionEnabled && endMs > 0) {
      elapsed.value = withTiming(endMs, { duration: endMs, easing: Easing.linear });
    }
    return () => cancelAnimation(elapsed);
  }, [key, endMs, elapsed, motionEnabled]);
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

export function actorPosition(side: Side, geometry: StageGeometry) {
  'worklet';
  return {
    x: geometry.width / 2 + (side === 'player' ? -1 : 1) * Math.min(geometry.width * 0.24, geometry.fighterHeight * 0.34),
    ground: geometry.height - (geometry.height < 120 ? 5 : 14),
    scale: geometry.fighterHeight / 480,
    direction: side === 'player' ? 1 : -1,
  };
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
  const pose = useDerivedValue<HumanPose>(() => {
    let active = -1;
    for (let index = 0; index < commands.length; index++) {
      if (commands[index].atMs <= elapsed.value) active = index;
    }
    if (!motionEnabled && commands.length) active = commands.length - 1;
    if (active < 0) return sampleHumanPose('idle', 0, 3000, 0, advance, idle.value);
    const command = commands[active], duration = actionDuration(command.action);
    const contact = actionContact(fighterId, command.action);
    const time = motionEnabled ? Math.max(0, elapsed.value - command.atMs)
      : command.action === 'fall' ? duration : contact;
    return time >= duration && command.action !== 'fall' && motionEnabled
      ? sampleHumanPose('idle', 0, 3000, 0, advance, idle.value)
      : sampleHumanPose(command.action, Math.min(time, duration), duration, contact, advance);
  });
  return <Group transform={[
    { translateX: position.x }, { translateY: position.ground },
    { scaleX: position.direction * position.scale }, { scaleY: position.scale },
    { translateX: -260 }, { translateY: -540 },
  ]}>
    <HumanCombatArt fighterId={fighterId} pose={pose} />
  </Group>;
}

function AmbientMote({ index, geometry, clock }: { index: number; geometry: StageGeometry; clock: CombatClock }) {
  const x = (index * 73 + 23) % geometry.width;
  const { idle } = clock;
  const y = useDerivedValue(() => geometry.height * (0.25 + (index % 5) * 0.13) -
    Math.sin(idle.value / 3000 * Math.PI * 2 + index) * 5);
  const opacity = useDerivedValue(() => 0.12 + (Math.sin(idle.value / 3000 * Math.PI * 2 + index * 2) + 1) * 0.12);
  return <Circle cx={x} cy={y} r={index % 3 === 0 ? 1.2 : 0.7} color="#FFE3A0" opacity={opacity} />;
}

function Floor({ geometry, presentation }: { geometry: StageGeometry; presentation: CombatPresentation }) {
  const { width, height } = geometry;
  const ground = actorPosition('player', geometry).ground;
  return <Group>
    <Rect x={0} y={0} width={width} height={height}>
      <LinearGradient start={vec(0, 0)} end={vec(0, height)}
        colors={['#10142330', '#14152955', '#0B101DD9']} positions={[0, 0.65, 1]} />
    </Rect>
    {SIDES.map((side) => {
      const design = COMBAT_ROSTER[presentation.fighters[side]];
      const x = actorPosition(side, geometry).x;
      return <Group key={side}>
        <Oval x={x - geometry.fighterHeight * 0.2} y={ground - 3}
          width={geometry.fighterHeight * 0.4} height={8} color="#03070B" opacity={0.8}>
          <BlurMask blur={3} style="normal" />
        </Oval>
        <Line p1={vec(x - 12, ground + 2)} p2={vec(x + 12, ground + 2)} color={design.accent} opacity={0.25} />
      </Group>;
    })}
    {Array.from({ length: 9 }, (_, i) => <Line key={i}
      p1={vec(width * (0.14 + i * 0.09), ground + 4)}
      p2={vec(width * (0.14 + i * 0.09) + 3, ground + 7)} color="#EAD6A2" strokeWidth={1} opacity={0.3} />)}
  </Group>;
}

function Charge({ cue, fighterId, geometry, elapsed }: {
  cue: CombatCue; fighterId: FighterId; geometry: StageGeometry; elapsed: SharedValue<number>;
}) {
  const design = COMBAT_ROSTER[fighterId];
  const source = actorPosition(cue.attacker, geometry);
  const x = source.x + source.direction * 129 * source.scale;
  const y = source.ground - 275 * source.scale;
  const opacity = useDerivedValue(() => {
    const time = elapsed.value - cue.delayMs;
    return time >= 0 && elapsed.value < cue.contactMs ? Math.min(1, time / 180) * 0.85 : 0;
  });
  const radius = useDerivedValue(() => 4 + Math.max(0, Math.min(1,
    (elapsed.value - cue.delayMs) / (cue.contactMs - cue.delayMs))) * 13);
  const transform = useDerivedValue(() => [
    { translateX: x }, { translateY: y }, { rotate: (elapsed.value - cue.delayMs) * 0.006 },
  ]);
  return <Group opacity={opacity} transform={transform}>
    <Circle r={radius} color={design.glow}><BlurMask blur={12} style="normal" /></Circle>
    <Circle r={radius} color={design.accent} style="stroke" strokeWidth={1.2} />
    <Circle r={4} color="#FFF8E3" />
    {[0, 1, 2].map((i) => <Path key={i} path="M0 -22 L3 -17 L0 -12 L-3 -17 Z"
      color={design.accent} transform={[{ rotate: i * Math.PI * 2 / 3 }]} />)}
  </Group>;
}

function Trail({ cue, fighterId, geometry, elapsed }: {
  cue: CombatCue; fighterId: FighterId; geometry: StageGeometry; elapsed: SharedValue<number>;
}) {
  const design = COMBAT_ROSTER[fighterId];
  const source = actorPosition(cue.attacker, geometry), target = actorPosition(cue.target, geometry);
  const fromX = source.x + source.direction * 130 * source.scale;
  const fromY = source.ground - 265 * source.scale;
  const toX = target.x - source.direction * 12 * source.scale;
  const toY = target.ground - 256 * source.scale;
  const special = cue.action === 'special';
  const travelMs = special ? 190 : 110;
  const progress = useDerivedValue(() => Math.max(0, Math.min(1,
    (elapsed.value - (cue.contactMs - travelMs)) / travelMs)));
  const opacity = useDerivedValue(() => {
    const before = elapsed.value < cue.contactMs - travelMs;
    return before ? 0 : Math.max(0, 1 - Math.max(0, elapsed.value - cue.contactMs) / (special ? 360 : 190));
  });
  const path = useDerivedValue(() => {
    const p = progress.value;
    const x = fromX + (toX - fromX) * p;
    const y = fromY + (toY - fromY) * p;
    const result = Skia.PathBuilder.Make();
    result.moveTo(fromX, fromY);
    if (special) result.cubicTo(fromX + (x - fromX) * 0.3, fromY - 5, fromX + (x - fromX) * 0.7, y + 5, x, y);
    else result.quadTo((fromX + x) / 2, fromY - geometry.fighterHeight * 0.18, x, y);
    return result.detach();
  });
  const tipX = useDerivedValue(() => fromX + (toX - fromX) * progress.value);
  const tipY = useDerivedValue(() => fromY + (toY - fromY) * progress.value);
  return <Group opacity={opacity}>
    <Path path={path} color={design.glow} style="stroke" strokeWidth={special ? 19 : 9} strokeCap="round">
      <BlurMask blur={special ? 9 : 4} style="normal" />
    </Path>
    <Path path={path} color={design.accent} style="stroke" strokeWidth={special ? 7 : 3.2} strokeCap="round" />
    <Path path={path} color="#FFF7E9" style="stroke" strokeWidth={special ? 2 : 0.9} strokeCap="round" />
    <Circle cx={tipX} cy={tipY} r={special ? 5 : 2.4} color={design.accent} />
  </Group>;
}

function Spark({ index, count, progress, tint, blocked }: {
  index: number; count: number; progress: SharedValue<number>; tint: string; blocked: boolean;
}) {
  const angle = index * Math.PI * 2 / count + (index % 3) * 0.13;
  const distance = 15 + (index % 5) * 7;
  const opacity = useDerivedValue(() => progress.value < 0 || progress.value > 1 ? 0 : (1 - progress.value) ** 1.6);
  const p1 = useDerivedValue(() => vec(
    Math.cos(angle) * (4 + progress.value * distance),
    Math.sin(angle) * (4 + progress.value * distance) + progress.value ** 2 * (blocked ? 3 : 13),
  ));
  const p2 = useDerivedValue(() => vec(
    Math.cos(angle) * (8 + progress.value * (distance + 9)),
    Math.sin(angle) * (8 + progress.value * (distance + 9)) + progress.value ** 2 * (blocked ? 3 : 13),
  ));
  return <Group opacity={opacity}>
    <Line p1={p1} p2={p2} color={index % 3 ? tint : '#FFF8EA'} strokeWidth={index % 4 === 0 ? 2 : 1.1} strokeCap="round" />
    <Circle c={p2} r={index % 3 === 0 ? 1.5 : 0.7} color={tint} />
  </Group>;
}

function Impact({ cue, fighterId, geometry, elapsed }: {
  cue: CombatCue; fighterId: FighterId; geometry: StageGeometry; elapsed: SharedValue<number>;
}) {
  const design = COMBAT_ROSTER[fighterId];
  const target = actorPosition(cue.target, geometry);
  const x = target.x, y = target.ground - 256 * target.scale;
  const tint = cue.blocked ? '#BFE9FF' : design.accent;
  const special = cue.action === 'special';
  const progress = useDerivedValue(() => (elapsed.value - cue.contactMs) / 620);
  const flash = useDerivedValue(() => progress.value < 0 ? 0 : Math.max(0, 1 - progress.value * 5));
  const fade = useDerivedValue(() => progress.value < 0 ? 0 : Math.max(0, 1 - progress.value * 1.7));
  const radius = useDerivedValue(() => 4 + Math.max(0, progress.value) * (special ? 62 : 43));
  const shieldTransform = useDerivedValue(() => [{ scale: 0.8 + Math.max(0, progress.value) * 0.45 }]);
  const sparks = special ? 18 : 10;
  return <Group transform={[{ translateX: x }, { translateY: y }]}>
    <Group opacity={flash}>
      <Circle r={special ? 28 : 17} color={tint}><BlurMask blur={special ? 17 : 10} style="normal" /></Circle>
      <Circle r={special ? 7 : 4} color="#FFF8E9" />
    </Group>
    <Group opacity={fade}>
      <Circle r={radius} color={tint} style="stroke" strokeWidth={special ? 1.8 : 1.1} />
      {special ? <Circle r={radius} color={tint} style="stroke" strokeWidth={4} opacity={0.16}>
        <BlurMask blur={3} style="normal" />
      </Circle> : null}
      {cue.blocked ? <Group transform={shieldTransform}>
        <Path path="M0 -32 L25 -19 L25 12 L0 33 L-25 12 L-25 -19 Z" color={tint} opacity={0.08} />
        <Path path="M0 -32 L25 -19 L25 12 L0 33 L-25 12 L-25 -19 Z" color={tint} style="stroke" strokeWidth={1.8} />
        <Path path="M0 -21 L16 -12 L16 8 L0 22 L-16 8 L-16 -12 Z" color={tint} style="stroke" strokeWidth={0.7} />
      </Group> : design.element === 'glacial' ? <Group>
        {[0, 1, 2].map((i) => <Path key={i} path="M0 -25 L0 25 M-5 -18 L0 -12 L5 -18 M-5 18 L0 12 L5 18"
          color={tint} style="stroke" strokeWidth={1.3} transform={[{ rotate: i * Math.PI / 3 }]} />)}
      </Group> : design.element === 'wildwood' ? <Group>
        {[0, 1, 2, 3].map((i) => <Path key={i} path="M0 -8 Q-16 -21 0 -33 Q15 -20 0 -8 Z"
          color={tint} opacity={0.7} transform={[{ rotate: i * Math.PI / 2 }]} />)}
      </Group> : <Group transform={[{ rotate: design.element === 'eclipse' ? -0.5 : 0.3 }]}>
        <Path path="M-25 0 L-6 -3 L0 -27 L4 -3 L26 0 L5 4 L0 25 L-4 4 Z" color={tint} opacity={0.72} />
      </Group>}
    </Group>
    {Array.from({ length: sparks }, (_, index) =>
      <Spark key={index} index={index} count={sparks} progress={progress} tint={tint} blocked={cue.blocked} />)}
  </Group>;
}

function LandingDust({ side, presentation, geometry, elapsed }: {
  side: Side; presentation: CombatPresentation; geometry: StageGeometry; elapsed: SharedValue<number>;
}) {
  const fall = presentation.commands[side].find((command) => command.action === 'fall');
  const position = actorPosition(side, geometry);
  const progress = useDerivedValue(() => fall ? (elapsed.value - fall.atMs - 470) / 600 : -1);
  const fade = useDerivedValue(() => progress.value < 0 ? 0 : Math.max(0, 1 - progress.value));
  const width = useDerivedValue(() => 12 + Math.max(0, progress.value) * 80);
  const x = useDerivedValue(() => position.x - width.value / 2);
  return <Group opacity={fade}>
    <Oval x={x} y={position.ground - 7} width={width} height={10} color="#D9C2A0" opacity={0.24}>
      <BlurMask blur={5} style="normal" />
    </Oval>
  </Group>;
}

export const CombatStage = memo(function CombatStage({ presentation, geometry, clock, motionEnabled }: {
  presentation: CombatPresentation; geometry: StageGeometry; clock: CombatClock; motionEnabled: boolean;
}) {
  return <Canvas testID="combat-skia-canvas" style={{ width: geometry.width, height: geometry.height }} accessible={false}>
    <Floor geometry={geometry} presentation={presentation} />
    {Array.from({ length: 12 }, (_, index) => <AmbientMote key={index} index={index} geometry={geometry} clock={clock} />)}
    {SIDES.map((side) => <Actor key={`${side}-${presentation.fighters[side]}`} side={side}
      presentation={presentation} geometry={geometry} clock={clock} motionEnabled={motionEnabled} />)}
    {motionEnabled ? presentation.cues.map((cue) => <Group key={cue.key}>
      {cue.action === 'special' ? <Charge cue={cue} fighterId={presentation.fighters[cue.attacker]}
        geometry={geometry} elapsed={clock.elapsed} /> : null}
      <Trail cue={cue} fighterId={presentation.fighters[cue.attacker]} geometry={geometry} elapsed={clock.elapsed} />
      <Impact cue={cue} fighterId={presentation.fighters[cue.attacker]} geometry={geometry} elapsed={clock.elapsed} />
    </Group>) : null}
    {motionEnabled ? SIDES.map((side) => <LandingDust key={side} side={side} presentation={presentation}
      geometry={geometry} elapsed={clock.elapsed} />) : null}
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
  before.clock.elapsed === after.clock.elapsed && before.clock.idle === after.clock.idle &&
  before.motionEnabled === after.motionEnabled,
);
