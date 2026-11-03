import { Circle, Group, LinearGradient, Oval, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { memo, type ReactNode } from 'react';
import { useDerivedValue, type DerivedValue } from 'react-native-reanimated';

import type { FighterId } from '../../../game/types/fighter';
import { RIG, type BoneMatrix, type BoneName, type RigPose } from './actions';
import reference from './reference.json';
import { COMBAT_ROSTER, type CombatDesign, type CombatPalette } from './roster';

type Pigment = { color: string; opacity: number };
type VectorNode = {
  kind: string; opacity: number;
  transform: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number };
  children?: readonly VectorNode[];
  fill?: Pigment | null; stroke?: (Pigment & { width: number }) | null;
  points?: readonly (readonly number[])[]; weights?: readonly (readonly number[])[];
  closed?: boolean; width?: number; height?: number; radius?: number;
};

function color(value: string, palette: CombatPalette) {
  if (value.startsWith('#')) return value;
  const entry = Object.entries(palette).find(([name]) => name === value);
  if (!entry) throw new Error(`Unknown combat pigment: ${value}`);
  return entry[1];
}

function contour(points: readonly (readonly number[])[], closed = true) {
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ') + (closed ? ' Z' : '');
}

const VectorArt = memo(function VectorArt({ node, palette }: { node: VectorNode; palette: CombatPalette }) {
  const t = node.transform;
  const transform = [
    { translateX: t.x ?? 0 }, { translateY: t.y ?? 0 }, { rotate: t.rotation ?? 0 },
    { scaleX: t.scaleX ?? 1 }, { scaleY: t.scaleY ?? 1 },
  ];
  let shape: ReactNode;
  if (node.kind === 'group') {
    shape = node.children?.map((child, index) => <VectorArt key={index} node={child} palette={palette} />);
  } else {
    const fill = node.fill, stroke = node.stroke;
    const paints = [
      ...(fill ? [{ ...fill, style: 'fill' as const, width: 0 }] : []),
      ...(stroke ? [{ ...stroke, style: 'stroke' as const }] : []),
    ];
    if (node.kind === 'path') {
      if (!node.points) throw new Error('Reference contour has no vertices.');
      const path = contour(node.points, node.closed);
      shape = paints.map((paint) => <Path key={paint.style} path={path} style={paint.style}
        color={color(paint.color, palette)} opacity={paint.opacity} strokeWidth={paint.width}
        strokeCap="round" strokeJoin="round" />);
    } else {
      if (node.width === undefined || node.height === undefined) throw new Error('Reference shape has no bounds.');
      const bounds = { x: -node.width / 2, y: -node.height / 2, width: node.width, height: node.height };
      shape = paints.map((paint) => node.kind === 'oval'
        ? <Oval key={paint.style} {...bounds} style={paint.style} color={color(paint.color, palette)}
          opacity={paint.opacity} strokeWidth={paint.width} />
        : <RoundedRect key={paint.style} {...bounds} r={node.radius ?? 0} style={paint.style}
          color={color(paint.color, palette)} opacity={paint.opacity} strokeWidth={paint.width} />);
    }
  }
  return <Group transform={transform} opacity={node.opacity}>{shape}</Group>;
});

function Ink({ path, fill, palette, width = 2.4 }: {
  path: string; fill: string; palette: CombatPalette; width?: number;
}) {
  return <Group>
    <Path path={path} color={fill} />
    <Path path={path} color={palette.outline} style="stroke" strokeWidth={width} strokeJoin="round" strokeCap="round" />
  </Group>;
}

function Seam({ path, color: tint, width = 2 }: { path: string; color: string; width?: number }) {
  return <Path path={path} style="stroke" color={tint} strokeWidth={width} strokeCap="round" strokeJoin="round" />;
}

