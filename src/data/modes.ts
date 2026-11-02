import type { IconName } from '../components/ui/IconSlot';
import type { GameMode, GameModeId } from '../game/types/match';

export const GAME_MODES = [
  {
    id: 'offline-duel',
    name: 'Offline Duel',
    description: 'Face an AI rival in a head-to-head battle of knowledge. No connection needed.',
    available: true,
    icon: 'flash-outline',
  },
  {
    id: 'ranked-online',
    name: 'Ranked Online',
    description: 'Live ranked matches against other players.',
    available: false,
    icon: 'trophy-outline',
  },
  {
    id: 'friend-challenge',
    name: 'Friend Challenge',
    description: 'Private duels with friends.',
    available: false,
    icon: 'people-outline',
  },
] as const satisfies readonly (GameMode & { icon: IconName })[];

export function isAvailableMode(id: unknown): id is GameModeId {
  return GAME_MODES.some((mode) => mode.id === id && mode.available);
}
