import { isBattleBoosterId, isBoosterId } from '../../data/boosters';
import { MATCH_RULES } from '../../game/rules';
import type { BoosterId, BoosterLoadout } from '../../game/types/booster';

export function isValidLoadout(ids: unknown): ids is BoosterLoadout {
  return (
    Array.isArray(ids) &&
    ids.length === MATCH_RULES.loadoutSize &&
    ids.every(isBoosterId) &&
    new Set(ids).size === ids.length
  );
}

export function loadoutError(ids: readonly BoosterId[]): string | null {
  if (!ids.every(isBattleBoosterId)) return 'Second Chance is unavailable in continuous battles. Choose a different booster.';
  if (new Set(ids).size !== ids.length) return 'Boosters must be distinct.';
  if (ids.length !== MATCH_RULES.loadoutSize) {
    return `Select exactly ${MATCH_RULES.loadoutSize} boosters (${ids.length} selected).`;
  }
  return null;
}

/** Adds or removes a booster; never exceeds the loadout size or duplicates an entry. */
export function toggleBooster(selection: readonly BoosterId[], id: BoosterId): BoosterId[] {
  if (selection.includes(id)) return selection.filter((entry) => entry !== id);
  if (selection.length >= MATCH_RULES.loadoutSize) return [...selection];
  return [...selection, id];
}
