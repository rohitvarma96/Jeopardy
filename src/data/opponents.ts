import type { Opponent } from '../game/types/match';

/** Local deterministic AI opponents. Matchmaking rotates through them by seed. */
export const OPPONENTS = [
  {
    id: 'ai-nightquill',
    name: 'NightQuill',
    level: 3,
    rank: 'Bronze II',
    fighterId: 'shadow',
    boosterIds: ['extra-time', 'double-damage', 'streak-saver'],
    banPriority: ['history', 'geography', 'music'],
    pickPriority: ['sports', 'technology', 'movies-tv'],
  },
  {
    id: 'ai-runescholar',
    name: 'RuneScholar',
    level: 4,
    rank: 'Bronze I',
    fighterId: 'arcane',
    boosterIds: ['50-50', 'mind-shield', 'double-damage'],
    banPriority: ['sports', 'movies-tv', 'music'],
    pickPriority: ['science', 'history', 'space'],
  },
  {
    id: 'ai-thornwatch',
    name: 'Thornwatch',
    level: 2,
    rank: 'Bronze III',
    fighterId: 'sylva',
    boosterIds: ['50-50', 'extra-time', 'mind-shield'],
    banPriority: ['technology', 'space', 'science'],
    pickPriority: ['geography', 'music', 'history'],
  },
  {
    id: 'ai-ironaegis',
    name: 'IronAegis',
    level: 5,
    rank: 'Silver III',
    fighterId: 'titan',
    boosterIds: ['mind-shield', 'extra-time', 'streak-saver'],
    banPriority: ['science', 'music', 'space'],
    pickPriority: ['history', 'sports', 'geography'],
  },
] as const satisfies readonly Opponent[];
