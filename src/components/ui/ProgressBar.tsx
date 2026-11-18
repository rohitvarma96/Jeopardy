import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, layout, radii, spacing, volt } from '../../theme';
import { AppText } from './AppText';

export type ProgressBarProps = {
  label: string;
  value: number;
  max?: number;
  tone?: 'primary' | 'success' | 'danger';
  testID?: string;
  /** Opt in for battle HP only; labels and accessibility always expose the authoritative value. */
  animate?: boolean;
  showLabel?: boolean;
  appearance?: 'default' | 'volt';
};

export function ProgressBar({ label, value, max = 100, tone = 'primary', testID, animate = false, showLabel = true, appearance = 'default' }: ProgressBarProps) {
  const valid = Number.isFinite(value) && Number.isFinite(max) && max > 0;
  const bounded = valid ? Math.min(max, Math.max(0, value)) : 0;
  const percentage = valid ? (bounded / max) * 100 : 0;
  const fill = useSharedValue(percentage);

  useEffect(() => {
    fill.value = animate ? withTiming(percentage, { duration: 380 }) : percentage;
    return () => cancelAnimation(fill);
  }, [percentage, animate, fill]);

  const animatedFill = useAnimatedStyle(() => {
    const width: `${number}%` = `${fill.value}%`;
    return { width };
  });

  if (!valid) {
    throw new RangeError('ProgressBar requires a finite value and a finite positive maximum.');
  }

  const width: `${number}%` = `${percentage}%`;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: bounded, text: `${bounded} of ${max}` }}
      style={styles.container}
    >
      {showLabel ? <View style={styles.labels}>
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {bounded} / {max}
        </AppText>
      </View> : null}
      <View style={[styles.track, appearance === 'volt' && styles.voltTrack]}>
        <Animated.View
          testID={testID ? `${testID}-fill` : undefined}
          style={[styles.fill, fills[tone], appearance === 'volt' && styles.voltFill, { width }, animate && animatedFill]}
        />
      </View>
    </View>
  );
}

export function HealthBar(props: Omit<ProgressBarProps, 'tone'>) {
  return <ProgressBar {...props} tone="success" />;
}

const styles = StyleSheet.create({
  container: { gap: spacing.small },
  labels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.small },
  label: { flexShrink: 1 },
  track: {
    height: layout.barHeight,
    backgroundColor: colors.track,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.full },
  voltTrack: { backgroundColor: volt.color.ink, borderRadius: 0 },
  voltFill: { backgroundColor: volt.color.acid, borderRadius: 0 },
});

const fills = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.damage },
});
