import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';
import { IconSlot, type IconName } from './IconSlot';

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: IconName;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon = 'cube-outline',
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <IconSlot name={icon} />
      <AppText variant="heading">{title}</AppText>
      <AppText tone="secondary">{description}</AppText>
      {action}
    </View>
  );
}

export function LoadingState({ label }: { label: string }) {
  const reducedMotion = useReducedMotion();
  useLiveAnnouncement(label, 'polite');

  return (
    <View accessibilityLiveRegion="polite" style={styles.loading}>
      {reducedMotion ? (
        <IconSlot name="hourglass-outline" size="small" />
      ) : (
        <ActivityIndicator
          testID="loading-indicator"
          color={colors.primary}
          accessibilityElementsHidden
        />
      )}
      <AppText tone="secondary" style={styles.loadingLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.medium },
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  loadingLabel: { flexShrink: 1 },
});
