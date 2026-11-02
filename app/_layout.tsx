import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { usePlayerStore } from '../src/store/player-store';
import { useBattleStore } from '../src/features/battle/store';
import { colors } from '../src/theme';
import { navigationTheme } from '../src/theme/navigation';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const hydratePlayer = usePlayerStore((state) => state.hydrate);
  useEffect(() => {
    void hydratePlayer();
  }, [hydratePlayer]);
  useEffect(() => {
    const claim = () => {
      const battle = useBattleStore.getState().battle;
      if (battle?.outcome) void usePlayerStore.getState().claimMatch(battle);
    };
    claim();
    return useBattleStore.subscribe(claim);
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
