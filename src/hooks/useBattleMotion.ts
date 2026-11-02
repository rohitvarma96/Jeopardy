import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useReducedMotion } from './useReducedMotion';

/** Presentation lifecycle only; the battle clock deliberately remains independent. */
export function useBattleMotion(forceReduced = false) {
  const reducedMotion = useReducedMotion();
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

  return focused && active && !reducedMotion && !forceReduced;
}
