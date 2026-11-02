export type PlayerProfile = {
  id: string;
  username: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  rank: string;
  coins: number;
  shards: number;
};

export type AvatarId = 'initials' | 'spark' | 'shield' | 'star';
export type PlayerSettings = { soundEnabled: boolean; reducedMotion: boolean };
