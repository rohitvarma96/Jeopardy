import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { usePlayerStore } from '../src/store/player-store';
import { useBattleStore } from '../src/features/battle/store';
import { colors, volt } from '../src/theme';
import { navigationTheme } from '../src/theme/navigation';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'BarlowCondensed-ExtraBold': require('../assets/fonts/BarlowCondensed-ExtraBold.ttf'),
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
    Bangers: require('../assets/fonts/Bangers-Regular.ttf'),
  });
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

  if (fontError) throw fontError;
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: volt.color.ink, justifyContent: 'center' }}>
      <ActivityIndicator accessibilityLabel="Loading Brain Brawlers fonts" color={volt.color.acid} />
    </View>;
  }

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
