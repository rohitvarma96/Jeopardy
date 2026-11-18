import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef, useEffect } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import Arena from '../app/(tabs)/arena';
import { SagePerformance, type BrawlerPerformanceHandle } from '../src/components/world/SagePerformance';
import {
  SAGE_DURATION, SAGE_HEAD_SOCKET, SAGE_PAINT_ORDER, SAGE_PARTS, sageLayer, sagePose, sageStageLayout,
} from '../src/components/world/sage-performance';
import { usePlayerStore } from '../src/store/player-store';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ navigate: jest.fn(), push: jest.fn() }),
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
  };
});

const initialState = AppState.currentState;
const { readFileSync } = jest.requireActual<{ readFileSync: (path: string) => Uint8Array }>('node:fs');
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  AppState.currentState = initialState;
});

function loadedArt() {
  const skia = jest.requireMock<typeof import('@shopify/react-native-skia')>('@shopify/react-native-skia');
  const image = skia.Skia.Image.MakeImageFromEncoded(skia.Skia.Data.fromBytes(
    new Uint8Array(readFileSync('assets/images/fighters/home/sage-atlas.png')),
  ));
  if (!image) throw new Error('Sage atlas did not decode in CanvasKit.');
  jest.spyOn(skia, 'useImage').mockReturnValue(image);
  AppState.currentState = 'active';
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  return image;
}

test('the authored pack has real head/hand replacements and a single bounded texture', () => {
  expect(Object.keys(SAGE_PARTS)).toHaveLength(13);
  expect(SAGE_PARTS.neutral.rect).not.toEqual(SAGE_PARTS.focus.rect);
  expect(SAGE_PARTS.open.rect).not.toEqual(SAGE_PARTS.pinch.rect);
  const png = readFileSync('assets/images/fighters/home/sage-atlas.png');
  const header = new DataView(png.buffer, png.byteOffset, png.byteLength);
  expect(header.getUint32(16)).toBe(1536);
  expect(header.getUint32(20)).toBe(1536);
  expect(1536 * 1536 * 4).toBe(9 * 1024 * 1024);
  for (const { rect, anchor } of Object.values(SAGE_PARTS)) {
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1536);
    expect(rect.y + rect.height).toBeLessThanOrEqual(1536);
    expect(anchor.x).toBeGreaterThanOrEqual(0);
    expect(anchor.y).toBeGreaterThanOrEqual(0);
  }
});

test.each(['arrival', 'acknowledge', 'signature'] as const)('%s settles to the exact authored rest without moving feet', clip => {
  const neutral = sagePose('idle', 0);
  const body = sageLayer('body', neutral);
  for (let t = 0; t <= SAGE_DURATION[clip]; t += 25) {
    const pose = sagePose(clip, t);
    expect(sageLayer('body', pose)).toEqual(body);
    expect(Number.isFinite(pose.starX + pose.starY + pose.arm + pose.coat)).toBe(true);
    expect(pose.starX).toBeGreaterThan(350);
    expect(pose.starX).toBeLessThan(535);
    expect(pose.starY).toBeGreaterThan(80);
    expect(pose.starY).toBeLessThan(350);
  }
  expect(sagePose(clip, SAGE_DURATION[clip])).toEqual(neutral);
});

test('the performance still acts without effects, with a compatible hold/release and recovery', () => {
  expect(sagePose('signature', 800)).toMatchObject({ head: 'focus', hand: 'pinch', constellation: 0 });
  expect(sagePose('signature', 1500)).toMatchObject({ head: 'focus', hand: 'release', constellation: 1 });
  expect(sagePose('signature', 2000).head).toBe('acknowledge');
  expect(sagePose('focus', 650)).toEqual(sagePose('signature', 650));
  expect(sagePose('recover', 0)).toEqual(sagePose('focus', 650));
  expect(sagePose('recover', 450)).toEqual(sagePose('idle', 0));
  expect(sagePose('ready', 700)).toMatchObject({ head: 'ready', hand: 'pinch', arm: -.42 });
});

