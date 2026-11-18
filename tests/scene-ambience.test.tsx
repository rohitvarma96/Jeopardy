import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { AccessibilityInfo, AppState } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import Arena from '../app/(tabs)/arena';
import { AMBIENT_PERIOD_MS, atmosphereFrame, atmosphereMote } from '../src/components/atmosphere/motion';
import { humanFighters } from '../src/assets/human-fighters';
import { deformLobbyIdle } from '../src/components/fighters/combat/lobby-idle';
import { createPaintedMesh, PAINTED_ANATOMY } from '../src/components/fighters/combat/painted-mesh';
import { BrawlerStage } from '../src/components/world/BrawlerStage';
import { FIGHTERS } from '../src/data/fighters';
import { useAmbientClock } from '../src/hooks/useAmbientClock';
import { usePlayerStore } from '../src/store/player-store';

const initialState = AppState.currentState;
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ navigate: jest.fn(), push: jest.fn() }),
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
  };
});
afterEach(() => { jest.restoreAllMocks(); AppState.currentState = initialState; });

test.each(FIGHTERS)('$name idle preserves painted feet, rigid face, source identity and a seamless loop', fighter => {
  const art = humanFighters[fighter.id], mesh = createPaintedMesh(fighter.id, art.width, art.height);
  const before = JSON.stringify(mesh);
  const feet = mesh.bind.map((point, index) => (point.y - 66) / 480 > .85 ? index : -1).filter(index => index >= 0);
  const face = mesh.weights.map((weights, index) => weights.length === 1 && weights[0].bone === 1 ? index : -1).filter(index => index >= 0);
  const first = face[0], last = face[face.length - 1];
  const faceWidth = Math.hypot(mesh.bind[first].x - mesh.bind[last].x, mesh.bind[first].y - mesh.bind[last].y);
  let maxMovement = 0;
  for (let time = 0; time <= AMBIENT_PERIOD_MS; time += 500) {
    const points = deformLobbyIdle(mesh, fighter.id, time);
    for (const index of feet) expect(points[index]).toEqual(mesh.bind[index]);
    expect(Math.hypot(points[first].x - points[last].x, points[first].y - points[last].y)).toBeCloseTo(faceWidth, 6);
    for (let index = 0; index < points.length; index++) {
      expect(Number.isFinite(points[index].x) && Number.isFinite(points[index].y)).toBe(true);
      maxMovement = Math.max(maxMovement, Math.hypot(points[index].x - mesh.bind[index].x, points[index].y - mesh.bind[index].y));
    }
  }
  expect(maxMovement).toBeGreaterThan(1);
  expect(maxMovement).toBeLessThan(5);
  const loop = deformLobbyIdle(mesh, fighter.id, AMBIENT_PERIOD_MS);
  loop.forEach((point, index) => {
    expect(point.x).toBeCloseTo(mesh.bind[index].x, 7);
    expect(point.y).toBeCloseTo(mesh.bind[index].y, 7);
  });
  expect(JSON.stringify(mesh)).toBe(before);
  expect(PAINTED_ANATOMY[fighter.id].hip[1]).toBeLessThan(.5);
});

test.each(['arena', 'battle'] as const)('%s atmosphere stays bounded, calm and seamless at phone/compact sizes', kind => {
  for (const [width, height] of [[300, 240], [350, 480], [336, 80]]) {
    const start = atmosphereFrame(0, width, height, kind), end = atmosphereFrame(AMBIENT_PERIOD_MS, width, height, kind);
    for (const key of ['light', 'rearX', 'rearY', 'floorX', 'floorY'] as const) expect(end[key]).toBeCloseTo(start[key], 7);
    for (let time = 0; time <= AMBIENT_PERIOD_MS; time += 100) {
      const frame = atmosphereFrame(time, width, height, kind);
      expect(frame.light).toBeGreaterThanOrEqual(0);
      expect(frame.light).toBeLessThanOrEqual(.106);
      expect(frame.floorY).toBeLessThan(height * .85);
      const next = atmosphereFrame(time + 100, width, height, kind);
      expect(Math.abs(next.light - frame.light)).toBeLessThan(.002);
      for (let index = 0; index < (kind === 'arena' ? 8 : 6); index++) {
        const mote = atmosphereMote(time, index, width, height);
        expect(mote.x).toBeGreaterThan(0); expect(mote.x).toBeLessThan(width);
        expect(mote.y).toBeGreaterThan(0); expect(mote.y).toBeLessThan(height * .75);
        expect(mote.opacity).toBeLessThanOrEqual(.181);
      }
    }
  }
});

test('one independent UI-thread clock does not restart on renders and cancels when disabled/unmounted', async () => {
  const timing = jest.spyOn(Reanimated, 'withTiming'), repeat = jest.spyOn(Reanimated, 'withRepeat');
  const cancel = jest.spyOn(Reanimated, 'cancelAnimation');
  const hook = await renderHook<ReturnType<typeof useAmbientClock>, { enabled: boolean }>(
    ({ enabled }) => useAmbientClock(enabled), { initialProps: { enabled: true } },
  );
  expect(timing).toHaveBeenCalledWith(24000, expect.objectContaining({ duration: 24000 }));
  expect(repeat).toHaveBeenCalledWith(expect.anything(), -1, false);
  const repeats = repeat.mock.calls.length;
  await hook.rerender({ enabled: true });
  expect(repeat).toHaveBeenCalledTimes(repeats);
  const before = cancel.mock.calls.length;
  await hook.rerender({ enabled: false });
  expect(cancel.mock.calls.length).toBeGreaterThan(before);
  expect(hook.result.current.get()).toBe(0);
  await hook.unmount();
  expect(cancel.mock.calls.length).toBeGreaterThan(before + 1);
});

test('Arena uses one living canvas and releases it on background/system reduction without changing player data', async () => {
  AppState.currentState = 'active';
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const appEvents = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  const motionEvents = jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  await usePlayerStore.getState().hydrate();
  const before = usePlayerStore.getState();
  await render(<Arena />);
  expect(screen.getAllByTestId('arena-living-canvas')).toHaveLength(1);
  expect(screen.getByRole('image', { name: 'Astral Sage artwork' })).toBeTruthy();
  await act(() => appEvents.mock.calls.filter(([name]) => name === 'change').forEach(([, listener]) => listener('background')));
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  expect(screen.getByRole('button', { name: 'Duel' })).toBeTruthy();
  await act(() => appEvents.mock.calls.filter(([name]) => name === 'change').forEach(([, listener]) => listener('active')));
  expect(screen.getAllByTestId('arena-living-canvas')).toHaveLength(1);
  await act(() => motionEvents.mock.calls.forEach(([, listener]) => listener(true)));
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  expect(usePlayerStore.getState()).toBe(before);
});

test('app reduction and mode inspection stop decorative Arena work; other Brawler stages stay static', async () => {
  AppState.currentState = 'active';
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  await usePlayerStore.getState().hydrate();
  const app = await render(<Arena />);
  expect(screen.getByTestId('arena-living-canvas')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose game mode' }));
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'AI Duel selected' }));
  expect(screen.getByTestId('arena-living-canvas')).toBeTruthy();
  await act(() => usePlayerStore.setState(state => ({ settings: { ...state.settings, reducedMotion: true } })));
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  await app.rerender(<BrawlerStage fighterId="shadow" />);
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  expect(screen.getByRole('image', { name: 'Nightblade artwork' })).toBeTruthy();
});
