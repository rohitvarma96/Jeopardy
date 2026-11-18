import type { Href } from 'expo-router';

export const routes = {
  arena: '/(tabs)/arena',
  brawlers: '/(tabs)/brawlers',
  armory: '/(tabs)/armory',
  vault: '/(tabs)/vault',
  career: '/(tabs)/career',
  profile: '/profile',
  mode: '/battle/mode',
  matchmaking: '/battle/matchmaking',
  categoryDraft: '/battle/category-draft',
  versus: '/battle/versus',
  fighterSelect: '/battle/fighter-select',
  loadout: '/battle/loadout',
  battleArena: '/battle/arena',
  result: '/battle/result',
  animationPreview: '/battle/animation-preview',
  rewards: '/battle/rewards',
  settings: '/settings',
  designLab: '/design-lab',
  chestForge: '/chest-forge',
  brandStudio: '/brand-studio',
} as const satisfies Record<string, Href>;

export type TabHref = typeof routes.arena | typeof routes.profile | typeof routes.brawlers |
  typeof routes.armory | typeof routes.vault | typeof routes.career;
