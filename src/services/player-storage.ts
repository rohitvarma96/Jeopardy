import { isBoosterId } from '../data/boosters';
import { getCollectible, isCollectibleId, STARTER_COLLECTION, type CollectibleId } from '../data/collectibles';
import { isFighterId } from '../data/fighters';
import { DEFAULT_PLAYER_SETTINGS, DEMO_PLAYER, isAvatarId } from '../data/player';
import { isValidLoadout } from '../features/loadout/loadout';
import { REWARD_RULES, xpForLevel, type RewardRecord } from '../game/rewards';
import type { BoosterLoadout } from '../game/types/booster';
import type { FighterId } from '../game/types/fighter';
import type { AvatarId, PlayerProfile, PlayerSettings } from '../game/types/player';

export const PLAYER_DATA_KEY = 'brain-brawl/player-data';
export type PlayerData = {
  version: 3;
  avatarId: AvatarId;
  settings: PlayerSettings;
  fighterId: FighterId;
  boosterIds: BoosterLoadout;
  profile: PlayerProfile;
  collectionIds: CollectibleId[];
  matches: RewardRecord[];
  nextMatchNumber: number;
};
type LegacyPlayerData = Omit<PlayerData, 'version' | 'avatarId' | 'settings'> & { version: 2 };

export function isPlayerSettings(value: unknown): value is PlayerSettings {
  return isRecord(value) && typeof value.soundEnabled === 'boolean' && typeof value.reducedMotion === 'boolean';
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number => Number.isSafeInteger(value) && typeof value === 'number' && value >= 0;
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

function validMatch(value: unknown): value is RewardRecord {
  if (!isRecord(value) || !text(value.matchId) || !count(value.seed) || !count(value.endedAtMs) ||
    !count(value.startingHp) || value.startingHp === 0 || !count(value.xp) || !count(value.coins) ||
    !count(value.levelBefore) || value.levelBefore === 0 || !count(value.levelAfter) || value.levelAfter === 0 ||
    !isRecord(value.outcome) || !['player', 'opponent'].includes(String(value.outcome.winner)) ||
    !['knockout', 'hp-lead', 'sudden-death', 'forfeit'].includes(String(value.outcome.reason)) || !count(value.outcome.atMs) ||
    !isRecord(value.fighters)) return false;
  for (const side of ['player', 'opponent']) {
    const fighter = value.fighters[side];
    if (!isRecord(fighter) || !text(fighter.name) || !isFighterId(fighter.fighterId) || !count(fighter.hp) ||
      fighter.hp > value.startingHp || !count(fighter.score) || !count(fighter.bestCombo) ||
      !Array.isArray(fighter.boostersUsed) || !fighter.boostersUsed.every(isBoosterId) || !isRecord(fighter.stats)) return false;
    const stats = fighter.stats;
    if (!['correct', 'wrong', 'timeouts', 'damageDealt', 'attacksBlocked'].every((key) => count(stats[key])) ||
      fighter.score !== stats.damageDealt) return false;
  }
  if (value.capsule === null) return value.outcome.reason === 'forfeit' && value.xp === 0 && value.coins === 0;
  const capsule = value.capsule;
  if (!isRecord(capsule) || !isCollectibleId(capsule.collectibleId) || typeof capsule.opened !== 'boolean' ||
    typeof capsule.duplicate !== 'boolean' || !count(capsule.shards) || value.outcome.reason === 'forfeit') return false;
  return capsule.opened
    ? capsule.shards === (capsule.duplicate ? REWARD_RULES.shards[getCollectible(capsule.collectibleId).rarity] : 0)
    : !capsule.duplicate && capsule.shards === 0;
}

function validPlayerData(value: unknown): value is PlayerData | LegacyPlayerData {
  if (!isRecord(value) || (value.version !== 2 && value.version !== 3) ||
    (value.version === 3 && (!isAvatarId(value.avatarId) || !isPlayerSettings(value.settings))) ||
    !isFighterId(value.fighterId) || !isValidLoadout(value.boosterIds) ||
    !isRecord(value.profile) || !text(value.profile.id) || !text(value.profile.username) || !text(value.profile.rank) ||
    !count(value.profile.level) || value.profile.level === 0 || !count(value.profile.xp) ||
    value.profile.xpForNextLevel !== xpForLevel(value.profile.level) || value.profile.xp >= value.profile.xpForNextLevel ||
    !count(value.profile.coins) || !count(value.profile.shards) ||
    !Array.isArray(value.collectionIds) || !value.collectionIds.every(isCollectibleId) ||
    new Set(value.collectionIds).size !== value.collectionIds.length ||
    !Array.isArray(value.matches) || !value.matches.every(validMatch) ||
    new Set(value.matches.map((match) => match.matchId)).size !== value.matches.length ||
    !count(value.nextMatchNumber) || value.nextMatchNumber === 0) return false;
  const collection = value.collectionIds;
  const nextMatchNumber = value.nextMatchNumber;
  return STARTER_COLLECTION.every((id) => collection.includes(id)) &&
    collection.includes(`fighter:${value.fighterId}`) &&
    value.boosterIds.every((id) => collection.includes(`booster:${id}`)) &&
    value.matches.every((match) => {
      const reserved = /^reward-match-(\d+)$/.exec(match.matchId);
      return (!reserved || Number(reserved[1]) < nextMatchNumber) &&
        (!match.capsule?.opened || collection.includes(match.capsule.collectibleId));
    });
}

/** Fail closed on a corrupt claim ledger rather than resetting it and granting old matches twice. */
export function parsePlayerData(raw: string): PlayerData {
  const value: unknown = JSON.parse(raw);
  if (!validPlayerData(value)) {
    throw new Error('Stored player data is malformed or uses an unsupported version. It has not been overwritten.');
  }
  return value.version === 2
    ? { ...value, version: 3, avatarId: 'initials', settings: { ...DEFAULT_PLAYER_SETTINGS } }
    : value;
}

export const initialProfile = (): PlayerProfile => ({ ...DEMO_PLAYER });
