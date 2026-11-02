import { CATEGORY_IDS } from '../../data/categories';
import { seededShuffle } from '../../game/random';
import { MATCH_RULES } from '../../game/rules';
import type { CategoryId, DraftCategory, DraftState, Opponent } from '../../game/types/match';

/**
 * Draft order (CTX-08): player ban -> opponent ban -> player pick -> opponent pick -> system.
 * The two picks and three seeded system choices form the shared question pool.
 */
export function createDraft(): DraftState {
  return {
    stage: 'ban',
    playerBan: null,
    opponentBan: null,
    playerPick: null,
    opponentPick: null,
    categories: [],
  };
}

export function availableCategories(draft: DraftState): CategoryId[] {
  const used = [draft.playerBan, draft.opponentBan, draft.playerPick, draft.opponentPick];
  return CATEGORY_IDS.filter((id) => !used.includes(id));
}

function opponentChoice(available: readonly CategoryId[], priority: readonly CategoryId[]) {
  const choice = priority.find((id) => available.includes(id)) ?? available[0];
  if (!choice) throw new Error('No category is available for the opponent.');
  return choice;
}

function assertAvailable(draft: DraftState, categoryId: CategoryId) {
  if (!availableCategories(draft).includes(categoryId)) {
    throw new Error(`Category ${categoryId} is not available.`);
  }
}

export function submitBan(draft: DraftState, categoryId: CategoryId, opponent: Opponent): DraftState {
  if (draft.stage !== 'ban') throw new Error('The ban phase is over.');
  assertAvailable(draft, categoryId);
  const afterPlayer = { ...draft, playerBan: categoryId };
  const opponentBan = opponentChoice(availableCategories(afterPlayer), opponent.banPriority);
  return { ...afterPlayer, opponentBan, stage: 'pick' };
}

export function submitPick(
  draft: DraftState,
  categoryId: CategoryId,
  opponent: Opponent,
  seed: number,
): DraftState {
  if (draft.stage !== 'pick') throw new Error('Picks are not open.');
  assertAvailable(draft, categoryId);
  const afterPlayer = { ...draft, playerPick: categoryId };
  const opponentPick = opponentChoice(availableCategories(afterPlayer), opponent.pickPriority);
  const picked = { ...afterPlayer, opponentPick };
  const shuffled = seededShuffle(availableCategories(picked), seed);
  const systemCount = MATCH_RULES.categoryCount - 2;
  const systemCategories = shuffled
    .slice(0, systemCount)
    .map((id): DraftCategory => ({ categoryId: id, source: 'system' }));

  return {
    ...picked,
    stage: 'complete',
    categories: [
      { categoryId, source: 'player' },
      { categoryId: opponentPick, source: 'opponent' },
      ...systemCategories,
    ],
  };
}

export function isDraftComplete(draft: DraftState | null): draft is DraftState {
  if (!draft || draft.stage !== 'complete') return false;
  const ids = draft.categories.map((category) => category.categoryId);
  return (
    ids.length === MATCH_RULES.categoryCount &&
    new Set(ids).size === ids.length &&
    !ids.some((id) => id === draft.playerBan || id === draft.opponentBan)
  );
}
