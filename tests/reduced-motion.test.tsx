import { afterEach, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from '../src/hooks/useReducedMotion';

afterEach(() => {
  jest.restoreAllMocks();
});

test('reduced motion follows live system changes and removes its subscription', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const remove = jest.fn();
  const subscribe = jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove });
  const hook = await renderHook(useReducedMotion);
  expect(hook.result.current).toBe(false);

  const listener = subscribe.mock.calls[0]?.[1];
  if (!listener) throw new Error('Expected a reduced-motion listener.');
  expect(subscribe.mock.calls[0]?.[0]).toBe('reduceMotionChanged');
  await act(() => listener(true));
  expect(hook.result.current).toBe(true);

  await hook.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('a late initial read cannot overwrite a newer system setting', async () => {
  let resolvePreference: ((enabled: boolean) => void) | undefined;
  const subscribe = jest.spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(
    () => new Promise<boolean>((resolve) => { resolvePreference = resolve; }),
  );
  const hook = await renderHook(useReducedMotion);
  expect(hook.result.current).toBe(true);
  const listener = subscribe.mock.calls[0]?.[1];
  if (!listener) throw new Error('Expected a reduced-motion listener.');
  await act(() => listener(true));
  if (!resolvePreference) throw new Error('Expected the initial preference read.');
  await act(() => resolvePreference?.(false));
  expect(hook.result.current).toBe(true);
});

test('failed preference reads are reported and keep motion disabled', async () => {
  const error = new Error('Preference unavailable');
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(error);
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const hook = await renderHook(useReducedMotion);
  expect(hook.result.current).toBe(true);
  expect(warn).toHaveBeenCalledWith(
    'Unable to read reduced motion; motion remains disabled.',
    error,
  );
});
