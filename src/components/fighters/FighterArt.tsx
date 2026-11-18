import { useState } from 'react';
import { Image } from 'react-native';

import { humanFighters } from '../../assets/human-fighters';
import { getFighter } from '../../data/fighters';
import type { FighterId } from '../../game/types/fighter';

export function FighterArt({ fighterId, height }: { fighterId: FighterId; height: number }) {
  const [error, setError] = useState<Error | null>(null);
  const art = humanFighters[fighterId];
  if (error) throw error;
  return <Image source={art.source} resizeMode="contain" accessible accessibilityRole="image"
    accessibilityLabel={`${getFighter(fighterId).name} artwork`}
    onError={(event) => setError(new Error(`Unable to load ${fighterId} artwork: ${event.nativeEvent.error}`))}
    style={{ height, width: height * art.width / art.height }} />;
}
