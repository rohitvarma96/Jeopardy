import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { SceneAction, worldColors, type SceneActionVariant } from '../src/components/world/SceneControls';
import { volt } from '../src/theme';

test.each<{ variant: SceneActionVariant; color: string }>([
  { variant: 'signal', color: volt.color.red },
  { variant: 'primary', color: volt.color.acid },
  { variant: 'outline', color: '#718092' },
])('$variant actions use the Relay plate, inset keyline and transparent corner cuts', async ({ variant, color }) => {
  await render(<SceneAction label="Action" variant={variant} onPress={jest.fn<() => void>()} />);
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-fill', { includeHiddenElements: true }).props.style))
    .toMatchObject({ backgroundColor: color, left: 12, right: 12 });
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-top-cut', { includeHiddenElements: true }).props.style))
    .toMatchObject({ borderLeftWidth: 12, borderBottomWidth: 12, borderLeftColor: 'transparent' });
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-keyline').props.style))
    .toMatchObject({ top: 6, bottom: 6, left: 6, right: 6, borderWidth: 1 });
  expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Action' }).props.style))
    .toMatchObject({ minWidth: 48, minHeight: variant === 'signal' ? 72 : 64 });
  expect(JSON.stringify(screen.toJSON())).not.toContain('Canvas');
});

test('short command text preserves explicit confirmation semantics and the original action', async () => {
  const onPress = jest.fn<() => void>();
  await render(<SceneAction label="Pick" accessibilityLabel="Confirm pick" icon="pick" variant="signal" onPress={onPress} />);
  expect(screen.getByText('PICK')).toBeTruthy();
  expect(screen.queryByText('CONFIRM PICK')).toBeNull();
  expect(StyleSheet.flatten(screen.getByText('PICK').props.style))
    .toMatchObject({ fontFamily: volt.font.display, color: volt.color.ink, fontSize: 30, textAlign: 'center' });
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm pick' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test.each([{ disabled: true, loading: false }, { disabled: false, loading: true }])(
  'unavailable commands remain legible and cannot activate: %o', async ({ disabled, loading }) => {
    const onPress = jest.fn<() => void>();
    await render(<SceneAction label="Fit power" icon="equip" disabled={disabled} loading={loading} onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Fit power', disabled: true });
    expect(button.props.accessibilityState.busy).toBe(loading);
    expect(StyleSheet.flatten(screen.getByTestId('scene-action-fill', { includeHiddenElements: true }).props.style))
      .toMatchObject({ backgroundColor: worldColors.panel });
    expect(StyleSheet.flatten(screen.getByText(loading ? 'SAVING...' : 'FIT POWER').props.style))
      .toMatchObject({ color: worldColors.muted });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  },
);

test('keyboard focus outlines the actual command plate and clears on blur', async () => {
  await render(<SceneAction label="Duel" variant="signal" onPress={jest.fn<() => void>()} />);
  const button = screen.getByRole('button', { name: 'Duel' });
  await fireEvent(button, 'focus');
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-fill', { includeHiddenElements: true }).props.style))
    .toMatchObject({ backgroundColor: worldColors.paper });
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-keyline').props.style))
    .toMatchObject({ borderColor: worldColors.paper });
  await fireEvent(button, 'blur');
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-fill', { includeHiddenElements: true }).props.style))
    .toMatchObject({ backgroundColor: volt.color.red });
});

test('a disabled phase transition cannot leave a stale focus outline on the next command', async () => {
  const onPress = jest.fn<() => void>();
  const app = await render(<SceneAction label="Ban" variant="signal" onPress={onPress} />);
  await fireEvent(screen.getByRole('button', { name: 'Ban' }), 'focus');
  await app.rerender(<SceneAction label="Pick" variant="signal" disabled onPress={onPress} />);
  await app.rerender(<SceneAction label="Pick" variant="signal" onPress={onPress} />);
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-fill', { includeHiddenElements: true }).props.style))
    .toMatchObject({ backgroundColor: volt.color.red });
  expect(StyleSheet.flatten(screen.getByTestId('scene-action-keyline').props.style))
    .toMatchObject({ borderColor: '#15151F80' });
});
