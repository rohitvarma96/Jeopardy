import { COLLECTIBLES, getCollectible, type CollectibleId, type Rarity } from '../data/collectibles';
import type { BattleState, BattleOutcome, FighterState, Side } from './battle/types';
import { createRng, hashSeed } from './random';
import type { BoosterId } from './types/booster';
import type { FighterId } from './types/fighter';
import type { PlayerProfile } from './types/player';

export const REWARD_RULES = {
  winXp: 100, lossXp: 50, correctXp: 5, winCoins: 50, lossCoins: 25,
  shards: { common: 5, rare: 15, epic: 40 },
  commonChance: 0.7, rareChance: 0.25,
} as const;

export type Capsule = { collectibleId: CollectibleId; opened: boolean; duplicate: boolean; shards: number };
export type MatchSummary = {
  matchId: string;
  seed: number;
  endedAtMs: number;
  outcome: BattleOutcome;
  startingHp: number;
  fighters: Record<Side, {
    name: string; fighterId: FighterId; hp: number; score: number;
    stats: FighterState['stats']; bestCombo: number; boostersUsed: BoosterId[];
  }>;
};
export type RewardRecord = MatchSummary & {
  xp: number;
  coins: number;
  levelBefore: number;
  levelAfter: number;
  capsule: Capsule | null;
};

export function xpForLevel(level: number) {
  if (!Number.isSafeInteger(level) || level < 1 || !Number.isSafeInteger(100 * (level + 1))) throw new RangeError('Level is outside the supported safe-integer range.');
  return 100 * (level + 1);
}

export function addXp(profile: PlayerProfile, amount: number): PlayerProfile {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('XP must be a non-negative safe integer.');
  let xp = profile.xp + amount;
  if (!Number.isSafeInteger(xp)) throw new RangeError('Accumulated XP is outside the supported range.');
  let level = profile.level;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
  }
  return { ...profile, xp, level, xpForNextLevel: xpForLevel(level) };
}

export function rollCollectible(seed: number, matchId: string): CollectibleId {
  const random = createRng(hashSeed('capsule-v1', seed, matchId));
  const roll = random();
  const rarity: Rarity = roll < REWARD_RULES.commonChance ? 'common'
    : roll < REWARD_RULES.commonChance + REWARD_RULES.rareChance ? 'rare' : 'epic';
  const pool = COLLECTIBLES.filter((item) => item.rarity === rarity);
  return pool[Math.floor(random() * pool.length)].id;
}

export function summarizeMatch(battle: BattleState): MatchSummary {
  if (battle.phase !== 'finished' || !battle.outcome) throw new Error('Only a finished match can earn rewards.');
  const summarize = (fighter: FighterState): MatchSummary['fighters']['player'] => ({
    name: fighter.name, fighterId: fighter.fighterId, hp: fighter.hp, score: fighter.stats.damageDealt,
    stats: { ...fighter.stats }, bestCombo: fighter.bestCombo,
    boostersUsed: fighter.boostersUsed.map((use) => use.boosterId),
  });
  return {
    matchId: battle.setup.matchId, seed: battle.setup.seed, endedAtMs: battle.outcome.atMs,
    outcome: { ...battle.outcome }, startingHp: battle.rules.startingHp,
    fighters: { player: summarize(battle.fighters.player), opponent: summarize(battle.fighters.opponent) },
  };
}

export function grantMatch(profile: PlayerProfile, match: MatchSummary): { profile: PlayerProfile; record: RewardRecord } {
  const forfeit = match.outcome.reason === 'forfeit';
  const won = match.outcome.winner === 'player';
  const xp = forfeit ? 0 : (won ? REWARD_RULES.winXp : REWARD_RULES.lossXp) + match.fighters.player.stats.correct * REWARD_RULES.correctXp;
  const coins = forfeit ? 0 : won ? REWARD_RULES.winCoins : REWARD_RULES.lossCoins;
  const next = addXp(profile, xp);
  if (!Number.isSafeInteger(next.coins + coins)) throw new RangeError('Coin balance is outside the supported range.');
  return {
    profile: { ...next, coins: next.coins + coins },
    record: {
      ...match, xp, coins, levelBefore: profile.level, levelAfter: next.level,
      capsule: forfeit ? null : { collectibleId: rollCollectible(match.seed, match.matchId), opened: false, duplicate: false, shards: 0 },
    },
  };
}

export function revealCapsule(record: RewardRecord, collectionIds: readonly CollectibleId[]) {
  if (!record.capsule) throw new Error('This match has no capsule.');
  if (record.capsule.opened) return { record, collectionIds: [...collectionIds], shards: 0 };
  const item = getCollectible(record.capsule.collectibleId);
  const duplicate = collectionIds.includes(item.id);
  const shards = duplicate ? REWARD_RULES.shards[item.rarity] : 0;
  return {
    record: { ...record, capsule: { ...record.capsule, opened: true, duplicate, shards } },
    collectionIds: duplicate ? [...collectionIds] : [...collectionIds, item.id],
    shards,
  };
}
