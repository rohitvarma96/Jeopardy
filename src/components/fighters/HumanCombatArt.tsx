import { Group, Path } from '@shopify/react-native-skia';
import { useDerivedValue, type DerivedValue } from 'react-native-reanimated';

import type { FighterId } from '../../game/types/fighter';
import { HUMAN_DESIGNS, HUMAN_ORIGIN, HUMAN_PARTS, type HumanPart, type HumanPose } from './combat/human-rig';

function Part({ part, fighterId, pose }: { part: HumanPart; fighterId: FighterId; pose: DerivedValue<HumanPose> }) {
  const design = HUMAN_DESIGNS[fighterId];
  const transform = useDerivedValue(() => [
    { translateX: part.x }, { translateY: part.y }, { rotate: pose.value.angles[part.name] },
  ]);
  return <Group transform={transform}>
    {part.shapes.map((shape, index) => <Group key={index}>
      <Path path={shape.path} color={design[shape.fill]} />
      {shape.stroke ? <Path path={shape.path} color={design[shape.stroke]}
        style="stroke" strokeWidth={shape.width ?? 2} strokeJoin="round" /> : null}
    </Group>)}
    {part.name === 'head' ? <Path path={design.hairPath} color={design.hair} /> : null}
    {part.name === 'torso' && design.longCoat ? <Group>
      <Path path="M-29 -3 L-8 1 L-21 94 L-50 117 Z" color={design.cloth} />
      <Path path="M12 0 L29 -3 L49 91 L25 105 Z" color={design.panel} />
      <Path path="M-22 8 L-15 9 L-28 92 L-39 103 Z" color={design.accent} />
    </Group> : null}
    {HUMAN_PARTS.filter((child) => child.parent === part.name).map((child) => (
      <Part key={child.name} part={child} fighterId={fighterId} pose={pose} />
    ))}
  </Group>;
}

export function HumanCombatArt({ fighterId, pose }: { fighterId: FighterId; pose: DerivedValue<HumanPose> }) {
  const transform = useDerivedValue(() => [
    { translateX: HUMAN_ORIGIN.x + pose.value.x }, { translateY: HUMAN_ORIGIN.y + pose.value.y },
  ]);
  return <Group transform={transform}>
    {HUMAN_PARTS.filter((part) => part.parent === null).map((part) => (
      <Part key={part.name} part={part} fighterId={fighterId} pose={pose} />
    ))}
  </Group>;
}
