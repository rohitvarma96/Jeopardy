import { Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import type { Side } from '../../game/battle';
import { humanAdvance } from '../fighters/combat/human-rig';
import { paintedMeshFor } from '../fighters/combat/painted-assets';
import { paintedAnchor, type PaintedMesh } from '../fighters/combat/painted-mesh';
import { COMBAT_ROSTER } from '../fighters/combat/roster';
import { actorPosition, type StageGeometry } from './combatGeometry';
import type { CombatCue } from './combatFeedback';
import type { CombatPresentation } from './combatPresentation';
import { presentedPose } from './signature-motion';

function anchor(presentation: CombatPresentation, side: Side, geometry: StageGeometry, mesh: PaintedMesh,
  time: number, limb: boolean, special: boolean) {
  'worklet';
  const position = actorPosition(side, geometry), rival = actorPosition(side === 'player' ? 'opponent' : 'player', geometry);
  const pose = presentedPose(presentation.fighters[side], presentation.commands[side], time, 0,
    humanAdvance(Math.abs(position.x - rival.x) / position.scale), true, presentation.defeats[side]);
  const point = paintedAnchor(mesh, pose, limb ? special ? 'frontFoot' : 'frontHand' : 'torso', limb ? 1 : .55);
  return vec(position.x + position.direction * position.scale * (point.x - 260),
    position.ground + position.scale * (point.y - 540));
}

function InkChip({ index, progress, color }: { index: number; progress: SharedValue<number>; color: string }) {
  const angle = index * Math.PI / 3 + .3;
  const opacity = useDerivedValue(() => progress.get() >= 0 && progress.get() < 1 ? (1 - progress.get()) ** 2 * .8 : 0);
  const transform = useDerivedValue(() => {
    const p = Math.max(0, progress.get());
    return [{ translateX: Math.cos(angle) * (8 + p * 42) }, { translateY: Math.sin(angle) * (8 + p * 28) },
      { rotate: angle + p }, { scale: 1 - Math.min(1, p) * .5 }];
  });
  return <Group opacity={opacity} transform={transform}>
    <Path path="M-2 -4L3 -1L1 4L-3 2Z" color={color} />
  </Group>;
}

export function SignatureHit({ cue, presentation, geometry, elapsed }: {
  cue: CombatCue; presentation: CombatPresentation; geometry: StageGeometry; elapsed: SharedValue<number>;
}) {
  const sourceMesh = useMemo(() => paintedMeshFor(presentation.fighters[cue.attacker]), [presentation.fighters, cue.attacker]);
  const targetMesh = useMemo(() => paintedMeshFor(presentation.fighters[cue.target]), [presentation.fighters, cue.target]);
  const contact = useMemo(() => anchor(presentation, cue.target, geometry, targetMesh, cue.contactMs, false, false),
    [presentation, cue.target, cue.contactMs, geometry, targetMesh]);
  const source = actorPosition(cue.attacker, geometry);
  const color = cue.blocked ? '#9CE2EF' : COMBAT_ROSTER[presentation.fighters[cue.attacker]].accent;
  const tip = useDerivedValue(() => anchor(presentation, cue.attacker, geometry, sourceMesh,
    Math.min(elapsed.get(), cue.contactMs), true, cue.action === 'special'));
  const signalOpacity = useDerivedValue(() => {
    const time = elapsed.get();
    return time >= cue.delayMs && time < cue.contactMs ? Math.min(.65, (time - cue.delayMs) / 100) : 0;
  });
  const signal = useDerivedValue(() => {
    const point = tip.get(), p = Math.max(0, Math.min(1, (elapsed.get() - cue.delayMs) / 160));
    const start = vec(source.x, geometry.height - 4), x = start.x + (point.x - start.x) * p;
    const y = start.y + (point.y - start.y) * p;
    const path = Skia.PathBuilder.Make();
    path.moveTo(start.x, start.y);
    path.quadTo(start.x - source.direction * 12, (start.y + y) / 2, x, y);
    return path.detach();
  });
  const smearOpacity = useDerivedValue(() => {
    const time = elapsed.get() - cue.contactMs;
    return time >= -110 && time < 65 ? Math.sin((time + 110) / 175 * Math.PI) * .8 : 0;
  });
  const smear = useDerivedValue(() => {
    const now = Math.min(elapsed.get(), cue.contactMs);
    const before = anchor(presentation, cue.attacker, geometry, sourceMesh,
      Math.max(cue.delayMs, now - 60), true, cue.action === 'special');
    const current = tip.get(), dx = current.x - before.x, dy = current.y - before.y;
    const length = Math.max(1, Math.hypot(dx, dy)), nx = -dy / length * 5, ny = dx / length * 5;
    const path = Skia.PathBuilder.Make();
    path.moveTo(before.x - nx * .2, before.y - ny * .2);
    path.lineTo(current.x - nx, current.y - ny);
    path.lineTo(current.x + nx * .7, current.y + ny * .7);
    path.lineTo(before.x + nx * .2, before.y + ny * .2);
    path.close();
    return path.detach();
  });
  const progress = useDerivedValue(() => (elapsed.get() - cue.contactMs) / 440);
  const impactOpacity = useDerivedValue(() => progress.get() >= 0 && progress.get() < 1 ? (1 - progress.get()) ** 1.8 : 0);
  const impactTransform = useDerivedValue(() => {
    const p = Math.max(0, Math.min(1, progress.get()));
    return [{ translateX: contact.x }, { translateY: contact.y }, { rotate: source.direction * -.2 },
      { scale: Math.max(.45, geometry.fighterHeight / 220) * (1.15 - p * .25) }];
  });
  const shieldTransform = useDerivedValue(() => [{ scaleX: .65 + Math.min(1, Math.max(0, progress.get()) * 4) * .35 }]);
  if (!cue.blocked && cue.damage <= 0 && !presentation.preview) return null;
  return <Group>
    <Group opacity={signalOpacity}>
      <Path path={signal} color={color} style="stroke" strokeWidth={4} opacity={.15} />
      <Path path={signal} color={color} style="stroke" strokeWidth={1.1} />
    </Group>
    <Path path={smear} color={color} opacity={smearOpacity} />
    <Group opacity={impactOpacity} transform={impactTransform}>
      {cue.blocked ? <Group transform={shieldTransform}>
        <Path path="M0 -29L23 -16L22 12L0 30L-22 12L-23 -16Z" color="#0C1726" opacity={.85} />
        <Path path="M0 -29L23 -16L22 12L0 30L-22 12L-23 -16Z" color={color} style="stroke" strokeWidth={2} />
        <Path path="M-13 0L-3 5L12 -8" color={color} style="stroke" strokeWidth={1.2} />
      </Group> : <>
        <Path path="M-48 -6L-14 -13L-5 -32L4 -11L40 -20L19 -3L47 4L12 10L0 30L-7 12L-43 19L-22 4Z" color="#090C14" opacity={.9} />
        <Path path="M-38 -5L-9 -9L-3 -24L3 -8L31 -15L13 0L35 4L7 7L0 22L-5 8L-32 14L-14 3Z" color={color} />
        <Line p1={vec(-22, 7)} p2={vec(18, -6)} color="#F1F0E8" strokeWidth={2} />
        <Line p1={vec(-10, -5)} p2={vec(4, -14)} color="#F1F0E8" strokeWidth={1} />
      </>}
    </Group>
    {!cue.blocked ? <Group transform={[{ translateX: contact.x }, { translateY: contact.y }]}>
      {[0, 1, 2, 3, 4, 5].map(index => <InkChip key={index} index={index} progress={progress} color={color} />)}
    </Group> : null}
  </Group>;
}
