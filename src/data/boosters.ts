import type { IconName } from '../components/ui/IconSlot';
import type { Booster, BoosterId, BoosterLoadout } from '../game/types/booster';

export const DEFAULT_LOADOUT: BoosterLoadout = ['50-50', 'extra-time', 'mind-shield'];

// Generic Ionicons UI glyphs; booster raster artwork is excluded per docs/ASSET_MANIFEST.md.
export const BOOSTERS = [
  { id: '50-50', name: '50:50', effect: 'Removes two incorrect options from the current question.', icon: 'options-outline' },
  { id: 'extra-time', name: 'Extra Time', effect: 'Adds five seconds to the current question timer.', icon: 'hourglass-outline' },
  { id: 'second-chance', name: 'Second Chance', effect: 'Unavailable in continuous battles; every answer is final.', icon: 'refresh-outline' },
  {
    id: 'double-damage',
    name: 'Double Damage',
    effect: 'Doubles the next correct-answer base damage.',
    icon: 'flame-outline',
  },
  { id: 'mind-shield', name: 'Mind Shield', effect: 'Blocks the next incoming attack event.', icon: 'shield-outline' },
  { id: 'streak-saver', name: 'Streak Saver', effect: 'Preserves the current combo after one miss.', icon: 'link-outline' },
] as const satisfies readonly (Booster & { icon: IconName })[];

export function isBoosterId(value: unknown): value is BoosterId {
  return BOOSTERS.some((booster) => booster.id === value);
}

export function isBattleBoosterId(value: unknown): value is Exclude<BoosterId, 'second-chance'> {
  return isBoosterId(value) && value !== 'second-chance';
}

export function getBooster(id: BoosterId) {
  const booster = BOOSTERS.find((entry) => entry.id === id);
  if (!booster) throw new Error(`Unknown booster: ${id}`);
  return booster;
}
