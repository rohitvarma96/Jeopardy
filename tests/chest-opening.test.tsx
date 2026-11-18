import { afterEach, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { CHEST_FAMILIES } from '../src/assets/chests';
import { chestLayers } from '../src/assets/chest-layers';
import { CHEST_ANTICIPATION_MS, CHEST_CHARGE_END, CHEST_OPEN_MS, CHEST_PRESENTATION_MS, CHEST_SKIP_MS, chestFrame, chestLidVertices, projectChestLid } from '../src/components/player/chest-motion';
import { useChestOpening } from '../src/hooks/useChestOpening';

const mockMotion = jest.fn(() => true);
const mockReady = jest.fn(() => true);
jest.mock('../src/hooks/useBattleMotion', () => ({ useSceneMotion: (reduced = false) => ({ enabled: mockMotion() && !reduced, ready: mockReady() }) }));
afterEach(() => { jest.restoreAllMocks(); mockMotion.mockReturnValue(true); mockReady.mockReturnValue(true); });

type Transition = { value: unknown; duration: number; finish: () => void };
function captureTiming() {
  const transitions: Transition[] = [];
  jest.spyOn(Reanimated, 'withTiming').mockImplementation((value, options, callback) => {
    transitions.push({ value, duration: options?.duration ?? 0, finish: () => callback?.(true) });
    return value;
  });
  return transitions;
}

test.each(CHEST_FAMILIES)('%s lid preserves the painted closed geometry and pivots around a fixed back edge', (family) => {
  const geometry = chestLayers[family].geometry;
  const expected = [
    { x: 0, y: 0 }, { x: geometry.width, y: 0 },
    { x: 0, y: geometry.height }, { x: geometry.width, y: geometry.height },
  ];
  chestLidVertices(geometry, 0).forEach((point, index) => {
    expect(point.x).toBeCloseTo(expected[index].x, 7);
    expect(point.y).toBeCloseTo(expected[index].y, 7);
  });
  for (const phase of [0, .1, .25, .4, .66, 1]) {
    const angle = chestFrame(phase).angle;
    for (const point of geometry.hinge) {
      const projected = projectChestLid({ x: point[0], y: point[1] }, geometry, angle);
      expect(projected.x).toBeCloseTo(point[0], 7);
      expect(projected.y).toBeCloseTo(point[1], 7);
    }
    expect(chestLidVertices(geometry, phase).every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  }
  const start = geometry.hinge[0];
  const front = { x: start[0] + geometry.depth[0], y: start[1] + geometry.depth[1] };
  expect(projectChestLid(front, geometry, chestFrame(1).angle).y).toBeLessThan(start[1] - 100);
});

test('hinge cannot move during unsaved charge; settled pose remains open without particles', () => {
  expect(chestFrame(CHEST_CHARGE_END).hinge).toBe(0);
  expect(chestFrame(.26).hinge).toBeGreaterThan(0);
  expect(chestFrame(.66).hinge).toBe(1);
  expect(chestFrame(1).particles).toBe(0);
  expect(chestFrame(1).angle).toBeGreaterThan(Math.PI / 2);
});

test('an unsaved reward stays closed and cannot be skipped into a reveal', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook(() => useChestOpening({ family: 'field', opening: true, opened: false, onComplete: complete }));
  expect(hook.result.current.progress.get()).toBe(0);
  await act(() => hook.result.current.skip());
  expect(transitions).toHaveLength(0);
  expect(complete).not.toHaveBeenCalled();
});

test('the saved cinematic uses one 3200 ms clock and completes exactly once', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook<ReturnType<typeof useChestOpening>, { opened: boolean }>(({ opened }) => useChestOpening({ family: 'arc', opening: true, opened, onComplete: complete }), {
    initialProps: { opened: false },
  });
  await hook.rerender({ opened: true });
  expect(transitions.at(-1)?.value).toBe(1);
  expect(CHEST_OPEN_MS).toBe(650);
  expect(CHEST_ANTICIPATION_MS).toBe(800);
  expect(CHEST_PRESENTATION_MS).toBe(3200);
  expect(transitions.at(-1)?.duration).toBe(CHEST_PRESENTATION_MS);
  expect(complete).not.toHaveBeenCalled();
  await act(() => { transitions.at(-1)?.finish(); transitions.at(-1)?.finish(); });
  expect(complete).toHaveBeenCalledTimes(1);
});

