import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { DEFAULT_LOADOUT } from '../data/boosters';
import { DEFAULT_FIGHTER_ID, isFighterId } from '../data/fighters';
import { STARTER_COLLECTION } from '../data/collectibles';
import { DEFAULT_PLAYER_SETTINGS, isAvatarId, normalizeUsername, usernameError } from '../data/player';
import { isValidLoadout } from '../features/loadout/loadout';
import type { BattleState } from '../game/battle/types';
import { grantMatch, revealCapsule, summarizeMatch, type RewardRecord } from '../game/rewards';
import type { BoosterLoadout } from '../game/types/booster';
import type { FighterId } from '../game/types/fighter';
import type { AvatarId, PlayerSettings } from '../game/types/player';
import { initialProfile, isPlayerSettings, isRecord, parsePlayerData, PLAYER_DATA_KEY, type PlayerData } from '../services/player-storage';

export const PLAYER_SELECTIONS_KEY = 'brain-brawl/player-selections';
const STORAGE_VERSION = 1;

export type PlayerSelections = { fighterId: FighterId; boosterIds: BoosterLoadout };

export const DEFAULT_SELECTIONS: PlayerSelections = {
  fighterId: DEFAULT_FIGHTER_ID,
  boosterIds: DEFAULT_LOADOUT,
};

/** Validates stored JSON field by field; anything missing or malformed falls back to defaults. */
export function parseStoredSelections(raw: string | null): { selections: PlayerSelections; repaired: boolean } {
  if (raw === null) return { selections: DEFAULT_SELECTIONS, repaired: false };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { selections: DEFAULT_SELECTIONS, repaired: true };
  }
  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const fighterId = isFighterId(record.fighterId) ? record.fighterId : DEFAULT_FIGHTER_ID;
  const boosterIds = isValidLoadout(record.boosterIds) ? record.boosterIds : DEFAULT_LOADOUT;
  const repaired =
    record.version !== STORAGE_VERSION ||
    fighterId !== record.fighterId ||
    boosterIds !== record.boosterIds;
  return { selections: { fighterId, boosterIds }, repaired };
}

type PlayerStore = PlayerData & {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  hydrate: () => Promise<void>;
  saveFighter: (fighterId: FighterId) => Promise<boolean>;
  saveLoadout: (boosterIds: BoosterLoadout) => Promise<boolean>;
  saveIdentity: (username: string, avatarId: AvatarId) => Promise<boolean>;
  saveSettings: (settings: PlayerSettings) => Promise<boolean>;
  reserveMatchId: () => Promise<string | null>;
  claimMatch: (battle: BattleState) => Promise<RewardRecord | null>;
  openCapsule: (matchId: string) => Promise<RewardRecord | null>;
};

const initialData = (): PlayerData => ({
  version: 3, ...DEFAULT_SELECTIONS, profile: initialProfile(),
  avatarId: 'initials', settings: { ...DEFAULT_PLAYER_SETTINGS },
  collectionIds: [...STARTER_COLLECTION], matches: [], nextMatchNumber: 1,
});
const snapshot = (state: PlayerData): PlayerData => ({
  version: 3, fighterId: state.fighterId, boosterIds: state.boosterIds, profile: state.profile,
  avatarId: state.avatarId, settings: state.settings,
  collectionIds: state.collectionIds, matches: state.matches, nextMatchNumber: state.nextMatchNumber,
});