test('all skin-only head drawings pivot inside the fixed foreground shirt collar', () => {
  expect(SAGE_HEAD_SOCKET).toEqual({ x: 216, y: 172 });
  const torso = sageLayer('body', sagePose('idle', 0));
  expect(SAGE_HEAD_SOCKET.y).toBeGreaterThanOrEqual(torso.y - 12);
  expect(SAGE_HEAD_SOCKET.y).toBeLessThanOrEqual(torso.y);
  expect(SAGE_PAINT_ORDER.indexOf('head')).toBeGreaterThan(SAGE_PAINT_ORDER.indexOf('body'));
  expect(SAGE_PAINT_ORDER.indexOf('collar')).toBeGreaterThan(SAGE_PAINT_ORDER.indexOf('head'));
  const drawings = new Set();
  for (const clip of Object.keys(SAGE_DURATION) as (keyof typeof SAGE_DURATION)[]) {
    for (let t = 0; t <= SAGE_DURATION[clip]; t += 25) {
      const pose = sagePose(clip, t), head = sageLayer('head', pose);
      drawings.add(head.part);
      expect({ x: head.x, y: head.y }).toEqual(SAGE_HEAD_SOCKET);
      expect(Math.abs(head.rotation)).toBeLessThan(.03);
      expect(sageLayer('collar', pose)).toEqual({ ...sageLayer('body', pose), part: 'collar' });
    }
  }
  expect([...drawings].sort()).toEqual(['acknowledge', 'blink', 'focus', 'glance', 'neutral', 'ready']);
});

test('real painted head pixels have no second collar, and the rendered neck remains joined through every view and turn', () => {
  const image = loadedArt();
  const { Skia } = jest.requireMock<typeof import('@shopify/react-native-skia')>('@shopify/react-native-skia');
  const pixels = image.readPixels();
  if (!pixels) throw new Error('Unable to inspect the Sage atlas pixels.');
  const alpha = (part: typeof SAGE_PARTS.neutral, x: number, y: number) => {
    if (x < 0 || y < 0 || x >= part.rect.width || y >= part.rect.height) return 0;
    return pixels[((part.rect.y + y) * 1536 + part.rect.x + x) * 4 + 3];
  };
  const surface = Skia.Surface.MakeOffscreen(560, 1000);
  if (!surface) throw new Error('Unable to allocate neck verification surface.');
  const canvas = surface.getCanvas(), paint = Skia.Paint();
  try {
    for (const head of ['neutral', 'focus', 'acknowledge', 'blink', 'glance', 'ready'] as const) {
      const part = SAGE_PARTS[head];
      expect(alpha(part, part.anchor.x, part.anchor.y - 15)).toBe(255);
      expect(alpha(part, part.anchor.x + 30, part.anchor.y + 35)).toBe(0);
      for (const headTurn of [-.015, 0, .028]) {
        canvas.clear(Skia.Color('transparent'));
        const pose = { ...sagePose('idle', 0), head, headTurn };
        for (const layer of ['body', 'head', 'collar'] as const) {
          const frame = sageLayer(layer, pose), sprite = SAGE_PARTS[frame.part];
          canvas.save();
          canvas.translate(frame.x, frame.y);
          canvas.rotate(frame.rotation * 180 / Math.PI, 0, 0);
          canvas.scale(frame.scale, frame.scale);
          canvas.translate(-sprite.anchor.x, -sprite.anchor.y);
          canvas.drawImageRect(image, sprite.rect, { x: 0, y: 0, width: sprite.rect.width, height: sprite.rect.height }, paint);
          canvas.restore();
        }
        const snapshot = surface.makeImageSnapshot();
        try {
          const rendered = snapshot.readPixels();
          if (!rendered) throw new Error('Unable to inspect the rendered neck.');
          for (let y = 140; y <= 190; y++) {
            for (let x = 213; x <= 219; x++) expect(rendered[(y * 560 + x) * 4 + 3]).toBe(255);
          }
          for (let y = 160; y <= 178; y++) {
            for (let x = 196; x <= 212; x++) expect(rendered[(y * 560 + x) * 4 + 3]).toBeGreaterThanOrEqual(250);
          }
        } finally { snapshot.dispose(); }
      }
    }
  } finally {
    paint.dispose();
    surface.dispose();
    image.dispose();
  }
});

test.each([[300, 240], [350, 480], [260, 100], [900, 600]])('the whole rig fits a %s x %s stage', (width, height) => {
  const frame = sageStageLayout(width, height, Math.min(height - 4, width * 1.65));
  expect(frame.left).toBeGreaterThanOrEqual(0);
  expect(frame.top).toBeGreaterThanOrEqual(0);
  expect(frame.left + 560 * frame.scale).toBeLessThanOrEqual(width);
  expect(frame.top + 1000 * frame.scale).toBeLessThanOrEqual(height);
});