function Gem({ x, y, palette, size = 10 }: { x: number; y: number; palette: CombatPalette; size?: number }) {
  return <Group transform={[{ translateX: x }, { translateY: y }]}>
    <Path path={`M0 ${-size} L${size * 0.7} 0 L0 ${size} L${-size * 0.7} 0 Z`} color={palette.jewel}>
      <LinearGradient start={vec(-size, -size)} end={vec(size, size)} colors={[palette.edge, palette.jewel, palette.clothLight]} />
    </Path>
    <Seam path={`M0 ${-size + 3} L0 ${size - 3}`} color={palette.edge} width={1.5} />
  </Group>;
}

function Body({ design }: { design: CombatDesign }) {
  const p = design.palette;
  return <Group transform={[{ rotate: Math.PI / 2 }]}>
    {design.silhouette === 'sage' ? <>
      <Ink palette={p} fill={p.clothDark} path="M-29 -98 L28 -98 L35 -28 L48 78 L69 161 L26 174 L9 153 L-7 176 L-55 163 L-40 68 L-35 -22 Z" />
      <Path path="M-19 -92 L10 -94 L11 29 L39 161 L14 158 L-1 135 L-16 159 L-37 156 L-20 23 Z" color={p.cloth}>
        <LinearGradient start={vec(-25, -80)} end={vec(32, 164)} colors={[p.clothLight, p.cloth, p.clothDark]} />
      </Path>
      <Ink palette={p} fill={p.metal} path="M-44 -84 L-29 -111 L-4 -91 L27 -109 L49 -82 L30 -52 L-30 -54 Z" />
      <Seam path="M-39 -83 L-26 -100 L-2 -81 L26 -98 L42 -82 M-30 -47 L-15 33 L-35 149 M26 -47 L13 32 L34 150" color={p.edge} width={3} />
      <Ink palette={p} fill={p.deep} path="M-30 -15 L29 -15 L31 1 L-31 1 Z" />
      <Gem x={0} y={-59} palette={p} size={16} />
      <Gem x={0} y={-7} palette={p} size={9} />
      <Seam path="M-25 164 L-18 134 M40 161 L31 130 M-9 61 L2 93 L14 62" color={p.light} />
    </> : design.silhouette === 'assassin' ? <>
      <Ink palette={p} fill={p.leather} path="M-26 -98 L20 -101 L31 -77 L23 -25 L29 23 L7 38 L-25 21 L-33 -34 Z" />
      <Ink palette={p} fill={p.metal} path="M-28 -81 L-5 -96 L23 -81 L16 -31 L-5 -20 L-25 -37 Z" />
      <Path path="M-26 -80 L-17 -86 L20 -36 L13 -25 Z" color={p.cloth} />
      <Seam path="M-18 -81 L15 -39 M18 -80 L-19 -36" color={p.light} width={3} />
      <Ink palette={p} fill={p.cloth} path="M-32 -106 L23 -107 L37 -89 L9 -76 L-24 -83 Z" />
      <Ink palette={p} fill={p.deep} path="M-29 -14 L26 -14 L28 0 L-29 1 Z" />
      <Gem x={2} y={-7} palette={p} size={9} />
      <Seam path="M-15 7 L-18 22 M11 7 L17 21" color={p.clothLight} />
    </> : design.silhouette === 'ranger' ? <>
      <Ink palette={p} fill={p.leather} path="M-30 -97 L25 -97 L35 -75 L24 -21 L35 35 L8 52 L-8 38 L-32 49 L-37 16 L-27 -25 Z" />
      <Ink palette={p} fill={p.cloth} path="M-37 -86 L-18 -105 L4 -94 L28 -103 L43 -78 L23 -55 L-8 -72 L-28 -54 Z" />
      <Ink palette={p} fill={p.metal} path="M-23 -66 L24 -66 L19 -22 L1 -7 L-22 -27 Z" />
      <Seam path="M-27 -84 L-9 -89 L3 -78 L26 -86 M-16 -57 L2 -24 L16 -55" color={p.edge} />
      <Ink palette={p} fill={p.clothDark} path="M-31 -5 L-3 5 L-18 48 L-39 29 Z" />
      <Ink palette={p} fill={p.clothLight} path="M-1 5 L25 -9 L36 32 L10 51 Z" />
      <Seam path="M-1 10 L14 37 M-25 7 L-27 32" color={p.light} />
      <Gem x={1} y={-52} palette={p} size={11} />
    </> : <>
      <Ink palette={p} fill={p.deep} path="M-48 -96 L42 -98 L50 -59 L40 -12 L46 40 L15 56 L-7 40 L-42 51 L-50 13 Z" />
      <Ink palette={p} fill={p.metal} path="M-49 -92 L-31 -112 L29 -112 L51 -91 L40 -33 L15 -17 L-30 -22 L-46 -41 Z" />
      <Path path="M-41 -87 L-24 -103 L-6 -103 L-13 -50 L-34 -40 Z" color={p.light} />
      <Path path="M5 -104 L27 -102 L42 -85 L32 -48 L7 -39 Z" color={p.shadow} />
      <Seam path="M-39 -43 L-26 -30 L19 -28 L37 -42 M-43 -91 L-28 -105 L26 -105 L44 -88" color={p.edge} width={3.5} />
      <Circle cx={0} cy={-67} r={20} color={p.deep} />
      <Circle cx={0} cy={-67} r={15} color={p.light} />
      <Gem x={0} y={-67} palette={p} size={19} />
      <Ink palette={p} fill={p.cloth} path="M-34 -5 L-8 -3 L-7 45 L-36 32 Z" />
      <Ink palette={p} fill={p.clothLight} path="M3 -3 L31 -4 L38 31 L10 48 Z" />
    </>}
  </Group>;
}

