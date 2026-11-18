import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useMotionPreference } from './useReducedMotion';

/** Presentation lifecycle only; the battle clock deliberately remains independent. */
export function useSceneMotion(forceReduced = false) {
  const preference = useMotionPreference();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  return { enabled: focused && active && !preference.reduced && !forceReduced, ready: focused && preference.ready };
}

export function useBattleMotion(forceReduced = false) {
  return useSceneMotion(forceReduced).enabled;
}
