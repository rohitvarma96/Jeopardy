import { useEffect } from 'react';
import { cancelAnimation, Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AMBIENT_PERIOD_MS } from '../components/atmosphere/motion';

export function useAmbientClock(enabled: boolean) {
  const time = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(time);
    time.set(0);
    if (enabled) time.set(withRepeat(withTiming(AMBIENT_PERIOD_MS, {
      duration: AMBIENT_PERIOD_MS, easing: Easing.linear,
    }), -1, false));
    return () => cancelAnimation(time);
  }, [enabled, time]);
  return time;
}
