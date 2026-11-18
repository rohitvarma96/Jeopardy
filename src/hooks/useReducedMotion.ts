import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { usePlayerStore } from '../store/player-store';

export function useMotionPreference() {
  const preferReducedMotion = usePlayerStore((state) => state.settings.reducedMotion);
  const [system, setSystem] = useState({ reduced: true, ready: false });

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      receivedEvent = true;
      setSystem({ reduced: enabled, ready: true });
    });

    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        // A newer system event must win over the initial asynchronous read.
        if (active && !receivedEvent) setSystem({ reduced: enabled, ready: true });
      },
      (error: unknown) => {
        if (active) {
          console.warn(receivedEvent ? 'Unable to read reduced motion; using the last safe preference.'
            : 'Unable to read reduced motion; motion remains disabled.', error);
          setSystem((current) => current.ready ? current : { ...current, ready: true });
        }
      },
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return { reduced: system.reduced || preferReducedMotion, ready: system.ready };
}

export function useReducedMotion() {
  return useMotionPreference().reduced;
}
