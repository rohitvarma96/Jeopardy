import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing, typography } from '../../src/theme';

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
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background, borderTopColor: colors.border,
          height: Math.max(64, Math.ceil(56 * fontScale)) + insets.bottom,
        },
        tabBarItemStyle: { minHeight: layout.touchTarget, paddingVertical: spacing.xsmall },
        tabBarLabelStyle: {
          fontSize: typography.label,
          fontWeight: typography.weight.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="arena"
        options={{
          title: 'Arena',
          tabBarAccessibilityLabel: 'Arena tab',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="flash-outline" color={focused ? colors.gold : colors.textSecondary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="person-circle-outline" color={focused ? colors.gold : colors.textSecondary} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
