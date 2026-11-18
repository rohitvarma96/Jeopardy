import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { volt } from '../../theme';
import { AppText } from '../ui';
import { WorldIcon, type WorldIconName } from './WorldIcon';

export const worldColors = { ink: '#10131A', panel: '#1C222C', paper: '#F3EFE2', acid: '#EEFA36', pink: '#FF287B', muted: '#B3BBC7' } as const;

export function SceneText({ children, muted = false, style }: {
  children: ReactNode; muted?: boolean; style?: StyleProp<import('react-native').TextStyle>;
}) {
  return <AppText style={[{ color: muted ? worldColors.muted : worldColors.paper, fontSize: 13, lineHeight: 19 }, style]}>{children}</AppText>;
}

export function SigilButton({ icon, label, onPress, disabled = false, selected = false, badge, size = 48 }: {
  icon: WorldIconName; label: string; onPress: () => void; disabled?: boolean;
  selected?: boolean; badge?: number; size?: number;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled, selected }} disabled={disabled}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={onPress}
    style={({ pressed }) => [styles.sigil, { minWidth: size, minHeight: size },
      selected && styles.selected, focused && styles.focused, disabled && styles.disabled, pressed && styles.pressed]}>
    <WorldIcon name={icon} color={selected ? worldColors.ink : worldColors.paper} />
    {badge && badge > 0 ? <View style={styles.badge}><AppText allowFontScaling={false} style={styles.badgeText}>{badge}</AppText></View> : null}
  </Pressable>;
}

function ActionPlate({ color, inset = 0 }: { color: string; inset?: number }) {
  const cut = 12 - inset;
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { top: inset, right: inset, bottom: inset, left: inset }]}>
    <View testID={inset === 0 ? 'scene-action-fill' : undefined}
      style={[styles.plateCenter, { left: cut, right: cut, backgroundColor: color }]} />
    <View style={[styles.plateLeft, { top: cut, width: cut, backgroundColor: color }]} />
    <View style={[styles.plateRight, { bottom: cut, width: cut, backgroundColor: color }]} />
    <View testID={inset === 0 ? 'scene-action-top-cut' : undefined}
      style={[styles.plateTopCut, { borderLeftWidth: cut, borderBottomWidth: cut, borderBottomColor: color }]} />
    <View style={[styles.plateBottomCut, { borderRightWidth: cut, borderTopWidth: cut, borderTopColor: color }]} />
  </View>;
}

export type SceneActionVariant = 'primary' | 'signal' | 'outline';

export function SceneAction({ label, accessibilityLabel = label, icon = 'deploy', onPress, disabled = false, loading = false, variant = 'primary', style }: {
  label: string; accessibilityLabel?: string; icon?: WorldIconName; onPress: () => void | Promise<void>; disabled?: boolean;
  loading?: boolean; variant?: SceneActionVariant; style?: StyleProp<ViewStyle>;
}) {
  const unavailable = disabled || loading;
  const [focus, setFocus] = useState({ active: false, unavailable });
  // Web can suppress blur when a focused action becomes disabled between phases.
  if (focus.unavailable !== unavailable) setFocus({ active: false, unavailable });
  const focused = focus.active && !unavailable;
  const fill = unavailable ? worldColors.panel : variant === 'outline' ? worldColors.ink
    : variant === 'signal' ? volt.color.red : volt.color.acid;
  const foreground = unavailable ? worldColors.muted : variant === 'outline' ? worldColors.paper : volt.color.ink;
  const rim = focused ? worldColors.paper : variant === 'outline' ? '#718092' : fill;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled: unavailable, busy: loading }} disabled={unavailable}
    onFocus={() => setFocus({ active: true, unavailable })} onBlur={() => setFocus({ active: false, unavailable })} onPress={onPress}
    style={({ pressed }) => [styles.action, variant === 'signal' && styles.command, pressed && !unavailable && styles.pressed, style]}>
    <ActionPlate color={rim} />
    {focused || variant === 'outline' ? <ActionPlate color={fill} inset={focused ? 2 : 1} /> : null}
    <View pointerEvents="none" testID="scene-action-keyline" style={[styles.actionKeyline, {
      borderColor: focused ? worldColors.paper : unavailable || variant === 'outline' ? '#718092' : '#15151F80',
    }]} />
    <WorldIcon name={icon} size={30} color={foreground} />
    <AppText maxFontSizeMultiplier={1.2} style={[styles.actionText, { color: foreground }]}>
      {loading ? 'SAVING...' : label.toUpperCase()}
    </AppText>
  </Pressable>;
}

const styles = StyleSheet.create({
  sigil: { position: 'relative', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10131ACA', borderWidth: 1, borderColor: '#677183' },
  selected: { backgroundColor: worldColors.acid, borderColor: worldColors.acid },
  focused: { borderWidth: 2, borderColor: worldColors.paper },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.85 },
  action: {
    minHeight: 64, minWidth: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 18,
  },
  command: { minHeight: 72 },
  actionText: { fontFamily: volt.font.display, fontSize: 30, lineHeight: 34, flexShrink: 1, textAlign: 'center' },
  actionKeyline: { position: 'absolute', top: 6, right: 6, bottom: 6, left: 6, borderWidth: 1 },
  plateCenter: { position: 'absolute', top: 0, bottom: 0 },
  plateLeft: { position: 'absolute', left: 0, bottom: 0 },
  plateRight: { position: 'absolute', right: 0, top: 0 },
  plateTopCut: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, borderLeftColor: 'transparent' },
  plateBottomCut: { position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderRightColor: 'transparent' },
  badge: { position: 'absolute', right: -2, top: -4, backgroundColor: worldColors.pink, minWidth: 18, paddingHorizontal: 3, alignItems: 'center' },
  badgeText: { color: worldColors.paper, fontSize: 10, lineHeight: 18, fontWeight: '700' },
});
