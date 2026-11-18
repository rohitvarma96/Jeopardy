import { Blend, Circle, FractalNoise, Group, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { memo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { atmosphereFrame, atmosphereMote, type AtmosphereKind } from './motion';

type Props = {
  width: number; height: number; time: SharedValue<number>; kind: AtmosphereKind; enabled: boolean;
};

function Smoke({ width, height, time, kind, floor }: Omit<Props, 'enabled'> & { floor: boolean }) {
  const radius = width * .74;
  const transform = useDerivedValue(() => {
    const frame = atmosphereFrame(time.get(), width, height, kind);
    return [
      { translateX: floor ? frame.floorX : frame.rearX },
      { translateY: floor ? frame.floorY : frame.rearY },
      { scaleY: height * (floor ? .12 : .28) / radius },
    ];
  });
  return <Group transform={transform} opacity={kind === 'battle' ? floor ? .16 : .13 : floor ? .23 : .2}>
    <Rect x={-radius} y={-radius} width={radius * 2} height={radius * 2}>
      <Blend mode="modulate">
        <FractalNoise freqX={floor ? .019 : .012} freqY={floor ? .028 : .017} octaves={3} seed={floor ? 31 : 17} />
        <RadialGradient c={vec(0, 0)} r={radius}
          colors={floor ? ['#92AABB', '#92AABB00'] : ['#AAA1C2', '#AAA1C200']} />
      </Blend>
    </Rect>
  </Group>;
}

function Mote({ index, width, height, time }: { index: number; width: number; height: number; time: SharedValue<number> }) {
  const frame = useDerivedValue(() => atmosphereMote(time.get(), index, width, height));
  const x = useDerivedValue(() => frame.get().x);
  const y = useDerivedValue(() => frame.get().y);
  const opacity = useDerivedValue(() => frame.get().opacity);
  return <Circle cx={x} cy={y} r={index % 3 === 0 ? 1.1 : .65} color="#D8DEEF" opacity={opacity} />;
}

export const SceneAtmosphere = memo(function SceneAtmosphere({ width, height, time, kind, enabled }: Props) {
  const light = useDerivedValue(() => atmosphereFrame(time.get(), width, height, kind).light);
  if (!enabled) return null;
  return <Group clip={{ x: 0, y: 0, width, height }}>
    <Rect x={0} y={0} width={width} height={height} opacity={light}>
      <RadialGradient c={vec(width * .53, height * .32)} r={Math.max(width, height) * .6}
        colors={['#FF426E', '#FF426E00']} />
    </Rect>
    <Smoke width={width} height={height} time={time} kind={kind} floor={false} />
    <Smoke width={width} height={height} time={time} kind={kind} floor />
    {Array.from({ length: kind === 'arena' ? 8 : 6 }, (_, index) =>
      <Mote key={index} index={index} width={width} height={height} time={time} />)}
  </Group>;
});
