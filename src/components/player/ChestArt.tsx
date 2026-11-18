import {
  BlurMask, Canvas, Circle, Group, Image as SkiaImage, ImageShader, LinearGradient,
  Oval, Path, RoundedRect, Vertices, vec, FilterMode, MipmapMode, type SkImage,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { CHESTS, type ChestFamily } from '../../assets/chests';
import { chestLayers } from '../../assets/chest-layers';
import { chestFrame, chestLidVertices } from './chest-motion';

export type ChestTextures = { base: SkImage; lid: SkImage; lidInner: SkImage; interior: SkImage };

function Spark({ index, progress, x, y, color }: { index: number; progress: SharedValue<number>; x: number; y: number; color: string }) {
  const px = useDerivedValue(() => x + Math.sin(index * 2.4) * (18 + chestFrame(progress.value).hinge * 75));
  const py = useDerivedValue(() => y - chestFrame(progress.value).hinge * (45 + index * 12));
  const opacity = useDerivedValue(() => chestFrame(progress.value).particles * .8);
  return <Circle cx={px} cy={py} r={index % 2 ? 2 : 3} color={color} opacity={opacity} />;
}

export function ChestArt({ family, progress, textures, width, height }: {
  family: ChestFamily; progress: SharedValue<number>; textures: ChestTextures; width: number; height: number;
}) {
  const geometry = chestLayers[family].geometry;
  const accent = CHESTS[family].accent;
  const scale = Math.min(width / geometry.width, height / (geometry.height + geometry.padding));
  const x = (width - geometry.width * scale) / 2;
  const y = (height - (geometry.height + geometry.padding) * scale) / 2;
  const vertices = useDerivedValue(() => chestLidVertices(geometry, progress.value));
  const outer = useDerivedValue(() => {
    const angle = chestFrame(progress.value).angle;
    return geometry.depth[1] * Math.cos(angle) - geometry.lift * Math.sin(angle) >= 0 ? 1 : 0;
  });
  const inner = useDerivedValue(() => 1 - outer.value);
  const glow = useDerivedValue(() => chestFrame(progress.value).glow);
  const latch = useDerivedValue(() => chestFrame(progress.value).latch * .7);
  const charge = useDerivedValue(() => {
    const frame = chestFrame(progress.value);
    return frame.charge * (1 - frame.hinge) * .55;
  });
  const [a, b, c, d] = geometry.mouth;
  const centerX = (a[0] + b[0] + c[0] + d[0]) / 4;
  const centerY = (a[1] + b[1] + c[1] + d[1]) / 4;
  const beam = `M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${centerX + 80} ${centerY - 180} L${centerX - 100} ${centerY - 180} Z`;
  const texturePoints = [
    { x: 0, y: 0 }, { x: geometry.width, y: 0 },
    { x: 0, y: geometry.height }, { x: geometry.width, y: geometry.height },
  ];
  return <Canvas accessible={false} style={{ width, height }}>
    <Group transform={[{ translateX: x }, { translateY: y }, { scale }, { translateY: geometry.padding }]}>
      <SkiaImage image={textures.interior} x={0} y={0} width={geometry.width} height={geometry.height} fit="fill" />
      <Group opacity={glow}>
        <Path path={beam}>
          <LinearGradient start={vec(centerX, centerY)} end={vec(centerX, centerY - 180)}
            colors={[`${accent}AA`, `${accent}00`]} />
        </Path>
        <Oval x={centerX - 100} y={centerY - 22} width={200} height={44} color={accent} opacity={.5}>
          <BlurMask blur={14} style="normal" />
        </Oval>
      </Group>
      <Group opacity={outer}>
        <Vertices mode="triangles" vertices={vertices} textures={texturePoints} indices={[0, 1, 2, 1, 3, 2]}>
          <ImageShader image={textures.lid} tx="decal" ty="decal"
            sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} />
        </Vertices>
      </Group>
      <Group opacity={inner}>
        <Vertices mode="triangles" vertices={vertices} textures={texturePoints} indices={[0, 1, 2, 1, 3, 2]}>
          <ImageShader image={textures.lidInner} tx="decal" ty="decal"
            sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} />
        </Vertices>
      </Group>
      <SkiaImage image={textures.base} x={0} y={0} width={geometry.width} height={geometry.height} fit="fill" />
      <Path path={`M${d[0]} ${d[1]} L${c[0]} ${c[1]}`} color={accent} style="stroke" strokeWidth={3} opacity={charge}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <RoundedRect x={geometry.latch[0] - 16} y={geometry.latch[1] - 8} width={32} height={16}
        r={4} color={accent} opacity={latch}>
        <BlurMask blur={7} style="normal" />
      </RoundedRect>
      {Array.from({ length: 8 }, (_, index) => <Spark key={index} index={index} progress={progress}
        x={centerX} y={centerY} color={accent} />)}
    </Group>
  </Canvas>;
}
