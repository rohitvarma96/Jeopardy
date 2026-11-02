import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react-native';

import Mode from '../app/battle/mode';
import { useMatchSetupStore } from '../src/features/match-setup/store';
import { routes } from '../src/navigation/routes';

const mockRouter = {
  push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false),
};

jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

test('mode selection exposes the selected offline mode and an accessible setup step', async () => {
  await render(<Mode />);
  expect(screen.getByRole('header', { name: 'Mode selection' })).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Match setup' }).props.accessibilityValue)
    .toMatchObject({ now: 1, max: 5 });
  expect(screen.getByRole('radio', { name: 'Offline Duel', checked: true })).toBeTruthy();
  expect(screen.getByText('Available offline')).toBeTruthy();
  expect(within(screen.getByTestId('screen-footer')).getByRole('button', { name: 'Find opponent' })).toBeTruthy();
});

test('future modes remain disabled and cannot change the active offline selection', async () => {
  await render(<Mode />);
  for (const name of ['Ranked Online', 'Friend Challenge']) {
    const future = screen.getByRole('radio', { name: `${name}, unavailable future mode`, disabled: true });
    await fireEvent.press(future);
    expect(screen.getByRole('radio', { name: 'Offline Duel', checked: true })).toBeTruthy();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Find opponent' }));
  expect(useMatchSetupStore.getState().modeId).toBe('offline-duel');
  expect(mockRouter.push).toHaveBeenCalledWith(routes.matchmaking);
});

test('Find opponent starts a fresh setup before navigating to matchmaking', async () => {
  useMatchSetupStore.setState({ fighterId: 'arcane' });
  await render(<Mode />);
  await fireEvent.press(screen.getByRole('button', { name: 'Find opponent' }));
  expect(useMatchSetupStore.getState()).toMatchObject({
    modeId: 'offline-duel', match: null, draft: null, fighterId: null, ready: null,
  });
  expect(mockRouter.push).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).toHaveBeenCalledWith(routes.matchmaking);
});

test.each([true, false])('Back preserves history or recovers to Arena (has history: %s)', async (hasHistory) => {
  mockRouter.canGoBack.mockReturnValueOnce(hasHistory);
  await render(<Mode />);
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  if (hasHistory) {
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  } else {
    expect(mockRouter.replace).toHaveBeenCalledWith(routes.arena);
    expect(mockRouter.back).not.toHaveBeenCalled();
  }
});
