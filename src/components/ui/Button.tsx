import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, layout, radii, spacing, typography } from '../../theme';
import { AppText } from './AppText';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  accessibilityState,
  ...props
}: ButtonProps) {
  const unavailable = disabled || loading;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: unavailable, busy: loading }}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        unavailable && styles.disabled,
        pressed && !unavailable && styles.pressed,
        style,
      ]}
    >
      {icon}
      <AppText variant="label" maxFontSizeMultiplier={1.3} style={[styles.label, variant === 'primary' && styles.primaryLabel, variant === 'gold' && styles.goldLabel]}>
        {loading ? `${label}...` : label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchTarget,
    minWidth: layout.touchTarget,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: radii.medium,
    borderWidth: layout.borderWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
  },
  primary: { backgroundColor: colors.primaryAction, borderColor: colors.primaryAction },
  gold: { backgroundColor: colors.gold, borderColor: colors.gold, minHeight: 54 },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  ghost: { backgroundColor: colors.transparent, borderColor: colors.transparent },
  label: { flexShrink: 1, textAlign: 'center', fontWeight: typography.weight.bold },
  primaryLabel: { color: colors.onPrimary },
  goldLabel: { color: colors.track, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
