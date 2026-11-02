import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, layout, radii } from '../../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type IconSlotProps = {
  name: IconName;
  label?: string;
  size?: 'small' | 'large';
};

export function IconSlot({ name, label, size = 'large' }: IconSlotProps) {
  return (
    <View
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={[styles.base, size === 'large' ? styles.large : styles.small]}
    >
      <Ionicons name={name} size={layout.iconSmall} color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background,
    borderRadius: radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { width: layout.iconLarge, height: layout.iconLarge },
  small: { width: layout.iconSmall, height: layout.iconSmall },
});
