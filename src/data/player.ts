import type { AvatarId, PlayerProfile, PlayerSettings } from '../game/types/player';

export const PLAYER_AVATARS = [
  { id: 'initials', label: 'Initials', icon: 'person-outline' },
  { id: 'spark', label: 'Spark', icon: 'flash-outline' },
  { id: 'shield', label: 'Shield', icon: 'shield-outline' },
  { id: 'star', label: 'Star', icon: 'star-outline' },
] as const;

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = { soundEnabled: false, reducedMotion: false };
export const isAvatarId = (value: unknown): value is AvatarId =>
  PLAYER_AVATARS.some((avatar) => avatar.id === value);
export const normalizeUsername = (value: string) => value.trim().replace(/\s+/g, ' ');
export function usernameError(value: string): string | null {
  const name = normalizeUsername(value);
  return name.length < 2 || name.length > 24
    ? 'Use a player name between 2 and 24 characters.'
    : /[\u0000-\u001f\u007f]/.test(value) ? 'Player names cannot contain control characters.' : null;
}

/** Prototype starting profile; progression earned from matches is stored locally from Phase 6. */
export const DEMO_PLAYER: PlayerProfile = {
  id: 'local-player',
  username: 'Rookie Brawler',
  level: 3,
  xp: 240,
  xpForNextLevel: 400,
  rank: 'Bronze II',
  coins: 1250,
  shards: 40,
};
