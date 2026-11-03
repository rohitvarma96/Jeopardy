import { DEFAULT_LOADOUT, getBooster } from './boosters';
import { getFighter } from './fighters';
import type { BoosterId } from '../game/types/booster';
import type { FighterId } from '../game/types/fighter';

export type Rarity = 'common' | 'rare' | 'epic';
export type CollectibleId = `fighter:${FighterId}` | `booster:${BoosterId}`;
export type Collectible =
  | { id: CollectibleId; kind: 'fighter'; fighterId: FighterId; rarity: Rarity }
  | { id: CollectibleId; kind: 'booster'; boosterId: BoosterId; rarity: Rarity };

export const COLLECTIBLES: readonly Collectible[] = [
  { id: 'fighter:arcane', kind: 'fighter', fighterId: 'arcane', rarity: 'common' },
  { id: 'fighter:shadow', kind: 'fighter', fighterId: 'shadow', rarity: 'rare' },
  { id: 'fighter:sylva', kind: 'fighter', fighterId: 'sylva', rarity: 'rare' },
  { id: 'fighter:titan', kind: 'fighter', fighterId: 'titan', rarity: 'epic' },
  { id: 'fighter:ember', kind: 'fighter', fighterId: 'ember', rarity: 'rare' },
  { id: 'fighter:frost', kind: 'fighter', fighterId: 'frost', rarity: 'epic' },
  { id: 'booster:50-50', kind: 'booster', boosterId: '50-50', rarity: 'common' },
  { id: 'booster:extra-time', kind: 'booster', boosterId: 'extra-time', rarity: 'common' },
  { id: 'booster:second-chance', kind: 'booster', boosterId: 'second-chance', rarity: 'rare' },
  { id: 'booster:mind-shield', kind: 'booster', boosterId: 'mind-shield', rarity: 'rare' },
  { id: 'booster:double-damage', kind: 'booster', boosterId: 'double-damage', rarity: 'epic' },
  { id: 'booster:streak-saver', kind: 'booster', boosterId: 'streak-saver', rarity: 'epic' },
];

export const STARTER_COLLECTION: readonly CollectibleId[] = [
  'fighter:arcane', ...DEFAULT_LOADOUT.map((id): CollectibleId => `booster:${id}`),
];

export function isCollectibleId(value: unknown): value is CollectibleId {
  return COLLECTIBLES.some((item) => item.id === value);
}

export function getCollectible(id: CollectibleId): Collectible {
  const item = COLLECTIBLES.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown collectible: ${id}`);
  return item;
}

export function collectibleName(item: Collectible) {
  return item.kind === 'fighter' ? getFighter(item.fighterId).name : getBooster(item.boosterId).name;
}
