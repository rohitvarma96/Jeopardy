import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { cancelAnimation, Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';

import { CHEST_PRESENTATION_MS, CHEST_SKIP_MS } from '../components/player/chest-motion';
import { useSceneMotion } from './useBattleMotion';

export function useChestOpening({
  opening, opened, family, onComplete, assetsReady = true, suspended = false,
}: { opening: boolean; opened: boolean; family: string; onComplete?: () => void; assetsReady?: boolean; suspended?: boolean }) {
  const { enabled: motion, ready: motionReady } = useSceneMotion(suspended);
  const progress = useSharedValue(opened && !opening ? 1 : 0);
  const serial = useRef(0);
  const previousFamily = useRef(family);
  const previousOpening = useRef(opening);
  const hasReadMotion = useRef(false);
  const completed = useRef(false);
  const callback = useRef(onComplete);
  const state = useRef({ opening, opened });
  const active = useRef(true);
  useLayoutEffect(() => { callback.current = onComplete; state.current = { opening, opened }; }, [opening, opened, onComplete]);
  useLayoutEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const complete = useCallback((generation: number) => {
    if (!active.current || generation !== serial.current || completed.current || !state.current.opening || !state.current.opened) return;
    completed.current = true;
    callback.current?.();
  }, []);
  useEffect(() => {
    if (motionReady) hasReadMotion.current = true;
    const generation = ++serial.current;
    cancelAnimation(progress);
    completed.current = false;
    if (previousFamily.current !== family) { progress.set(0); previousFamily.current = family; }
    if (opening && !previousOpening.current) progress.set(0);
    previousOpening.current = opening;
    if (!opening) {
      progress.set(opened ? 1 : 0);
    } else if (!motionReady && !hasReadMotion.current) {
      // Initial focus/preference reads are not a request to skip the opening.
    } else if (!opened) {
      progress.set(0);
    } else if (!motion) {
      progress.set(1);
      complete(generation);
    } else if (!assetsReady) {
      progress.set(0);
    } else {
      const duration = Math.max(1, (1 - progress.get()) * CHEST_PRESENTATION_MS);
      progress.set(withTiming(1, { duration, easing: Easing.linear }, (finished) => {
        if (finished) runOnJS(complete)(generation);
      }));
    }
    return () => cancelAnimation(progress);
  }, [opening, opened, family, motion, motionReady, assetsReady, complete, progress]);
  const skip = useCallback(() => {
    if (!state.current.opening || !state.current.opened || completed.current) return;
    const generation = ++serial.current;
    cancelAnimation(progress);
    if (!motion) { progress.set(1); complete(generation); }
    else progress.set(withTiming(1, { duration: CHEST_SKIP_MS }, (finished) => {
      if (finished) runOnJS(complete)(generation);
    }));
  }, [motion, progress, complete]);
  return { progress, skip, motionActive: motion && motionReady };
}
