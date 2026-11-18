import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '../../store/player-store';
import { volt } from '../../theme';
import { AppText } from '../ui';
import { worldColors } from './SceneControls';
import { WorldIcon, type WorldIconName } from './WorldIcon';

const destinations: readonly { name: string; label: string; icon: WorldIconName }[] = [
  { name: 'arena', label: 'Arena', icon: 'arena' }, { name: 'brawlers', label: 'Brawlers', icon: 'brawlers' },
  { name: 'armory', label: 'Armory', icon: 'armory' }, { name: 'vault', label: 'Vault', icon: 'vault' },
  { name: 'career', label: 'Career', icon: 'career' },
];

export function WorldNav({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pending = usePlayerStore((store) => store.matches.filter((match) => match.capsule && !match.capsule.opened).length);
  return <View accessibilityRole="tablist" testID="world-navigation" style={[styles.nav, { paddingBottom: Math.max(4, insets.bottom) }]}>
    {destinations.map((destination) => {
      const route = state.routes.find((entry) => entry.name === destination.name);
      if (!route) throw new Error(`Missing world destination: ${destination.name}`);
      const focused = state.routes[state.index].key === route.key;
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={`${destination.label} tab`}
        accessibilityState={{ selected: focused }}
        onPress={() => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }}
        onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
        style={({ pressed }) => [styles.item, focused && styles.focused, pressed && { opacity: 0.7 }]}>
        <WorldIcon name={destination.icon} size={24} color={focused ? worldColors.acid : worldColors.paper} />
        <AppText allowFontScaling={false} style={[styles.label, focused && { color: worldColors.acid }]}>{destination.label.toUpperCase()}</AppText>
        {focused ? <View style={styles.notch} /> : null}
        {destination.name === 'vault' && pending > 0 ? <View style={styles.badge}><AppText allowFontScaling={false} style={styles.badgeText}>{pending}</AppText></View> : null}
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', backgroundColor: worldColors.ink, borderTopWidth: 1, borderTopColor: '#65718170', paddingTop: 2 },
  item: { flex: 1, minWidth: 0, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 5 },
  focused: { backgroundColor: '#EEFA3610' },
  label: { fontFamily: volt.font.technical, fontSize: 8, lineHeight: 12, color: worldColors.muted },
  notch: { position: 'absolute', top: 0, width: 24, height: 3, backgroundColor: worldColors.pink },
  badge: { position: 'absolute', top: 2, right: '22%', backgroundColor: worldColors.pink, paddingHorizontal: 3, minWidth: 14, alignItems: 'center' },
  badgeText: { color: worldColors.paper, fontSize: 8, lineHeight: 13, fontWeight: '700' },
});