test('skip accelerates decoration only and rejects a superseded completion callback', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook(() => useChestOpening({ family: 'overdrive', opening: true, opened: true, onComplete: complete }));
  const original = transitions.at(-1);
  await act(() => hook.result.current.skip());
  expect(transitions.at(-1)).toMatchObject({ value: 1, duration: CHEST_SKIP_MS });
  await act(() => original?.finish());
  expect(complete).not.toHaveBeenCalled();
  await act(() => transitions.at(-1)?.finish());
  expect(complete).toHaveBeenCalledTimes(1);
});

test('the open painting must decode before its discovery hold begins', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook<ReturnType<typeof useChestOpening>, { ready: boolean }>(({ ready }) => useChestOpening({
    family: 'sovereign', opening: true, opened: true, assetsReady: ready, onComplete: complete,
  }), { initialProps: { ready: false } });
  expect(hook.result.current.progress.get()).toBe(0);
  expect(transitions).toHaveLength(0);
  await hook.rerender({ ready: true });
  expect(transitions.at(-1)?.value).toBe(1);
  expect(complete).not.toHaveBeenCalled();
});

test('reduced motion presents the saved result immediately, but never before settlement', async () => {
  mockMotion.mockReturnValue(false);
  const complete = jest.fn(), transitions = captureTiming();
  const hook = await renderHook<ReturnType<typeof useChestOpening>, { opened: boolean }>(({ opened }) => useChestOpening({
    family: 'field', opening: true, opened, onComplete: complete,
  }), { initialProps: { opened: false } });
  expect(complete).not.toHaveBeenCalled();
  await hook.rerender({ opened: true });
  expect(hook.result.current.progress.get()).toBe(1);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(transitions).toHaveLength(0);
});

test('already opened records do not replay, and unmount prevents late reveal callbacks', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const settled = await renderHook(() => useChestOpening({ family: 'arc', opening: false, opened: true, onComplete: complete }));
  expect(settled.result.current.progress.get()).toBe(1);
  expect(transitions).toHaveLength(0);
  await settled.unmount();
  const animated = await renderHook(() => useChestOpening({ family: 'arc', opening: true, opened: true, onComplete: complete }));
  const callback = transitions.at(-1);
  await animated.unmount();
  await act(() => callback?.finish());
  expect(complete).not.toHaveBeenCalled();
});

test('changing preview family cancels the previous opening without revealing the new chest early', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook<ReturnType<typeof useChestOpening>, { family: string }>(({ family }) => useChestOpening({ family, opening: true, opened: true, onComplete: complete }), {
    initialProps: { family: 'field' },
  });

  const old = transitions.at(-1);
  await hook.rerender({ family: 'sovereign' });
  await act(() => old?.finish());
  expect(complete).not.toHaveBeenCalled();
  expect(transitions.at(-1)?.duration).toBe(CHEST_PRESENTATION_MS);
});

test('a newly mounted replay waits for the motion preference instead of skipping its animation', async () => {
  mockReady.mockReturnValue(false);
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook(() => useChestOpening({ family: 'field', opening: true, opened: true, onComplete: complete }));
  expect(complete).not.toHaveBeenCalled();
  expect(transitions).toHaveLength(0);
  mockReady.mockReturnValue(true);
  await hook.rerender(undefined);
  expect(transitions.at(-1)).toMatchObject({ value: 1, duration: CHEST_PRESENTATION_MS });
});

test('blur after initialization settles a saved presentation instead of catching up smoke on return', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook(() => useChestOpening({ family: 'arc', opening: true, opened: true, onComplete: complete }));
  const stale = transitions.at(-1);
  mockMotion.mockReturnValue(false);
  mockReady.mockReturnValue(false);
  await hook.rerender(undefined);
  expect(hook.result.current.progress.get()).toBe(1);
  expect(complete).toHaveBeenCalledTimes(1);
  await act(() => stale?.finish());
  expect(complete).toHaveBeenCalledTimes(1);
});

test('practice controls settle the saved example and cancel its old callback', async () => {
  const transitions = captureTiming(), complete = jest.fn();
  const hook = await renderHook<ReturnType<typeof useChestOpening>, { suspended: boolean }>(({ suspended }) =>
    useChestOpening({ family: 'field', opening: true, opened: true, suspended, onComplete: complete }),
  { initialProps: { suspended: false } });
  const stale = transitions.at(-1);
  await hook.rerender({ suspended: true });
  expect(hook.result.current.motionActive).toBe(false);
  expect(complete).toHaveBeenCalledTimes(1);
  await act(() => stale?.finish());
  expect(complete).toHaveBeenCalledTimes(1);
});