function Head({ design }: { design: CombatDesign }) {
  const p = design.palette;
  return <Group transform={[{ rotate: Math.PI / 2 }]}>
    {design.silhouette === 'sage' ? <>
      <Ink palette={p} fill={p.clothDark} path="M-37 -8 L-42 -46 L-23 -87 L-3 -111 L26 -81 L39 -47 L29 -6 L8 10 Z" />
      <Ink palette={p} fill={p.cloth} path="M-34 -39 L-21 -81 L-1 -99 L24 -76 L34 -45 L16 -62 L-5 -67 Z" />
      <Ink palette={p} fill={p.deep} path="M-20 -37 L-5 -59 L18 -54 L28 -32 L19 -1 L-3 7 L-21 -10 Z" />
      <Seam path="M-32 -40 L-6 -74 L25 -52 M-26 -8 L-14 3 M24 -7 L14 3" color={p.edge} width={3} />
      <Seam path="M-11 -29 L-1 -26 M9 -27 L19 -31" color={p.jewel} width={3.5} />
      <Path path="M-18 -93 Q-2 -125 16 -96 Q-3 -109 -8 -88 Z" color={p.edge} />
      <Gem x={1} y={-70} palette={p} size={8} />
    </> : design.silhouette === 'assassin' ? <>
      <Ink palette={p} fill={p.deep} path="M-33 -10 L-36 -53 L-16 -82 L10 -81 L33 -57 L30 -20 L13 7 L-10 5 Z" />
      <Path path="M-30 -51 L-13 -73 L5 -75 L-4 -43 Z" color={p.metal} />
      <Ink palette={p} fill={p.clothDark} path="M-25 -26 L3 -39 L30 -30 L24 -5 L4 9 L-16 -2 Z" />
      <Seam path="M-17 -36 L-4 -32 M10 -33 L24 -39" color={p.jewel} width={3.5} />
      <Seam path="M-18 -14 L16 -12 M-25 -48 L-13 -65" color={p.light} />
      <Path path="M-7 -74 L6 -91 L14 -72 Z" color={p.clothLight} />
    </> : design.silhouette === 'ranger' ? <>
      <Seam path="M-18 -56 L-37 -86 L-39 -119 M-35 -87 L-55 -97 M-39 -106 L-24 -120 M13 -59 L33 -88 L39 -118 M33 -91 L52 -103 M38 -108 L24 -122" color={p.edge} width={6} />
      <Ink palette={p} fill={p.clothDark} path="M-35 -4 L-37 -49 L-18 -77 L7 -86 L31 -62 L36 -28 L23 4 L-1 14 Z" />
      <Ink palette={p} fill={p.cloth} path="M-32 -46 L-15 -69 L8 -75 L28 -52 L2 -58 Z" />
      <Ink palette={p} fill={p.skin} path="M-17 -39 L2 -53 L22 -40 L26 -20 L19 -13 L15 0 L1 7 L-15 -8 Z" />
      <Ink palette={p} fill={p.deep} path="M-18 -29 L3 -34 L25 -31 L22 -16 L4 -13 L-17 -18 Z" />
      <Seam path="M-9 -25 L-1 -24 M11 -24 L21 -27" color={p.jewel} width={2.5} />
      <Path path="M-36 -31 L-51 -49 L-31 -41 M28 -41 L47 -53 L34 -29" color={p.light} />
      <Gem x={4} y={-60} palette={p} size={7} />
    </> : <>
      <Ink palette={p} fill={p.shadow} path="M-35 -8 L-40 -58 L-26 -83 L24 -84 L39 -60 L34 -10 L6 9 Z" />
      <Ink palette={p} fill={p.metal} path="M-36 -57 L-23 -79 L23 -79 L35 -57 L27 -14 L4 0 L-24 -17 Z" />
      <Path path="M-29 -55 L-18 -71 L-4 -72 L-8 -19 L-24 -25 Z" color={p.light} />
      <Ink palette={p} fill={p.deep} path="M-31 -48 L30 -48 L29 -31 L-30 -31 Z" />
      <Seam path="M-23 -40 L-9 -40 M8 -40 L23 -40" color={p.jewel} width={4} />
      <Ink palette={p} fill={p.edge} path="M-6 -85 L-8 -113 L4 -130 L14 -111 L11 -85 L14 -9 L1 0 L-10 -12 Z" />
      <Seam path="M-18 -21 L-18 -12 M20 -21 L20 -12" color={p.deep} width={3} />
    </>}
  </Group>;
}

