import type { IconName } from '../components/ui/IconSlot';
import type { Fighter, FighterId } from '../game/types/fighter';

export const DEFAULT_FIGHTER_ID: FighterId = 'arcane';

/** Active once-per-match passives; see docs/GAMEPLAY_DECISIONS.md. */
export const FIGHTERS = [
  {
    id: 'arcane',
    name: 'Astral Sage',
    role: 'Celestial strategist',
    identity: 'A silver-haired human tactician in an asymmetric coat, wielding a star-data device.',
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
    name: 'Nightblade',
    role: 'Eclipse assassin',
    identity: 'A sharp-eyed human infiltrator with short black hair, a crimson scarf and crescent bracers.',
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
    name: 'Thorn Ranger',
    role: 'Botanical scout',
    identity: 'A human field scout in an olive technical jacket carrying a botanical scanner.',
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
    name: 'Iron Bastion',
    role: 'Defensive engineer',
    identity: 'A broad-shouldered human engineer in an ivory utility coat with an energy shield.',
    icon: 'shield-half-outline',
    passive: {
      name: 'Bulwark',
      description: 'Once per match: the first attack that hits you deals 3 less damage.',
      trigger: 'first-incoming-hit',
      amount: 3,
    },
  },
  {
    id: 'ember',
    name: 'Ember Sentinel',
    role: 'Solar specialist',
    identity: 'A copper-haired human specialist in an orange utility jacket, shaping an amber light pulse.',
    icon: 'flame-outline',
    passive: {
      name: 'Solar Resolve',
      description: 'Once per match: your first correct answer deals +3 damage.',
      trigger: 'first-correct-answer',
      amount: 3,
    },
  },
  {
    id: 'frost',
    name: 'Frost Warden',
    role: 'Glacial analyst',
    identity: 'A silver-streaked human analyst in a blue-gray coat with a holographic wrist device.',
    icon: 'snow-outline',
    passive: {
      name: 'Glacial Guard',
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
