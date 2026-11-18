import { loadoutError } from './loadout';
import { isFighterId } from '../../data/fighters';
import type { CollectibleId } from '../../data/collectibles';
import type { BoosterId, BoosterLoadout } from '../../game/types/booster';
import type { FighterId } from '../../game/types/fighter';
import { isBattleBoosterId } from '../../data/boosters';

export function preparationError(player: {
  status: string; fighterId: FighterId; boosterIds: readonly BoosterId[]; collectionIds: readonly CollectibleId[];
}): string | null {
  if (player.status !== 'ready') return 'Load local player data before deploying.';
  if (!isFighterId(player.fighterId) || !player.collectionIds.includes(`fighter:${player.fighterId}`)) return 'Equip an owned Brawler in the hangar.';
  const error = loadoutError(player.boosterIds);
  if (error) return error;
  if (!player.boosterIds.every((id) => player.collectionIds.includes(`booster:${id}`))) return 'Collect each equipped power before deploying.';
  return null;
}

export function replacePower(loadout: BoosterLoadout, slot: number, power: BoosterId): BoosterLoadout {
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) throw new RangeError('Choose one of the three power sockets.');
  if (!isBattleBoosterId(power)) throw new Error('This power is unavailable in continuous duels.');
  if (loadout.some((id, index) => id === power && index !== slot)) throw new Error('A power cannot occupy two sockets.');
  return [slot === 0 ? power : loadout[0], slot === 1 ? power : loadout[1], slot === 2 ? power : loadout[2]];
}