function Weapon({ design, back = false }: { design: CombatDesign; back?: boolean }) {
  const p = design.palette;
  if (back && design.weapon !== 'blades' && design.weapon !== 'hammer') return null;
  return <Group transform={[{ translateX: 15 }, { rotate: back ? -0.21 : 0.7 }]}>
    {design.weapon === 'staff' ? <>
      <Ink palette={p} fill={p.deep} path="M-4 -145 L4 -145 L6 99 L-5 105 Z" />
      <Seam path="M0 -134 L1 96" color={p.edge} width={2.5} />
      <Ink palette={p} fill={p.metal} path="M-22 -157 Q-36 -185 -11 -205 L-15 -179 L0 -164 L16 -182 L11 -207 Q39 -183 22 -156 L7 -146 L-7 -146 Z" />
      <Circle cx={0} cy={-182} r={12} color={p.jewel} />
      <Circle cx={-3} cy={-186} r={4} color={p.edge} />
      <Gem x={0} y={-145} palette={p} size={9} />
    </> : design.weapon === 'blades' ? <>
      <Ink palette={p} fill={p.light} path="M-6 -12 Q-20 -44 8 -91 L29 -111 Q14 -57 21 -34 L8 -5 Z" />
      <Path path="M8 -19 Q0 -53 21 -94 Q2 -44 15 -31 Z" color={p.clothLight} />
      <Ink palette={p} fill={p.deep} path="M-12 -7 L18 -14 L23 -5 L-10 3 Z" />
      <Ink palette={p} fill={p.cloth} path="M0 0 L9 -2 L13 27 L4 31 Z" />
      <Gem x={8} y={26} palette={p} size={6} />
    </> : design.weapon === 'bow' ? <>
      <Seam path="M1 -112 Q69 -61 40 1 Q64 65 0 116" color={p.outline} width={12} />
      <Seam path="M1 -112 Q69 -61 40 1 Q64 65 0 116" color={p.light} width={7} />
      <Seam path="M1 -112 L18 2 L0 116" color={p.edge} width={1.7} />
      <Ink palette={p} fill={p.clothLight} path="M31 -62 L44 -91 L50 -64 L43 -35 Z" />
      <Ink palette={p} fill={p.cloth} path="M35 42 L54 64 L47 85 L32 62 Z" />
      <Gem x={40} y={0} palette={p} size={10} />
    </> : design.weapon === 'hammer' && back ? <>
      <Ink palette={p} fill={p.deep} path="M-28 -64 L21 -77 L70 -59 L67 26 L26 84 L-25 35 Z" width={4} />
      <Ink palette={p} fill={p.metal} path="M-18 -53 L21 -64 L57 -49 L54 20 L25 64 L-14 28 Z" />
      <Path path="M21 -57 L24 56 L-7 24 L-11 -46 Z" color={p.light} />
      <Seam path="M-12 -47 L20 -57 L50 -45 L48 18 L25 53 L-8 23 Z" color={p.edge} width={3} />
      <Gem x={23} y={-7} palette={p} size={24} />
    </> : design.weapon === 'hammer' ? <>
      <Ink palette={p} fill={p.deep} path="M-5 -108 L5 -108 L7 78 L-6 79 Z" />
      <Seam path="M0 -99 L0 70" color={p.light} width={3} />
      <Ink palette={p} fill={p.metal} path="M-54 -128 L42 -128 L54 -117 L51 -76 L-50 -76 L-60 -90 Z" width={3} />
      <Path path="M-49 -120 L38 -120 L44 -109 L-46 -109 Z" color={p.light} />
      <Ink palette={p} fill={p.edge} path="M-17 -134 L13 -134 L16 -70 L-15 -70 Z" />
      <Gem x={0} y={-102} palette={p} size={15} />
    </> : design.weapon === 'sword' ? <>
      <Ink palette={p} fill={p.light} path="M-15 -28 L-13 -151 L0 -179 L14 -151 L16 -28 L0 -13 Z" />
      <Path path="M0 -169 L11 -148 L11 -33 L0 -21 Z" color={p.metal} />
      <Seam path="M0 -158 L0 -36" color={p.edge} width={2.5} />
      <Ink palette={p} fill={p.metal} path="M-34 -21 L-17 -33 L0 -24 L19 -32 L35 -20 L28 -11 L0 -15 L-29 -11 Z" />
      <Ink palette={p} fill={p.clothDark} path="M-6 -13 L7 -13 L8 43 L-6 43 Z" />
      <Seam path="M-4 0 L6 6 M-4 13 L6 19 M-4 26 L6 32" color={p.light} />
      <Gem x={0} y={46} palette={p} size={10} />
    </> : <>
      <Ink palette={p} fill={p.deep} path="M-5 -133 L5 -133 L7 90 L-5 91 Z" />
      <Seam path="M0 -125 L0 84" color={p.light} width={3} />
      <Ink palette={p} fill={p.light} path="M0 -127 L36 -154 Q29 -119 69 -104 Q41 -66 5 -86 L-27 -83 Q-53 -99 -45 -132 L-17 -118 Z" width={3} />
      <Path path="M9 -119 L31 -135 Q31 -113 55 -104 Q36 -87 13 -96 Z" color={p.metal} />
      <Seam path="M-35 -125 Q-38 -104 -23 -94 M34 -141 Q31 -116 60 -104" color={p.edge} width={3} />
      <Gem x={0} y={-106} palette={p} size={13} />
    </>}
  </Group>;
}

