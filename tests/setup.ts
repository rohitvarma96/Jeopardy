import { beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '@shopify/react-native-skia/jestSetup';

import { useBattleStore } from '../src/features/battle/store';
import { useMatchSetupStore } from '../src/features/match-setup/store';
import { usePlayerStore } from '../src/store/player-store';

// Keep the upstream Skia mock on the CommonJS build used by this Jest preset.
jest.mock('@shopify/react-native-skia/lib/module/mock', () =>
  jest.requireActual('@shopify/react-native-skia/lib/commonjs/mock'),
);

jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/src/mock'),
);
// The upstream mock imports native CSS initialization, which has no implementation in Jest.
jest.mock('react-native-reanimated/src/initializers.native', () => ({ initializeReanimatedModule: jest.fn() }));
jest.mock('react-native-reanimated', () => {
  const mock = jest.requireActual<typeof import('react-native-reanimated')>('react-native-reanimated/mock');
  const { useRef } = jest.requireActual<typeof import('react')>('react');
  return {
    ...mock,
    useSharedValue: function useSharedValue<T>(initial: T) {
      return useRef(mock.useSharedValue(initial)).current;
    },
  };
});

// Metro font assets are checked on Android, not loaded by the Node test renderer.
jest.mock('expo-font', () => ({
  ...jest.requireActual<typeof import('expo-font')>('expo-font'),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(async () => {}),
  useFonts: jest.fn(() => [true, null]),
}));

// In-memory storage provided by the package; device persistence is checked on Android.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Module-level stores outlive a render; start every test from a cold launch.
beforeEach(async () => {
  await AsyncStorage.clear();
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  useMatchSetupStore.setState(useMatchSetupStore.getInitialState(), true);
  useBattleStore.setState(useBattleStore.getInitialState(), true);
});
