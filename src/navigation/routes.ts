import type { Href } from 'expo-router';

export const routes = {
  arena: '/(tabs)/arena',
  profile: '/(tabs)/profile',
  mode: '/battle/mode',
  matchmaking: '/battle/matchmaking',
  categoryDraft: '/battle/category-draft',
  fighterSelect: '/battle/fighter-select',
  loadout: '/battle/loadout',
  battleArena: '/battle/arena',
  result: '/battle/result',
  animationPreview: '/battle/animation-preview',
  rewards: '/battle/rewards',
  settings: '/settings',
} as const satisfies Record<string, Href>;

export type TabHref = typeof routes.arena | typeof routes.profile;