export const usePlayerStore = create<PlayerStore>()((set, get) => {
  let hydration: Promise<void> | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  const report = (message: string, reason: unknown) => {
    console.warn(message, reason);
    set({ error: message });
  };
  const write = async (data: PlayerData) => {
    try {
      const serialized = JSON.stringify(data);
      parsePlayerData(serialized);
      await AsyncStorage.setItem(PLAYER_DATA_KEY, serialized);
    } catch (reason) {
      report('Unable to save player data. Your changes were not saved; please retry.', reason);
      return false;
    }
    set({ ...data, error: null });
    return true;
  };
  const transact = <T,>(work: () => Promise<T>): Promise<T> => {
    const operation = queue.then(work);
    queue = operation.then(() => undefined, () => undefined);
    return operation;
  };
  const ready = async () => {
    await get().hydrate();
    return get().status === 'ready';
  };

  return {
    ...initialData(), status: 'idle', error: null,
    hydrate: () => {
      if (get().status === 'ready') return Promise.resolve();
      if (hydration) return hydration;
      set({ status: 'loading', error: null });
      hydration = (async () => {
        try {
          const raw = await AsyncStorage.getItem(PLAYER_DATA_KEY);
          let data: PlayerData;
          if (raw === null) {
            const legacy = await AsyncStorage.getItem(PLAYER_SELECTIONS_KEY);
            const parsed = parseStoredSelections(legacy);
            data = initialData();
            const owned = data.collectionIds;
            if (owned.includes(`fighter:${parsed.selections.fighterId}`)) data.fighterId = parsed.selections.fighterId;
            if (parsed.selections.boosterIds.every((id) => owned.includes(`booster:${id}`))) data.boosterIds = parsed.selections.boosterIds;
            await AsyncStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(data));
            if (parsed.repaired || data.fighterId !== parsed.selections.fighterId || data.boosterIds !== parsed.selections.boosterIds) {
              console.warn('Legacy selections were repaired or reset to owned starter equipment.');
            }
          } else {
            data = parsePlayerData(raw);
            const stored: unknown = JSON.parse(raw);
            if (isRecord(stored) && stored.version === 2) await AsyncStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(data));
          }
          set({ ...data, status: 'ready', error: null });
        } catch (reason) {
          report('Unable to load player data. Stored data is unchanged; retry before playing or claiming rewards.', reason);
          set({ status: 'error' });
        }
      })().finally(() => { hydration = null; });
      return hydration;
    },
    saveIdentity: async (username, avatarId) => {
      const problem = usernameError(username);
      if (problem || !isAvatarId(avatarId)) throw new Error(problem ?? 'Choose a supported avatar.');
      if (!await ready()) return false;
      return transact(() => write({
        ...snapshot(get()), avatarId, profile: { ...get().profile, username: normalizeUsername(username) },
      }));
    },
    saveSettings: async (settings) => {
      if (!isPlayerSettings(settings)) throw new Error('Player settings must contain valid on/off preferences.');
      if (!await ready()) return false;
      return transact(() => write({ ...snapshot(get()), settings: { ...settings } }));
    },
    saveFighter: async (fighterId) => {
      if (!isFighterId(fighterId)) throw new Error(`Unknown fighter: ${String(fighterId)}`);
      if (!await ready()) return false;
      return transact(async () => {
        if (!get().collectionIds.includes(`fighter:${fighterId}`)) throw new Error('Collect this Brawler before equipping it.');
        return write({ ...snapshot(get()), fighterId });
      });
    },
    saveLoadout: async (boosterIds) => {
      if (!isValidLoadout(boosterIds)) throw new Error('A loadout needs exactly three distinct boosters.');
      if (!await ready()) return false;
      return transact(async () => {
        if (!boosterIds.every((id) => get().collectionIds.includes(`booster:${id}`))) throw new Error('Collect each booster before equipping it.');
        return write({ ...snapshot(get()), boosterIds });
      });
    },
    reserveMatchId: async () => {
      if (!await ready()) return null;
      return transact(async () => {
        const data = snapshot(get());
        const id = `reward-match-${data.nextMatchNumber}`;
        if (!Number.isSafeInteger(data.nextMatchNumber + 1)) throw new Error('Local match ID limit reached.');
        return await write({ ...data, nextMatchNumber: data.nextMatchNumber + 1 }) ? id : null;
      });
    },
    claimMatch: async (battle) => {
      const match = summarizeMatch(battle);
      if (!await ready()) return null;
      return transact(async () => {
        const data = snapshot(get());
        const existing = data.matches.find((entry) => entry.matchId === match.matchId);
        if (existing) return existing;
        let grant: ReturnType<typeof grantMatch>;
        try { grant = grantMatch(data.profile, match); } catch (reason) {
          if (!(reason instanceof RangeError)) throw reason;
          report('Reward values exceed supported limits. No rewards were granted.', reason);
          return null;
        }
        return await write({ ...data, profile: grant.profile, matches: [grant.record, ...data.matches] }) ? grant.record : null;
      });
    },
    openCapsule: async (matchId) => {
      if (!await ready()) return null;
      return transact(async () => {
        const data = snapshot(get());
        const record = data.matches.find((entry) => entry.matchId === matchId);
        if (!record) throw new Error('No reward record exists for this match.');
        if (!record.capsule) throw new Error('This match has no reward chest.');
        if (record.capsule.opened) return record;
        const reveal = revealCapsule(record, data.collectionIds);
        if (!Number.isSafeInteger(data.profile.shards + reveal.shards)) {
          report('Shard balance exceeds supported limits. The chest remains unopened.', new RangeError('Shard overflow'));
          return null;
        }
        return await write({
          ...data, collectionIds: reveal.collectionIds,
          profile: { ...data.profile, shards: data.profile.shards + reveal.shards },
          matches: data.matches.map((entry) => entry.matchId === matchId ? reveal.record : entry),
        }) ? reveal.record : null;
      });
    },
  };
});
