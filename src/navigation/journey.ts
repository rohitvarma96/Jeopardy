import type { Href } from 'expo-router';

import type { IconName } from '../components/ui/IconSlot';
import { routes } from './routes';

export const journey = [
  {
    id: 'mode',
    href: routes.mode,
    title: 'Mode selection',
    description: 'Choose how to play. Only offline modes are available in this prototype.',
    icon: 'game-controller-outline',
  },
  {
    id: 'matchmaking',
    href: routes.matchmaking,
    title: 'Mock matchmaking',
    description: 'Simulated local search for a deterministic AI opponent. No network is used.',
    icon: 'search-outline',
  },
  {
    id: 'categoryDraft',
    href: routes.categoryDraft,
    title: 'Category draft',
    description: 'Ban one category, then pick one. Your opponent does the same; the system fills the rest.',
    icon: 'grid-outline',
  },
  {
    id: 'fighterSelect',
    href: routes.fighterSelect,
    title: 'Fighter selection',
    description: 'Choose your fighter. Your choice is saved on this device.',
    icon: 'person-outline',
  },
  {
    id: 'loadout',
    href: routes.loadout,
    title: 'Booster loadout',
    description: 'Equip exactly three distinct boosters. Your loadout is saved on this device.',
    icon: 'shield-outline',
  },
  {
    id: 'battleArena',
    href: routes.battleArena,
    title: 'Battle arena',
    description: 'You and your opponent answer the same question at the same time. Faster correct answers hit harder.',
    icon: 'flash-outline',
  },
  {
    id: 'result',
    href: routes.result,
    title: 'Results',
    description: 'Match outcome, final scores, battle stats and locally saved XP/coins.',
    icon: 'ribbon-outline',
  },
  {
    id: 'rewards',
    href: routes.rewards,
    title: 'Reward reveal',
    description: 'Reveal your local capsule; new collectibles are saved and duplicates become shards.',
    icon: 'gift-outline',
  },
] as const satisfies readonly {
  id: string;
  href: Href;
  title: string;
  description: string;
  icon: IconName;
}[];

export type JourneyStepId = (typeof journey)[number]['id'];
