import { FilterMode, ImageShader, MipmapMode, Vertices, useImage } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { useDerivedValue, type DerivedValue, type SharedValue } from 'react-native-reanimated';

import { humanFighters } from '../../assets/human-fighters';
import type { FighterId } from '../../game/types/fighter';
import type { HumanPose } from './combat/human-rig';
import { deformPaintedMesh } from './combat/painted-mesh';
import { deformLobbyIdle } from './combat/lobby-idle';
import { paintedMeshFor } from './combat/painted-assets';
import { PaintedVaporization, type DefeatPaint } from './PaintedVaporization';

type Props = { fighterId: FighterId; onLoad?: () => void } & (
  { mode?: 'combat'; pose: DerivedValue<HumanPose>; defeat?: DefeatPaint } | { mode: 'lobby'; clock: SharedValue<number> }
);

export function HumanCombatArt(props: Props) {
  const { fighterId, onLoad } = props;
  const source = humanFighters[fighterId];
  const [error, setError] = useState<Error | null>(null);
  const image = useImage(source.source, setError);
  const mesh = useMemo(() => paintedMeshFor(fighterId), [fighterId]);
  const vertices = useDerivedValue(() => props.mode === 'lobby'
    ? deformLobbyIdle(mesh, fighterId, props.clock.get())
    : deformPaintedMesh(mesh, props.pose.get()));
  useEffect(() => { if (image) onLoad?.(); }, [image, onLoad]);
  if (error) throw error;
  if (!image) return null;
  if (props.mode !== 'lobby' && props.defeat) return <PaintedVaporization fighterId={fighterId}
    image={image} width={source.width} height={source.height} mesh={mesh} vertices={vertices} defeat={props.defeat} />;
  return <Vertices vertices={vertices} textures={mesh.textures} indices={mesh.indices} mode="triangles">
    <ImageShader image={image} tx="decal" ty="decal" sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} />
  </Vertices>;
}
