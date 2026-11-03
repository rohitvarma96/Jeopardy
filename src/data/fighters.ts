import type { IconName } from '../components/ui/IconSlot';
import type { Fighter, FighterId } from '../game/types/fighter';

export const DEFAULT_FIGHTER_ID: FighterId = 'arcane';

/** Active once-per-match passives; see docs/GAMEPLAY_DECISIONS.md. */
export const FIGHTERS = [
  {
    id: 'arcane',
    name: 'Astral Sage',
    role: 'Celestial spellweaver',
    identity: 'A crescent-crowned scholar wielding a living star.',
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
    identity: 'A masked duelist with twin crescent blades and a crimson scarf.',
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
    role: 'Wildwood archer',
    identity: 'An antler-hooded guardian carrying a living thornbow.',
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
    role: 'Dawnforged juggernaut',
    identity: 'An imposing ivory sentinel with a tower shield and warhammer.',
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
    role: 'Solar greatsword knight',
    identity: 'Bronze plate, a flame-shaped crest and a sweeping crimson cape.',
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
    role: 'Glacial axe guardian',
    identity: 'Swept ivory horns, silver armour and a glacial-blue mantle.',
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
