import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import {
  Pressable, StyleSheet, View,
  type PressableProps, type StyleProp, type TextProps, type ViewProps, type ViewStyle,
} from 'react-native';

import { volt } from '../../theme';
import { AppText } from '../ui/AppText';
import type { IconName } from '../ui/IconSlot';
import { ProgressBar, type ProgressBarProps } from '../ui/ProgressBar';

type VoltTone = 'chalk' | 'ink' | 'muted' | 'red' | 'acid';
type VoltTextProps = TextProps & {
  variant?: keyof typeof volt.type;
  tone?: VoltTone;
};

export function VoltText({ variant = 'body', tone = 'chalk', style, accessibilityRole, ...props }: VoltTextProps) {
  const display = variant === 'display' || variant === 'title' || variant === 'heading';
  return (
    <AppText
      {...props}
      maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? (display ? 1.3 : undefined)}
      accessibilityRole={accessibilityRole ?? (display ? 'header' : undefined)}
      style={[
        volt.type[variant],
        display ? styles.displayFont : (variant === 'label' || variant === 'micro') && styles.technicalFont,
        { color: volt.color[tone] },
        style,
      ]}
    />
  );
}

export function VoltMark({ size = 40 }: { size?: number }) {
  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[styles.mark, { width: size, height: size }]}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={{
          position: 'absolute', width: size * 0.19, height: size * (index === 1 ? 0.62 : 0.38),
          backgroundColor: volt.color.ink, transform: [{ skewX: '-18deg' }],
          left: size * (0.18 + index * 0.22), top: size * (index === 0 ? 0.2 : index === 1 ? 0.19 : 0.42),
        }} />
      ))}
    </View>
  );
}

type VoltButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'signal' | 'outline';
  icon?: IconName;
  loading?: boolean;
  size?: 'regular' | 'compact';
  iconOnly?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function VoltButton({
  label, variant = 'primary', icon = 'arrow-forward', loading = false,
  disabled = false, size = 'regular', iconOnly = false, style, onFocus, onBlur, accessibilityState, ...props
}: VoltButtonProps) {
  const [focused, setFocused] = useState(false);
  const unavailable = disabled || loading;
  const foreground = variant === 'outline' ? volt.color.chalk : volt.color.ink;
  return (
    <Pressable {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={({ pressed }) => [
        styles.button, size === 'compact' && styles.compactButton, buttonVariants[variant], unavailable && styles.disabled,
        focused && styles.focused, pressed && !unavailable && styles.pressed, style,
      ]}
    >
      {!iconOnly ? <VoltText variant={size === 'compact' ? 'label' : 'heading'} maxFontSizeMultiplier={1.3} style={{ color: foreground, flex: 1 }}>
        {loading ? `${label.toUpperCase()}...` : label.toUpperCase()}
      </VoltText> : null}
      <Ionicons name={loading ? 'ellipsis-horizontal' : icon} size={22} color={foreground} accessible={false} />
    </Pressable>
  );
}

export function VoltPanel({
  tone = 'dark', children, style, ...props
}: ViewProps & { tone?: 'dark' | 'chalk' | 'signal'; children: ReactNode }) {
  return (
    <View {...props} style={[styles.panel, panelVariants[tone], style]}>
      {children}
    </View>
  );
}

export function VoltTag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'acid' | 'signal' }) {
  return (
    <View style={[styles.tag, tone === 'acid' && styles.acidTag, tone === 'signal' && styles.signalTag]}>
      <VoltText variant="micro" tone={tone === 'neutral' ? 'chalk' : 'ink'}>{label.toUpperCase()}</VoltText>
    </View>
  );
}

export function VoltSectionLabel({ index, label, light = false }: { index: string; label: string; light?: boolean }) {
  return (
    <View style={styles.sectionLabel}>
      <VoltText variant="micro" tone={light ? 'ink' : 'red'}>{index} /</VoltText>
      <VoltText variant="micro" tone={light ? 'ink' : 'muted'}>{label.toUpperCase()}</VoltText>
    </View>
  );
}

export function VoltProgress(props: Omit<ProgressBarProps, 'appearance' | 'animate'>) {
  return <ProgressBar {...props} appearance="volt" />;
}

