import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing, volt } from '../../src/theme';

export const unstable_settings = { anchor: 'arena' };

export default function TabLayout() {
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: volt.color.acid,
        tabBarInactiveTintColor: volt.color.muted,
        tabBarStyle: {
          backgroundColor: volt.color.ink, borderTopColor: volt.color.border,
          height: Math.max(64, Math.ceil(56 * fontScale)) + insets.bottom,
        },
        tabBarItemStyle: { minHeight: layout.touchTarget, paddingVertical: spacing.xsmall },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: volt.font.technical,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="arena"
        options={{
          title: 'Arena',
          tabBarAccessibilityLabel: 'Arena tab',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="flash-outline" color={focused ? volt.color.acid : volt.color.muted} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="person-circle-outline" color={focused ? volt.color.acid : volt.color.muted} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
