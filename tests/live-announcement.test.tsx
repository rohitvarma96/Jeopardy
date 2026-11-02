import { afterEach, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

import { AppText } from '../src/components/ui/AppText';
import { Panel } from '../src/components/ui/Surface';
import { LoadingState } from '../src/components/ui/States';

const initialAppState = AppState.currentState;

afterEach(() => {
  AppState.currentState = initialAppState;
  jest.restoreAllMocks();
});

test.each(['ios', 'android'] as const)('%s live feedback announces changed text without duplicating Android native events', async (platform) => {
  jest.replaceProperty(Platform, 'OS', platform);
  AppState.currentState = 'active';
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
  const app = await render(<AppText accessibilityLiveRegion="polite">{2} / {3} boosters selected</AppText>);
  if (platform === 'ios') expect(announce).toHaveBeenLastCalledWith('2 / 3 boosters selected', { queue: true });
  else expect(announce).not.toHaveBeenCalled();
  announce.mockClear();
  await app.rerender(<AppText accessibilityLiveRegion="polite">{2} / {3} boosters selected</AppText>);
  expect(announce).not.toHaveBeenCalled();
  await app.rerender(<AppText accessibilityLiveRegion="assertive">Answer locked.</AppText>);
  if (platform === 'ios') expect(announce).toHaveBeenCalledWith('Answer locked.', { queue: false });
  else expect(announce).not.toHaveBeenCalled();
});

test('iOS announces grouped combat and loading messages, but not background or non-live text', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  AppState.currentState = 'active';
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
  const app = await render(
    <Panel accessibilityLiveRegion="polite" accessibilityLabel="You: correct. Opponent: wrong.">
      <AppText>You: correct.</AppText><AppText>Opponent: wrong.</AppText>
    </Panel>,
  );
  expect(announce).toHaveBeenCalledTimes(1);
  expect(announce).toHaveBeenCalledWith('You: correct. Opponent: wrong.', { queue: true });
  announce.mockClear();
  await app.rerender(<LoadingState label="Saving preference..." />);
  expect(announce).toHaveBeenCalledWith('Saving preference...', { queue: true });
  announce.mockClear();
  AppState.currentState = 'background';
  await app.rerender(<AppText accessibilityLiveRegion="polite">Preference saved.</AppText>);
  expect(announce).not.toHaveBeenCalled();
  AppState.currentState = 'active';
  await app.rerender(<AppText accessibilityLiveRegion="none">Ordinary text.</AppText>);
  expect(announce).not.toHaveBeenCalled();
});