function BoneArt({ name, design }: { name: BoneName; design: CombatDesign }) {
  const custom = !['sentinel', 'warden'].includes(design.silhouette);
  const skin = design.silhouette === 'warden' ? reference.skins.warden : reference.skins.sentinel;
  const nodes: Partial<Record<BoneName, VectorNode>> = skin.bones;
  if (custom && name === 'torso') return <Body design={design} />;
  if (custom && name === 'head') return <Head design={design} />;
  if (custom && name === 'root') return null;
  const node = nodes[name];
  const gauntlet = name === 'handFront' || name === 'handBack';
  return <Group>
    {gauntlet ? <Weapon design={design} back={name === 'handBack'} /> : null}
    {node ? <VectorArt node={node} palette={design.palette} /> : null}
  </Group>;
}

function Bone({ index, pose, design }: { index: number; pose: DerivedValue<RigPose>; design: CombatDesign }) {
  const bone = RIG[index];
  const transform = useDerivedValue(() => [
    { translateX: index === 0 ? pose.value[0] : bone.x },
    { translateY: index === 0 ? pose.value[1] : bone.y },
    { rotate: pose.value[index + 3] },
    { scaleY: index === 1 ? pose.value[2] : 1 },
  ]);
  const children = RIG.map((child, childIndex) => ({ ...child, index: childIndex }))
    .filter((child) => child.parentIndex === index && child.index < 16);
  const order: (number | 'art')[] = index === 0 ? [10, 13, 'art', 1]
    : index === 1 ? [4, 'art', 2, 7] : ['art', ...children.map((child) => child.index)];
  return <Group transform={transform}>
    {order.map((item) => item === 'art'
      ? <BoneArt key="art" name={bone.name} design={design} />
      : <Bone key={item} index={item} pose={pose} design={design} />)}
  </Group>;
}

