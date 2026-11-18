import { FilterMode, Group, ImageShader, MipmapMode, Path, Shader, Skia, Vertices, type SkImage, type SkRuntimeEffect } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type DerivedValue, type SharedValue } from 'react-native-reanimated';

import fragments from '../../assets/brawler-fragments.json';
import type { FighterId } from '../../game/types/fighter';
import { koFragment, koFrame, SIGNAL_DISSOLVE_SHADER } from '../battle/signature-motion';
import { COMBAT_ROSTER } from './combat/roster';
import type { PaintedMesh } from './combat/painted-mesh';

export type DefeatPaint = { atMs: number; elapsed: SharedValue<number>; motionEnabled: boolean };
type Point = { x: number; y: number };
type Props = {
  fighterId: FighterId; image: SkImage; width: number; height: number;
  mesh: PaintedMesh; vertices: DerivedValue<Point[]>; defeat: DefeatPaint;
};
let material: SkRuntimeEffect | null = null;
function signalMaterial() {
  if (!material) {
    material = Skia.RuntimeEffect.Make(SIGNAL_DISSOLVE_SHADER);
    if (!material) throw new Error('Unable to compile the painted Brawler vaporization shader.');
  }
  return material;
}

function Fragment({ index, anchor, vertices, defeat, accent }: {
  index: number; anchor: { vertex: number; color: string }; vertices: DerivedValue<Point[]>; defeat: DefeatPaint; accent: string;
}) {
  const frame = useDerivedValue(() => koFragment(defeat.elapsed.get() - defeat.atMs, index));
  const opacity = useDerivedValue(() => frame.get().opacity);
  const transform = useDerivedValue(() => {
    const point = vertices.get()[anchor.vertex], motion = frame.get();
    return [{ translateX: point.x + motion.x }, { translateY: point.y + motion.y },
      { rotate: motion.rotation }, { scale: motion.scale }];
  });
  return <Group opacity={opacity} transform={transform}>
    <Path path="M-2 -4L3 -1L1 4L-3 2Z" color={anchor.color} />
    {index % 3 === 0 ? <Path path="M-2 -4L3 -1L1 4L-3 2Z" color={accent} style="stroke" strokeWidth={.55} opacity={.75} /> : null}
  </Group>;
}

function VaporPaint({ fighterId, image, width, height, mesh, vertices, defeat }: Props) {
  const source = signalMaterial();
  const spec = fragments[fighterId], accent = COMBAT_ROSTER[fighterId].accent;
  if (spec.width !== width || spec.height !== height || spec.points.some(point => point.vertex >= mesh.bind.length)) {
    throw new Error('Painted vaporization anchors are stale. Rebuild Brawler fragments.');
  }
  const color = useMemo(() => [...Skia.Color(accent)].slice(0, 3), [accent]);
  const frame = useDerivedValue(() => koFrame(defeat.elapsed.get() - defeat.atMs));
  const opacity = useDerivedValue(() => frame.get().opacity);
  const uniforms = useDerivedValue(() => ({
    dimensions: [width, height], progress: frame.get().progress, edge: frame.get().edge,
    accent: color, seed: width + height * .37,
  }));
  return <Group>
    <Group opacity={opacity}>
      <Vertices vertices={vertices} textures={mesh.textures} indices={mesh.indices} mode="triangles">
        <Shader source={source} uniforms={uniforms}>
          <ImageShader image={image} tx="decal" ty="decal" sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} />
        </Shader>
      </Vertices>
    </Group>
    {spec.points.map((anchor, index) => <Fragment key={index} index={index} anchor={anchor}
      vertices={vertices} defeat={defeat} accent={accent} />)}
  </Group>;
}

export function PaintedVaporization(props: Props) {
  if (!props.defeat.motionEnabled || props.defeat.atMs < 0) return null;
  return <VaporPaint {...props} />;
}
