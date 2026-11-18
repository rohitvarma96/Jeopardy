import { Tabs } from 'expo-router/js-tabs';

import { WorldNav } from '../../src/components/world/WorldNav';

export const unstable_settings = { anchor: 'arena' };

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="initialRoute"
      tabBar={(props) => <WorldNav {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Tabs.Screen name="arena" options={{ title: 'Arena' }} />
      <Tabs.Screen name="brawlers" options={{ title: 'Brawlers' }} />
      <Tabs.Screen name="armory" options={{ title: 'Armory' }} />
      <Tabs.Screen name="vault" options={{ title: 'Vault' }} />
      <Tabs.Screen name="career" options={{ title: 'Career' }} />
    </Tabs>
  );
}
