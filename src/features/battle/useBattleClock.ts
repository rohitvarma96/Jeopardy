import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useBattleStore } from './store';

export const TICK_MS = 250;

const isActive = (state: string | null | undefined) => state !== 'background' && state !== 'inactive';

/**
 * Drives battle time while enabled and the app is in the foreground. Timers keep running in the
 * background (the engine works on timestamps), so resuming ticks immediately to catch up once.
 */
export function useBattleClock(enabled: boolean) {
  const tick = useBattleStore((state) => state.tick);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer !== null) return;
      tick();
      timer = setInterval(tick, TICK_MS);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };

    if (isActive(AppState.currentState)) start();
    const subscription = AppState.addEventListener('change', (next) => (isActive(next) ? start() : stop()));
    return () => {
      stop();
      subscription.remove();
    };
  }, [enabled, tick]);
}
