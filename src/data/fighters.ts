import type { IconName } from '../components/ui/IconSlot';
import type { Fighter, FighterId } from '../game/types/fighter';

export const DEFAULT_FIGHTER_ID: FighterId = 'arcane';

/** Active once-per-match passives; see docs/GAMEPLAY_DECISIONS.md. */
export const FIGHTERS = [
  {
    id: 'arcane',
    name: 'Arcane',
    role: 'Knowledge mage',
    identity: 'Scholarly, intelligent and arcane.',
    icon: 'book-outline',
    passive: {
      name: 'Arcane Insight',
      description: 'Once per match: your first correct answer deals +3 damage.',
      trigger: 'first-correct-answer',
      amount: 3,
    },
  },
  {
    id: 'shadow',
    name: 'Shadow',
    role: 'Speed specialist',
    identity: 'Agile, precise and elusive.',
    icon: 'flash-outline',
    passive: {
      name: 'Swift Strike',
      description:
        'Once per match: your first correct answer in the first half of the timer deals +3 damage.',
      trigger: 'first-fast-correct-answer',
      amount: 3,
    },
  },
  {
    id: 'sylva',
    name: 'Sylva',
    role: 'Tactical ranger',
    identity: 'Observant, strategic and nature-aligned.',
    icon: 'leaf-outline',
    passive: {
      name: 'Keen Eye',
      description: 'Once per match: your first correct answer deals +3 damage.',
      trigger: 'first-correct-answer',
      amount: 3,
    },
  },
  {
    id: 'titan',
    name: 'Titan',
    role: 'Defensive knight',
    identity: 'Resilient, protective and powerful.',
    icon: 'shield-half-outline',
    passive: {
      name: 'Bulwark',
      description: 'Once per match: the first attack that hits you deals 3 less damage.',
      trigger: 'first-incoming-hit',
      amount: 3,
    },
  },
] as const satisfies readonly (Fighter & { icon: IconName })[];

export function isFighterId(value: unknown): value is FighterId {
  return FIGHTERS.some((fighter) => fighter.id === value);
}

export function getFighter(id: FighterId) {
  const fighter = FIGHTERS.find((entry) => entry.id === id);
  if (!fighter) throw new Error(`Unknown fighter: ${id}`);
  return fighter;
}
