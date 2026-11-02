import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../../theme';
import { AppText } from './AppText';

type BadgeProps = {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <AppText variant="caption" style={tones[tone]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
  },
});

const tones = StyleSheet.create({
  neutral: { color: colors.textSecondary },
  accent: { color: colors.gold },
  success: { color: colors.success },
  danger: { color: colors.damage },
});