test('body, star, accessible signature and deployment are cosmetic, bounded and spam-safe', async () => {
  jest.useFakeTimers();
  const image = loadedArt();
  const timing = jest.spyOn(Reanimated, 'withTiming');
  const handle = createRef<BrawlerPerformanceHandle>();
  const before = usePlayerStore.getState();
  const view = await render(<SagePerformance width={350} height={480} artHeight={470} allowed ref={handle} />);
  await act(() => jest.advanceTimersByTime(1100));
  const signature = screen.getByRole('button', { name: 'Play Astral Sage signature' });
  await fireEvent.press(signature);
  expect(timing).toHaveBeenLastCalledWith(2600, expect.objectContaining({ duration: 2600 }));
  const count = timing.mock.calls.length;
  await fireEvent.press(signature);
  await fireEvent.press(screen.getByRole('button', { name: 'Acknowledge Astral Sage' }));
  expect(timing).toHaveBeenCalledTimes(count);
  await act(() => jest.advanceTimersByTime(2600));
  await fireEvent.press(screen.getByRole('button', { name: 'Acknowledge Astral Sage' }));
  expect(timing).toHaveBeenLastCalledWith(650, expect.objectContaining({ duration: 650 }));
  await act(() => jest.advanceTimersByTime(650));
  const star = screen.getByRole('button', { name: "Interact with Astral Sage's star" });
  await fireEvent(star, 'longPress');
  expect(timing).toHaveBeenLastCalledWith(650, expect.objectContaining({ duration: 650 }));
  await fireEvent(star, 'pressOut', { nativeEvent: { locationX: 24, locationY: 24 } });
  expect(timing).toHaveBeenLastCalledWith(2600, expect.objectContaining({ duration: 1950 }));
  await act(() => jest.advanceTimersByTime(1950));
  await fireEvent(star, 'longPress');
  await fireEvent(star, 'pressOut', { nativeEvent: { locationX: 90, locationY: 24 } });
  expect(timing).toHaveBeenLastCalledWith(450, expect.objectContaining({ duration: 450 }));
  await act(() => handle.current?.ready());
  expect(timing).toHaveBeenLastCalledWith(700, expect.objectContaining({ duration: 700 }));
  expect(usePlayerStore.getState()).toBe(before);
  await view.unmount();
  jest.runAllTicks();
  expect(jest.getTimerCount()).toBe(0);
  image.dispose();
});

test('reduction, mode inspection and background park the actor and cancel pending interactions', async () => {
  jest.useFakeTimers();
  const image = loadedArt();
  const events = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  await usePlayerStore.getState().hydrate();
  const view = await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Play Astral Sage signature' }));
  await act(() => events.mock.calls.filter(([name]) => name === 'change').forEach(([, callback]) => callback('background')));
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  expect(screen.getByRole('image', { name: 'Astral Sage artwork' })).toBeTruthy();
  jest.runAllTicks();
  expect(jest.getTimerCount()).toBe(0);
  await act(() => events.mock.calls.filter(([name]) => name === 'change').forEach(([, callback]) => callback('active')));
  expect(screen.getAllByTestId('arena-living-canvas')).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose game mode' }));
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  expect(screen.getByRole('button', { name: 'Play Astral Sage signature', disabled: true })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'AI Duel selected' }));
  await act(() => usePlayerStore.setState(state => ({ settings: { ...state.settings, reducedMotion: true } })));
  expect(screen.queryByTestId('arena-living-canvas')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Play Astral Sage signature' }));
  expect(screen.getByText('Pinch the constellation.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Change Brawler' })).toBeTruthy();
  await view.unmount();
  image.dispose();
});

test('a failed texture is explicit, keeps the static Brawler usable and offers a working retry', async () => {
  const image = loadedArt();
  const skia = jest.requireMock<typeof import('@shopify/react-native-skia')>('@shopify/react-native-skia');
  let failing = true;
  jest.spyOn(skia, 'useImage').mockImplementation(function useFailingImage(source, onError) {
    useEffect(() => { if (source && failing) onError?.(new Error('Texture unavailable')); }, [source, onError]);
    return source && !failing ? image : null;
  });
  const view = await render(<SagePerformance width={350} height={480} artHeight={470} allowed />);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByRole('image', { name: 'Astral Sage artwork' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Play Astral Sage signature' })).toBeTruthy();
  failing = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Retry Sage animation' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getAllByTestId('arena-living-canvas')).toHaveLength(1);
  await view.unmount();
  image.dispose();
});
