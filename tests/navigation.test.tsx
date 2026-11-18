import { afterEach, describe, expect, jest, test } from '@jest/globals';
import {
  fireEvent,
  renderRouter,
  screen,
  testRouter,
} from 'expo-router/testing-library';

import { useBattleStore } from '../src/features/battle/store';
import { manualBattle, ok } from './battle/helpers';

afterEach(() => {
  jest.useRealTimers();
});

describe('Phase 1 navigation', () => {
  test('launch redirects to Arena and all bottom tabs work', async () => {
    const app = await renderRouter('./app');
    expect(app.getPathname()).toBe('/arena');
    expect(screen.getByRole('header', { name: 'Arena' })).toBeTruthy();

    expect(screen.queryByLabelText('Vault tab')).toBeNull();
    for (const name of ['Profile', 'Arena']) {
      await fireEvent.press(screen.getByLabelText(`${name} tab`));
      expect(app.getPathname()).toBe(`/${name.toLowerCase()}`);
      expect(screen.getByRole('header', { name })).toBeTruthy();
    }
  });

  test('direct reward entry without a match returns to Arena and clears the flow', async () => {
    const app = await renderRouter('./app', { initialUrl: '/battle/rewards' });
    expect(screen.getByRole('header', { name: 'Reward reveal' })).toBeTruthy();
    expect(screen.getByText('No reward yet')).toBeTruthy();

    expect(screen.queryByRole('button', { name: 'View Vault' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
    expect(app.getPathname()).toBe('/arena');
    expect(app.getRouterState()?.routes).toHaveLength(1);
    expect(testRouter.canGoBack()).toBe(false);
  });

  test('reward reveal supports direct entry and exit without stale history', async () => {
    const app = await renderRouter('./app', { initialUrl: '/battle/rewards' });
    await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
    expect(app.getPathname()).toBe('/arena');
    expect(testRouter.canGoBack()).toBe(false);
  });

  test.each([
    ['/battle/arena', 'Battle arena', 'No active battle'],
    ['/battle/clash', 'Clash', 'No active battle'],
    ['/battle/result', 'Results', 'No result yet'],
  ])('direct entry to %s without a battle offers a clean way home', async (url, title, message) => {
    const app = await renderRouter('./app', { initialUrl: url });
    expect(screen.getByRole('header', { name: title })).toBeTruthy();
    expect(screen.getByText(message)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
    expect(app.getPathname()).toBe('/arena');
    expect(testRouter.canGoBack()).toBe(false);
  });

  test('direct-entry Back has a safe home route', async () => {
    const app = await renderRouter('./app', { initialUrl: '/battle/rewards' });
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(app.getPathname()).toBe('/arena');
  });

  test('Profile settings are reachable and return to Profile', async () => {
    const app = await renderRouter('./app', { initialUrl: '/profile' });
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    expect(app.getPathname()).toBe('/settings');
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(app.getPathname()).toBe('/profile');
  });

  test('Arena opens the design lab and returns without changing the game journey', async () => {
    const app = await renderRouter('./app', { initialUrl: '/arena' });
    await fireEvent.press(screen.getByRole('button', { name: 'Open design lab' }));
    expect(app.getPathname()).toBe('/design-lab');
    expect(screen.getByRole('header', { name: 'VOLT design language' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(app.getPathname()).toBe('/arena');
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  test.each(['/unknown-route', '/vault'])('%s displays an explicit error and offers a home action', async (initialUrl) => {
    const app = await renderRouter('./app', { initialUrl });
    expect(screen.getByRole('header', { name: 'Page not found' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
    expect(app.getPathname()).toBe('/arena');
    expect(testRouter.canGoBack()).toBe(false);
  });

  test('an unknown result ID recovers home even when another battle has finished', async () => {
    useBattleStore.setState({ battle: ok(manualBattle(), { type: 'forfeit', side: 'player', atMs: 0 }) });
    const app = await renderRouter('./app', { initialUrl: '/battle/result?matchId=missing-match' });
    expect(screen.getByText('The requested match was not found.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry reward grant' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
    expect(app.getPathname()).toBe('/arena');
  });
});
