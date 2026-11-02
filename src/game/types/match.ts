import type { BoosterLoadout } from './booster';
import type { FighterId } from './fighter';

export type CategoryId =
  | 'science'
  | 'sports'
  | 'history'
  | 'movies-tv'
  | 'space'
  | 'technology'
  | 'geography'
  | 'music';

export type Category = { id: CategoryId; name: string };

export type GameModeId = 'offline-duel' | 'ranked-online' | 'friend-challenge';

export type GameMode = {
  id: GameModeId;
  name: string;
  description: string;
  available: boolean;
};

export type Opponent = {
  id: string;
  name: string;
  level: number;
  rank: string;
  fighterId: FighterId;
  /** Fixed battle loadout used by the deterministic mock opponent. */
  boosterIds: BoosterLoadout;
  /** Deterministic draft strategy: first still-available category wins. */
  banPriority: readonly CategoryId[];
  pickPriority: readonly CategoryId[];
};

export type FoundMatch = {
  matchId: string;
  seed: number;
  modeId: GameModeId;
  opponent: Opponent;
};

export type DraftStage = 'ban' | 'pick' | 'complete';

export type DraftCategory = {
  categoryId: CategoryId;
  source: 'player' | 'opponent' | 'system';
};

export type DraftState = {
  stage: DraftStage;
  playerBan: CategoryId | null;
  opponentBan: CategoryId | null;
  playerPick: CategoryId | null;
  opponentPick: CategoryId | null;
  categories: readonly DraftCategory[];
};

export type MatchSetup = FoundMatch & {
  categories: readonly DraftCategory[];
  fighterId: FighterId;
  boosterIds: BoosterLoadout;
};
