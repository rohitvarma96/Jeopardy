import { afterEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import Arena from '../app/(tabs)/arena';
import DesignLab from '../app/design-lab';
import { VoltButton, VoltOption, VoltProgress, VoltText } from '../src/components/volt';
import { routes } from '../src/navigation/routes';
import { usePlayerStore } from '../src/store/player-store';
import { volt } from '../src/theme';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => false);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, canGoBack: mockCanGoBack }),
}));

afterEach(() => {
  jest.restoreAllMocks();
  mockCanGoBack.mockReturnValue(false);
});

test('VOLT primary actions keep accessible labels, disabled and loading semantics', async () => {
  const onPress = jest.fn();
  await render(<>
    <VoltButton label="Play" onPress={onPress} />
    <VoltButton label="Locked" disabled onPress={onPress} />
    <VoltButton label="Searching" loading onPress={onPress} />
  </>);
  await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Locked', disabled: true }));
  await fireEvent.press(screen.getByRole('button', { name: 'Searching', disabled: true }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Searching' }).props.accessibilityState.busy).toBe(true);
});

test('VOLT options expose radio state and cannot select locked content', async () => {
  const onPress = jest.fn();
  await render(<>
    <VoltOption label="Equipped" role="radio" selected onPress={onPress} />
    <VoltOption label="Unowned" role="radio" disabled onPress={onPress} />
  </>);
  expect(screen.getByRole('radio', { name: 'Equipped', checked: true })).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Unowned', disabled: true }));
  expect(onPress).not.toHaveBeenCalled();
});

test('VOLT progress preserves the shared authoritative progress semantics', async () => {
  await render(<VoltProgress label="Player XP" value={240} max={400} showLabel={false} testID="volt-xp" />);
  expect(screen.getByRole('progressbar', { name: 'Player XP' }).props.accessibilityValue)
    .toMatchObject({ min: 0, max: 400, now: 240 });
  expect(ReactNative.StyleSheet.flatten(screen.getByTestId('volt-xp-fill').props.style))
    .toMatchObject({ width: '60%', backgroundColor: volt.color.acid, borderRadius: 0 });
});

test('VOLT display text uses bundled typography without replacing body readability', async () => {
  await render(<>
    <VoltText variant="title">Arena title</VoltText>
    <VoltText>Readable question</VoltText>
  </>);
  expect(ReactNative.StyleSheet.flatten(screen.getByRole('header', { name: 'Arena title' }).props.style))
    .toMatchObject({ fontFamily: volt.font.display, fontSize: 52 });
  expect(ReactNative.StyleSheet.flatten(screen.getByText('Readable question').props.style))
    .toMatchObject({ fontSize: 14, lineHeight: 21 });
});

test('Arena links to the design library without adding a game mode', async () => {
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open design lab' }));
  expect(mockPush).toHaveBeenCalledWith(routes.designLab);
});

test.each([
  { width: 320, height: 568, scale: 1, fontScale: 1 },
  { width: 390, height: 844, scale: 1, fontScale: 2 },
  { width: 1440, height: 900, scale: 1, fontScale: 1 },
])('Arena keeps gameplay controls at $width px and $fontScale font scale', async (dimensions) => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue(dimensions);
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  expect(screen.getByRole('header', { name: 'Arena' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Play', disabled: false })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Change hero' })).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'XP to level 4' })).toBeTruthy();
  expect(screen.getByLabelText('Astral Sage artwork')).toBeTruthy();
});

test.each(['Mars', 'Venus'])('design lab previews %s feedback and resets without mutating saved progress', async (answer) => {
  await usePlayerStore.getState().hydrate();
  const before = usePlayerStore.getState();
  await render(<DesignLab />);
  for (let index = 0; index < 5; index++) await fireEvent.press(screen.getByRole('button', { name: 'Next section' }));
  await fireEvent.press(screen.getByRole('button', { name: answer }));
  expect(screen.getByRole('button', { name: 'Mars', disabled: true })).toBeTruthy();
  expect(screen.getByText('CORRECT / + DAMAGE')).toBeTruthy();
  if (answer === 'Venus') expect(screen.getByText('INCORRECT')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Reset question' }));
  expect(screen.getByRole('button', { name: 'Mars', disabled: false })).toBeTruthy();
  expect(screen.getByText('Awaiting your answer.')).toBeTruthy();
  expect(usePlayerStore.getState()).toBe(before);
});

test('design lab demo controls respond without activating a real match', async () => {
  await render(<DesignLab />);
  for (let index = 0; index < 3; index++) await fireEvent.press(screen.getByRole('button', { name: 'Next section' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Enter arena' }));
  expect(screen.getByText(/Primary action activated/)).toBeTruthy();
  for (let index = 0; index < 3; index++) await fireEvent.press(screen.getByRole('button', { name: 'Next section' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Shield' }));
  expect(screen.getByRole('radio', { name: 'Shield', checked: true })).toBeTruthy();
  expect(mockPush).not.toHaveBeenCalled();
});

test('design lab direct entry has a safe Arena fallback', async () => {
  await render(<DesignLab />);
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(mockReplace).toHaveBeenCalledWith(routes.arena);
});

test('design lab respects existing navigation history', async () => {
  mockCanGoBack.mockReturnValue(true);
  await render(<DesignLab />);
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

test.each([
  ['ink', 'chalk'], ['ink', 'red'], ['ink', 'acid'],
  ['chalk', 'ink'], ['chalk', 'panel'], ['muted', 'ink'], ['muted', 'panel'],
  ['acid', 'ink'], ['red', 'ink'], ['success', 'panel'], ['error', 'panel'],
] as const)('VOLT normal text pair %s on %s meets WCAG AA contrast', (foreground, background) => {
  const values = [luminance(volt.color[foreground]), luminance(volt.color[background])].sort((a, b) => b - a);
  expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
});
