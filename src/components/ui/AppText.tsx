import { Children } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { colors, typography } from '../../theme';

type TextVariant = 'caption' | 'label' | 'body' | 'heading' | 'title';
type TextTone = 'default' | 'secondary' | 'accent';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  accessibilityRole,
  ...props
}: AppTextProps) {
  const message = props.accessibilityLabel ?? Children.toArray(props.children)
    .filter((child) => typeof child === 'string' || typeof child === 'number').join('');
  useLiveAnnouncement(message, props.accessibilityLiveRegion);
  return (
    <Text
      {...props}
      accessibilityRole={
        accessibilityRole ?? (variant === 'heading' || variant === 'title' ? 'header' : undefined)
      }
      style={[styles.base, styles[variant], tones[tone], style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text, flexShrink: 1 },
  caption: {
    fontSize: typography.caption,
    lineHeight: typography.lineHeight.caption,
  },
  label: {
    fontSize: typography.label,
    lineHeight: typography.lineHeight.label,
    fontWeight: typography.weight.semibold,
  },
  body: {
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
  },
  heading: {
    fontSize: typography.heading,
    lineHeight: typography.lineHeight.heading,
    fontWeight: typography.weight.bold,
  },
  title: {
    fontSize: typography.title,
    lineHeight: typography.lineHeight.title,
    fontWeight: typography.weight.bold,
  },
});

const tones = StyleSheet.create({
  default: { color: colors.text },
  secondary: { color: colors.textSecondary },
  accent: { color: colors.gold },
});
