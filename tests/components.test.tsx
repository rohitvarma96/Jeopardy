import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { AppText } from '../src/components/ui/AppText';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { IconSlot } from '../src/components/ui/IconSlot';
import { HealthBar, ProgressBar } from '../src/components/ui/ProgressBar';
import { EmptyState, LoadingState } from '../src/components/ui/States';
import { Card, Panel } from '../src/components/ui/Surface';
import { colors, layout, typography } from '../src/theme';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('shared UI primitives', () => {
  test('gold actions use a dark, readable label and preserve button behavior', async () => {
    const onPress = jest.fn();
    await render(<Button label="Start duel" variant="gold" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Start duel' });
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      backgroundColor: colors.gold, minHeight: 54,
    });
    expect(StyleSheet.flatten(screen.getByText('Start duel').props.style)).toMatchObject({ color: colors.track });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('typography and buttons use the shared tokens and accessible roles', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <AppText variant="title">A heading</AppText>
        <Button label="Continue" onPress={onPress} />
      </>,
    );
    expect(StyleSheet.flatten(screen.getByRole('header', { name: 'A heading' }).props.style)).toMatchObject({
      fontSize: typography.title,
      lineHeight: typography.lineHeight.title,
    });
    const button = screen.getByRole('button', { name: 'Continue' });
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      minHeight: layout.touchTarget,
      backgroundColor: colors.primaryAction,
    });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test.each(['disabled', 'loading'] as const)('%s buttons cannot dispatch an action', async (state) => {
    const onPress = jest.fn();
    await render(<Button label="Continue" onPress={onPress} {...{ [state]: true }} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button.props.accessibilityState).toEqual({
      disabled: true,
      busy: state === 'loading',
    });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  test('cards, panels, badges, icon slots and empty states keep their content', async () => {
    await render(
      <Card title="Card title" description="Card description" testID="card">
        <Panel testID="panel">
          <Badge label="Pending" />
          <IconSlot name="shield-outline" label="Shield icon" />
          <EmptyState title="Empty collection" description="No artwork is integrated." />
        </Panel>
      </Card>,
    );
    expect(StyleSheet.flatten(screen.getByTestId('card').props.style))
      .toMatchObject({ backgroundColor: colors.surface });
    expect(StyleSheet.flatten(screen.getByTestId('panel').props.style))
      .toMatchObject({ backgroundColor: colors.surface });
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByRole('image', { name: 'Shield icon' })).toBeTruthy();
    expect(screen.getAllByRole('image')).toHaveLength(1);
    expect(screen.getByRole('header', { name: 'Empty collection' })).toBeTruthy();
  });

  test.each([
    { value: -10, expected: 0 },
    { value: 25, expected: 25 },
    { value: 150, expected: 100 },
  ])('progress exposes the same bounded value as its visual fill ($value)', async ({ value, expected }) => {
    await render(<ProgressBar label="XP" value={value} testID="xp" />);
    expect(screen.getByRole('progressbar', { name: 'XP' }).props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: expected,
      text: `${expected} of 100`,
    });
    expect(screen.getByText(`${expected} / 100`)).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('xp-fill').props.style))
      .toMatchObject({ width: `${expected}%` });
  });

  test('health uses an explicit numeric value rather than color alone', async () => {
    await render(<HealthBar label="Player health" value={70} />);
    expect(screen.getByRole('progressbar', { name: 'Player health' }).props.accessibilityValue.now)
      .toBe(70);
    expect(screen.getByText('70 / 100')).toBeTruthy();
  });

  test('animated health starts at current HP on mount and still animates damage updates', async () => {
    const shared = jest.spyOn(Reanimated, 'useSharedValue');
    const timing = jest.spyOn(Reanimated, 'withTiming');
    const app = await render(<HealthBar label="Player health" value={70} animate />);
    expect(shared.mock.calls[0][0]).toBe(70);
    await app.rerender(<HealthBar label="Player health" value={55} animate />);
    expect(timing.mock.calls.at(-1)?.[0]).toBeCloseTo(55);
    expect(timing.mock.calls.at(-1)?.[1]).toEqual({ duration: 380 });
    expect(screen.getByRole('progressbar', { name: 'Player health' }).props.accessibilityValue.now).toBe(55);
  });

  test.each([
    { value: Number.NaN, max: 100 },
    { value: 10, max: 0 },
    { value: 10, max: Number.POSITIVE_INFINITY },
  ])('invalid progress input is rejected explicitly ($value/$max)', async ({ value, max }) => {
    await expect(render(<ProgressBar label="Invalid" value={value} max={max} />))
      .rejects.toThrow(RangeError);
  });

  test.each([true, false])('loading respects reduced motion (%s)', async (enabled) => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
    await render(<LoadingState label="Loading preview" />);
    expect(screen.getByText('Loading preview')).toBeTruthy();
    expect(Boolean(screen.queryByTestId('loading-indicator', { includeHiddenElements: true })))
      .toBe(!enabled);
  });
});
