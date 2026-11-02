import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { usePlayerStore } from '../store/player-store';

export function useReducedMotion() {
  const preferReducedMotion = usePlayerStore((state) => state.settings.reducedMotion);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      receivedEvent = true;
      setReducedMotion(enabled);
    });

    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        // A newer system event must win over the initial asynchronous read.
        if (active && !receivedEvent) setReducedMotion(enabled);
      },
      (error: unknown) => {
        if (active) console.warn('Unable to read reduced motion; motion remains disabled.', error);
      },
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion || preferReducedMotion;
}