type VoltOptionProps = Omit<PressableProps, 'children' | 'style' | 'role'> & {
  label: string;
  selected?: boolean;
  feedback?: 'correct' | 'incorrect';
  role?: 'button' | 'radio';
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function VoltOption({
  label, selected = false, feedback, role = 'button', children, disabled = false,
  style, accessibilityState, onFocus, onBlur, ...props
}: VoltOptionProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable {...props}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{
        ...accessibilityState, disabled,
        ...(role === 'radio' ? { checked: selected } : { selected }),
      }}
      disabled={disabled}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={({ pressed }) => [
        styles.option, selected && styles.selectedOption,
        feedback === 'correct' && styles.correctOption,
        feedback === 'incorrect' && styles.incorrectOption,
        disabled && !feedback && styles.disabled,
        focused && styles.focused, pressed && !disabled && styles.pressed, style,
      ]}
    >
      {children ?? <VoltText variant="label">{label}</VoltText>}
      {feedback ? <VoltText variant="micro" style={{ color: feedback === 'correct' ? volt.color.success : volt.color.error }}>
        {feedback === 'correct' ? 'CORRECT / + DAMAGE' : 'INCORRECT'}
      </VoltText> : null}
    </Pressable>
  );
}

/** Static geometry keeps the lobby quiet and works with reduced motion everywhere. */
export function VoltMotif() {
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <View style={styles.orbit} />
      <View style={styles.innerOrbit} />
      <View style={styles.slashOne} />
      <View style={styles.slashTwo} />
      <View style={styles.targetHorizontal} />
      <View style={styles.targetVertical} />
    </View>
  );
}

const styles = StyleSheet.create({
  displayFont: { fontFamily: volt.font.display, fontWeight: 'normal' },
  technicalFont: { fontFamily: volt.font.technical, fontWeight: 'normal' },
  mark: { backgroundColor: volt.color.red, overflow: 'hidden' },
  button: {
    minHeight: 58, minWidth: volt.layout.touchTarget, paddingHorizontal: volt.space.lg,
    paddingVertical: volt.space.md, flexDirection: 'row', alignItems: 'center',
    gap: volt.space.lg, borderWidth: 2, borderRadius: volt.layout.radius,
  },
  disabled: { opacity: 0.45 },
  compactButton: { minHeight: volt.layout.touchTarget, paddingHorizontal: volt.space.md, paddingVertical: volt.space.sm },
  focused: { borderColor: volt.color.chalk, borderWidth: 3 },
  pressed: { opacity: 0.85, transform: [{ translateY: 2 }] },
  panel: { padding: volt.space.lg, borderWidth: 1, borderRadius: volt.layout.radius, gap: volt.space.md },
  tag: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: volt.color.border,
    paddingHorizontal: volt.space.sm, paddingVertical: volt.space.xs, backgroundColor: volt.color.ink,
  },
  acidTag: { backgroundColor: volt.color.acid, borderColor: volt.color.acid },
  signalTag: { backgroundColor: volt.color.red, borderColor: volt.color.red },
  sectionLabel: { flexDirection: 'row', flexWrap: 'wrap', gap: volt.space.sm, alignItems: 'center' },
  option: {
    minHeight: volt.layout.touchTarget, padding: volt.space.md, gap: volt.space.sm,
    borderWidth: 2, borderColor: volt.color.border, backgroundColor: volt.color.raised,
  },
  selectedOption: { borderColor: volt.color.acid },
  correctOption: { borderColor: volt.color.success, backgroundColor: '#1C3229' },
  incorrectOption: { borderColor: volt.color.error, backgroundColor: '#38222D' },
  orbit: {
    width: 360, height: 360, borderRadius: 180, borderWidth: 1, borderColor: '#C5233B',
    position: 'absolute', right: -40, top: 50,
  },
  innerOrbit: {
    width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: '#C5233B',
    position: 'absolute', right: 0, top: 90,
  },
  slashOne: {
    position: 'absolute', width: 90, height: 600, right: 140, top: -90,
    backgroundColor: '#F02C45', transform: [{ rotate: '28deg' }],
  },
  slashTwo: {
    position: 'absolute', width: 18, height: 600, right: 92, top: -90,
    backgroundColor: volt.color.acid, transform: [{ rotate: '28deg' }],
  },
  targetHorizontal: { position: 'absolute', width: 24, height: 1, right: 28, bottom: 24, backgroundColor: volt.color.ink },
  targetVertical: { position: 'absolute', width: 1, height: 24, right: 40, bottom: 12, backgroundColor: volt.color.ink },
});

const buttonVariants = StyleSheet.create({
  primary: { backgroundColor: volt.color.acid, borderColor: volt.color.acid },
  signal: { backgroundColor: volt.color.red, borderColor: volt.color.red },
  outline: { backgroundColor: volt.color.ink, borderColor: volt.color.border },
});

const panelVariants = StyleSheet.create({
  dark: { backgroundColor: volt.color.panel, borderColor: volt.color.border },
  chalk: { backgroundColor: volt.color.chalk, borderColor: volt.color.chalk },
  signal: { backgroundColor: volt.color.red, borderColor: volt.color.red },
});