function CapePanel({ node, matrices, palette }: {
  node: VectorNode; matrices: DerivedValue<readonly BoneMatrix[]>; palette: CombatPalette;
}) {
  const points = node.points, weights = node.weights;
  if (!points || !weights || weights.length !== points.length || !node.fill) {
    throw new Error('Imported cape must contain weighted vertices and a pigment.');
  }
  const bind = [reference.bind.capeRoot, reference.bind.capeMid, reference.bind.capeTip];
  const path = useDerivedValue(() => {
    const result = Skia.PathBuilder.Make();
    points.forEach(([x, y], vertex) => {
      let px = 0, py = 0;
      for (let bone = 0; bone < 3; bone += 1) {
        const rest = bind[bone], matrix = matrices.value[16 + bone];
        const dx = x - rest.x, dy = y - rest.y;
        const localX = dx * Math.cos(rest.rotation) + dy * Math.sin(rest.rotation);
        const localY = -dx * Math.sin(rest.rotation) + dy * Math.cos(rest.rotation);
        px += (matrix.x + matrix.a * localX + matrix.c * localY) * weights[vertex][bone];
        py += (matrix.y + matrix.b * localX + matrix.d * localY) * weights[vertex][bone];
      }
      if (vertex === 0) result.moveTo(px, py);
      else result.lineTo(px, py);
    });
    result.close();
    return result.detach();
  });
  return <Group>
    <Path path={path} color={color(node.fill.color, palette)} />
    {node.stroke ? <Path path={path} style="stroke" color={color(node.stroke.color, palette)}
      strokeWidth={node.stroke.width} strokeJoin="round" /> : null}
  </Group>;
}

export function FighterRig({ fighterId, pose, matrices }: {
  fighterId: FighterId; pose: DerivedValue<RigPose>; matrices: DerivedValue<readonly BoneMatrix[]>;
}) {
  const design = COMBAT_ROSTER[fighterId];
  const scarfTransform = useDerivedValue(() => [
    { translateX: matrices.value[16].x }, { translateY: matrices.value[16].y },
    { rotate: Math.atan2(matrices.value[16].b, matrices.value[16].a) },
  ]);
  return <Group>
    {design.silhouette === 'assassin' ? <Group transform={scarfTransform}>
      <Ink palette={design.palette} fill={design.palette.cloth} path="M0 -13 L65 -6 L123 13 L86 22 L109 37 L48 23 L-3 13 Z" />
      <Seam path="M9 -5 L61 3 L98 15" color={design.palette.clothLight} width={3} />
    </Group> : design.silhouette !== 'bastion' ? reference.skins.sentinel.cape.map((node, index) =>
      <CapePanel key={index} node={node} matrices={matrices} palette={design.palette} />) : null}
    <Bone index={0} pose={pose} design={design} />
  </Group>;
}
