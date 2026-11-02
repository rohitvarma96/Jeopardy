import { OPPONENTS } from '../data/opponents';
import { MATCH_RULES } from '../game/rules';
import type { FoundMatch, GameModeId } from '../game/types/match';

export type MatchmakingRequest = { modeId: GameModeId; seed: number };

/** Seam for a future real service; screens depend only on this interface. */
export interface MatchmakingService {
  findOpponent(request: MatchmakingRequest, signal: AbortSignal): Promise<FoundMatch>;
}

export class MatchmakingCancelledError extends Error {
  constructor() {
    super('Matchmaking was cancelled.');
    this.name = 'MatchmakingCancelledError';
  }
}

export function resolveMockMatch({ modeId, seed }: MatchmakingRequest): FoundMatch {
  if (!Number.isInteger(seed) || seed < 1) throw new RangeError('Seed must be a positive integer.');
  return { matchId: `local-${seed}`, seed, modeId, opponent: OPPONENTS[(seed - 1) % OPPONENTS.length] };
}

/** Offline, deterministic: the same seed always finds the same opponent after a fixed delay. */
export function createMockMatchmakingService(delayMs: number = MATCH_RULES.mockSearchMs): MatchmakingService {
  return {
    findOpponent(request, signal) {
      return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(new MatchmakingCancelledError());
        const onAbort = () => {
          clearTimeout(timer);
          reject(new MatchmakingCancelledError());
        };
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', onAbort);
          try {
            resolve(resolveMockMatch(request));
          } catch (error) {
            reject(error);
          }
        }, delayMs);
        signal.addEventListener('abort', onAbort, { once: true });
      });
    },
  };
}

export const mockMatchmaking = createMockMatchmakingService();
