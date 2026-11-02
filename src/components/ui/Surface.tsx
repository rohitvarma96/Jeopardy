import { StyleSheet, View, type ViewProps } from 'react-native';

import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { colors, layout, radii, shadows, spacing } from '../../theme';
import { AppText } from './AppText';

export function Panel({ style, ...props }: ViewProps) {
  useLiveAnnouncement(props.accessibilityLabel ?? '', props.accessibilityLiveRegion);
  return <View {...props} style={[styles.panel, style]} />;
}

type CardProps = ViewProps & {
  title?: string;
  description?: string;
};

export function Card({ title, description, children, style, ...props }: CardProps) {
  return (
    <Panel {...props} style={[shadows.card, style]}>
      {title ? <AppText variant="heading">{title}</AppText> : null}
      {description ? <AppText tone="secondary">{description}</AppText> : null}
      {children}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: layout.borderWidth,
    borderRadius: radii.large,
    padding: spacing.medium,
    gap: spacing.medium,
  },
});
