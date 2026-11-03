import { Canvas, Group, Oval } from '@shopify/react-native-skia';
import { View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { getFighter } from '../../data/fighters';
import type { FighterId } from '../../game/types/fighter';
import { boneMatrices, sampleAction, type BoneMatrix, type RigPose } from './combat/actions';
import { FighterRig } from './combat/FighterRig';
import { COMBAT_ROSTER } from './combat/roster';

export function FighterArt({ fighterId, height }: { fighterId: FighterId; height: number }) {
  const width = height * 2 / 3;
  const scale = height / 600;
  const design = COMBAT_ROSTER[fighterId];
  const pose = useDerivedValue<RigPose>(() => sampleAction(fighterId, 'idle', 0));
  const matrices = useDerivedValue<readonly BoneMatrix[]>(() => boneMatrices(pose.value));
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${getFighter(fighterId).name} artwork`}
      style={{ height, width }}>
      <Canvas style={{ height, width }} accessible={false}>
        <Group transform={[{ scale }, { translateX: -84 }]}>
          <Oval x={166} y={535} width={225} height={22} color="#090C1B" opacity={0.45} />
          <Oval x={178} y={539} width={199} height={12} color={design.accent} opacity={0.17} />
          <Group transform={[{ translateX: 260 }, { scaleX: design.width }, { translateX: -260 }]}>
            <FighterRig fighterId={fighterId} pose={pose} matrices={matrices} />
          </Group>
        </Group>
      </Canvas>
    </View>
  );
}
