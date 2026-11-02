import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radii, spacing } from '../../theme';
import { AppText } from './AppText';

type SelectableCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  role?: 'radio' | 'checkbox';
  hint?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Selection is conveyed by text and icon as well as color (ARC-07). */
export function SelectableCard({
  label,
  selected,
  onPress,
  disabled = false,
  role = 'radio',
  hint,
  children,
  style,
}: SelectableCardProps) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {children}
      {selected ? (
        <View style={styles.marker} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Ionicons name="checkmark-circle" size={layout.iconSmall} color={colors.gold} />
          <AppText variant="caption" tone="accent">Selected</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: layout.touchTarget,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radii.large,
    padding: spacing.medium,
    gap: spacing.small,
  },
  selected: { borderColor: colors.gold },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  marker: { flexDirection: 'row', alignItems: 'center', gap: spacing.xsmall },
});
