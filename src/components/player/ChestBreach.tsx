import {
  BlurMask, Canvas, ColorMatrix, Group, Image as PaintedImage, Oval, Paint,
  Rect, Shader, ImageShader, Skia, useImage, type DataSourceParam, type SkImage, type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { CHESTS, type ChestFamily } from '../../assets/chests';
import { containmentSeams, containmentVapor } from '../../assets/containment';
import { breachFrame, breachLayout, CHEST_BREACH, containmentCloud, containmentMouth, CONTAINMENT_VAPOR_SHADER, type BreachGeometry } from './chest-breach';

export type CinematicReward = { source: DataSourceParam; width: number; height: number; power: boolean; duplicate: boolean };

let vaporMaterial: SkRuntimeEffect | null = null;
function material() {
  if (!vaporMaterial) vaporMaterial = Skia.RuntimeEffect.Make(CONTAINMENT_VAPOR_SHADER);
  if (!vaporMaterial) throw new Error('Unable to compile the containment vapor material.');
  return vaporMaterial;
}

function Vapor({ image, progress, index, width, height, geometry, fullStage }: {
  image: SkImage; progress: SharedValue<number>; index: number; width: number; height: number;
  geometry: BreachGeometry; fullStage: boolean;
}) {
  const frame = useDerivedValue(() => containmentCloud(progress.get(), index, width, height, geometry, fullStage));
  const opacity = useDerivedValue(() => frame.get().opacity);
  const transform = useDerivedValue(() => {
    const f = frame.get();
    return [{ translateX: f.x - f.width / 2 }, { translateY: f.y - f.height / 2 },
      { scaleX: f.width / 512 }, { scaleY: f.height / 384 }, { translateX: -index * 512 }];
  });
  const uniforms = useDerivedValue(() => ({
    startX: index * 512, time: Math.max(0, breachFrame(progress.get()).time - 1125) / 1000,
    depth: index === 1 ? .75 : 1.12,
  }));
  return <Group opacity={opacity} transform={transform}>
    <Group clip={{ x: index * 512, y: 0, width: 512, height: 384 }}>
      <Rect x={index * 512} y={0} width={512} height={384}>
        <Shader source={material()} uniforms={uniforms}><ImageShader image={image} tx="decal" ty="decal" /></Shader>
      </Rect>
    </Group>
  </Group>;
}

function RewardLight({ image, reward, width, height, progress }: {
  image: SkImage; reward: CinematicReward; width: number; height: number; progress: SharedValue<number>;
}) {
  const opacity = useDerivedValue(() => breachFrame(progress.get()).reward);
  const light = useDerivedValue(() => breachFrame(progress.get()).rewardLight * .65);
  const matrix = useDerivedValue(() => {
    const color = breachFrame(progress.get()).reward;
    if (reward.power && !reward.duplicate) return [
      color * .914, 0, 0, 0, 0, 0, color, 0, 0, 0, 0, 0, color * .235, 0, 0, 0, 0, 0, 1, 0,
    ];
    return [color, 0, 0, 0, 0, 0, color, 0, 0, 0, 0, 0, color, 0, 0, 0, 0, 0, reward.duplicate ? .24 : 1, 0];
  });
  const rect = reward.power
    ? { x: width * .37, y: height * .37, width: width * .26, height: width * .26 }
    : { x: width * .1428, y: height * .2125, width: width * .7144, height: height * .5625 };
  return <Group opacity={opacity}>
    <Group opacity={light} layer={<Paint><ColorMatrix matrix={[
      0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0,
    ]} /><BlurMask blur={5} style="normal" /></Paint>}>
      <PaintedImage image={image} {...rect} fit="contain" />
    </Group>
    <Group layer={<Paint><ColorMatrix matrix={matrix} /></Paint>}>
      <PaintedImage image={image} {...rect} fit="contain" />
    </Group>
  </Group>;
}

export function ChestBreach({ family, width, height, active, progress, onReady, onError, fullStage = false, reward }: {
  family: ChestFamily; width: number; height: number; active: boolean; progress: SharedValue<number>;
  onReady: () => void; onError: (error: Error) => void; fullStage?: boolean; reward?: CinematicReward;
}) {
  const chest = CHESTS[family], geometry = CHEST_BREACH[family];
  const closed = useImage(chest.closed, onError), opened = useImage(chest.open, onError);
  const vapor = useImage(containmentVapor, onError), seam = useImage(containmentSeams[family], onError);
  const item = useImage(reward?.source ?? null, onError);
  useLayoutEffect(() => { if (closed && opened && vapor && seam && (!reward || item)) onReady(); },
    [closed, opened, vapor, seam, reward, item, onReady]);
  const fit = breachLayout(width, height, geometry, fullStage);
  const grade = useDerivedValue(() => fullStage ? breachFrame(progress.get()).grade : 0);
  const chestOpacity = useDerivedValue(() => reward ? breachFrame(progress.get()).chest : 1);
  const closedOpacity = useDerivedValue(() => breachFrame(progress.get()).opened ? 0 : 1);
  const openOpacity = useDerivedValue(() => breachFrame(progress.get()).opened ? 1 : 0);
  const seamOpacity = useDerivedValue(() => breachFrame(progress.get()).seam);
  const shellMatrix = useDerivedValue(() => {
    const shade = breachFrame(progress.get()).shell;
    return [shade, 0, 0, 0, 0, 0, shade, 0, 0, 0, 0, 0, shade, 0, 0, 0, 0, 0, 1, 0];
  });
  const halo = useDerivedValue(() => breachFrame(progress.get()).release * (1 - breachFrame(progress.get()).reward) * .3);
  const transform = useDerivedValue(() => {
    const f = breachFrame(progress.get());
    return [{ translateX: width / 2 }, { translateY: fit.floor + f.impulse },
      { scale: f.push }, { translateX: -geometry.width * fit.scale / 2 },
      { translateY: -geometry.height * fit.scale }, { scale: fit.scale }];
  });
  const rimClip = useDerivedValue(() => ({ x: 0, y: 0, width,
    height: Math.max(0, containmentMouth(progress.get(), width, height, geometry, fullStage).rimY) }));
  if (!active || !closed || !opened || !vapor || !seam || (reward && !item) || width <= 0 || height <= 0) return null;
  return <View testID="chest-breach-canvas" pointerEvents="none" style={StyleSheet.absoluteFill}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Canvas style={{ width, height }} accessible={false}>
      <Rect x={0} y={0} width={width} height={height} color="#03070C" opacity={grade} />
      <Group opacity={halo}>
        <Oval x={width * .15} y={height * .3} width={width * .7} height={height * .48} color="#AFC3D8">
          <BlurMask blur={35} style="normal" />
        </Oval>
      </Group>
      <Vapor image={vapor} progress={progress} index={0} width={width} height={height} geometry={geometry} fullStage={fullStage} />
      <Group opacity={chestOpacity} transform={transform}>
        <Oval x={40} y={geometry.height - 14} width={535} height={18} color="#000000" opacity={.7}>
          <BlurMask blur={8} style="normal" />
        </Oval>
        <Group opacity={closedOpacity}>
          <Group layer={<Paint><ColorMatrix matrix={shellMatrix} /></Paint>}>
            <PaintedImage image={closed} x={0} y={geometry.height - geometry.closedHeight}
              width={geometry.width} height={geometry.closedHeight} fit="fill" />
          </Group>
          <PaintedImage image={seam} x={0} y={geometry.height - geometry.closedHeight}
            width={geometry.width} height={geometry.closedHeight} fit="fill" opacity={seamOpacity} />
        </Group>
        <Group opacity={openOpacity}>
          <PaintedImage image={opened} x={0} y={0} width={geometry.width} height={geometry.height} fit="fill" />
        </Group>
      </Group>
      {item && reward && fullStage ? <RewardLight image={item} reward={reward} width={width} height={height} progress={progress} /> : null}
      <Group clip={rimClip}>
        <Vapor image={vapor} progress={progress} index={1} width={width} height={height} geometry={geometry} fullStage={fullStage} />
        <Vapor image={vapor} progress={progress} index={2} width={width} height={height} geometry={geometry} fullStage={fullStage} />
      </Group>
      <Group transform={transform} opacity={openOpacity}>
        <Group opacity={chestOpacity} clip={{ x: 0, y: geometry.frontY, width: geometry.width, height: geometry.height - geometry.frontY }}>
          <PaintedImage image={opened} x={0} y={0} width={geometry.width} height={geometry.height} fit="fill" />
        </Group>
      </Group>
    </Canvas>
  </View>;
}
