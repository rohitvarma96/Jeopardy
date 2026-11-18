import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { CHEST_FAMILIES } from '../src/assets/chests';
import { containmentSeams, containmentVapor } from '../src/assets/containment';
import { breachFrame, breachLayout, containmentCloud, containmentMouth, CONTAINMENT_VAPOR_SHADER, CHEST_BREACH } from '../src/components/player/chest-breach';
import { CHEST_PRESENTATION_MS } from '../src/components/player/chest-motion';
import { RewardChest } from '../src/components/player/RewardChest';
import { ChestRitual } from '../src/components/player/ChestRitual';
import { getCollectible } from '../src/data/collectibles';

let mockEnabled = true, mockComplete: (() => void) | undefined;
const { readFileSync } = jest.requireActual<{ readFileSync: (path: string) => Uint8Array }>('node:fs');
jest.mock('../src/hooks/useChestOpening', () => {
  const { useSharedValue } = jest.requireMock<typeof import('react-native-reanimated')>('react-native-reanimated');
  return { useChestOpening: ({ onComplete, suspended }: { onComplete?: () => void; suspended?: boolean }) => {
    mockComplete = onComplete;
    return { progress: useSharedValue(0), motionActive: mockEnabled && !suspended };
  } };
});
afterEach(() => { jest.restoreAllMocks(); mockEnabled = true; mockComplete = undefined; });

test('closed pressure, a real 250 ms hold, motivated opening and actual-reward handoff use one 3200 ms clock', () => {
  expect(CHEST_PRESENTATION_MS).toBe(3200);
  const at = (time: number) => breachFrame(time / 3200);
  expect(at(0)).toMatchObject({ phase: 'isolate', grade: 0, shell: 1, opened: false, reward: 0 });
  expect(at(700)).toMatchObject({ phase: 'pressure', opened: false, reward: 0 });
  expect(at(1020)).toMatchObject({ phase: 'hold', opened: false });
  expect(at(1200)).toEqual(at(1020));
  expect(at(1370)).toMatchObject({ opened: false });
  expect(at(1400)).toMatchObject({ phase: 'rupture', opened: true });
  expect(at(1400).sheet).toBeGreaterThan(0);
  for (let time = 0; time < 1375; time += 25) {
    expect(at(time)).toMatchObject({ sheet: 0, vapor: 0, opened: false });
  }
  expect(at(1900)).toMatchObject({ phase: 'volume', reward: 0 });
  expect(at(2400).reward).toBeGreaterThan(0);
  expect(at(2700)).toMatchObject({ phase: 'receipt', reward: 1, chest: 0 });
  expect(at(3200)).toMatchObject({ phase: 'complete', grade: 0, sheet: 0, vapor: 0, chest: 0, reward: 1, receipt: 1 });
  for (let time = 0; time <= 3200; time += 25) {
    const f = at(time);
    expect(f.push).toBeGreaterThanOrEqual(1);
    expect(f.push).toBeLessThanOrEqual(1.08);
    expect(f.impulse).toBeGreaterThanOrEqual(0);
    expect(f.impulse).toBeLessThanOrEqual(2);
  }
});

test.each(CHEST_FAMILIES)('%s fits its original paintings with source-fitted light and a grounded camera push', family => {
  const geometry = CHEST_BREACH[family];
  const bytes = readFileSync(`assets/images/chests/${family}-open.png`);
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(header.getUint32(16)).toBe(geometry.width);
  expect(header.getUint32(20)).toBe(geometry.height);
  expect(containmentSeams[family]).toBeDefined();
  for (const [width, height] of [[320, 568], [390, 844], [600, 900]]) {
    const layout = breachLayout(width, height, geometry, true);
    expect(layout.x).toBeGreaterThanOrEqual(0);
    expect(layout.y).toBeGreaterThanOrEqual(height * .3);
    expect(layout.floor).toBeCloseTo(height * .53 + geometry.height * layout.scale / 2);
    expect(layout.scale).toBeCloseTo(Math.min(width * .84 / geometry.width, height * .36 / geometry.height));
    expect(geometry.width * layout.scale * 1.08).toBeLessThan(width);
    for (const index of [0, 1, 2]) {
      expect(containmentCloud(1020 / 3200, index, width, height))
        .toEqual(containmentCloud(1220 / 3200, index, width, height));
      expect(containmentCloud(3200 / 3200, index, width, height).opacity).toBe(0);
      for (const time of [1375, 1500, 1900, 2300]) {
        const cloud = containmentCloud(time / 3200, index, width, height, geometry);
        const mouth = containmentMouth(time / 3200, width, height, geometry);
        expect(cloud.y + cloud.height * .41).toBeCloseTo(mouth.y);
        expect(mouth.rimY).toBeGreaterThan(mouth.y);
      }
    }
  }
});

test('the authored smoke atlas is bounded, transparent, source-light resources are selected and no crystal remains', () => {
  const skia = jest.requireMock<typeof import('@shopify/react-native-skia')>('@shopify/react-native-skia');
  const image = skia.Skia.Image.MakeImageFromEncoded(skia.Skia.Data.fromBytes(
    readFileSync('assets/images/chests/containment/vapor-atlas.png')));
  if (!image) throw new Error('Vapor atlas decode failed.');
  try {
    expect(image.width()).toBe(1536); expect(image.height()).toBe(384);
    const pixels = image.readPixels();
    if (!pixels) throw new Error('Vapor pixels unavailable.');
    expect(pixels[3]).toBe(0);
    expect(1536 * 384 * 4).toBeLessThan(3 * 1024 * 1024);
    expect(containmentVapor).toBeDefined();
    const effect = skia.Skia.RuntimeEffect.Make(CONTAINMENT_VAPOR_SHADER);
    expect(effect).not.toBeNull();
    effect?.dispose();
  } finally { image.dispose(); }
});

test('only an active autonomous chest owns an effect canvas; reduced and hidden views retain the paintings', async () => {
  const skia = jest.requireMock<typeof import('@shopify/react-native-skia')>('@shopify/react-native-skia');
  const image = skia.Skia.Image.MakeImageFromEncoded(skia.Skia.Data.fromBytes(readFileSync('assets/images/chests/field-open.png')));
  if (!image) throw new Error('Open chest decode failed.');
  jest.spyOn(skia, 'useImage').mockReturnValue(image);
  const complete = jest.fn<() => void>(), open = jest.fn<() => void>();
  const app = await render(<RewardChest family="field" opened={false} onOpen={open} onRevealComplete={complete} />);
  await fireEvent(screen.getByRole('image', { name: 'Closed Field Chest' }), 'layout', { nativeEvent: { layout: { width: 300, height: 240 } } });
  await fireEvent(screen.getByTestId('chest-open-painting', { includeHiddenElements: true }), 'load');
  expect(screen.queryByTestId('chest-breach-canvas', { includeHiddenElements: true })).toBeNull();
  await app.rerender(<RewardChest family="field" opened opening onOpen={open} onRevealComplete={complete} />);
  expect(screen.getAllByTestId('chest-breach-canvas', { includeHiddenElements: true })).toHaveLength(1);
  expect(StyleSheet.flatten(screen.getByTestId('chest-open-painting', { includeHiddenElements: true }).props.style).opacity).toBe(0);
  await fireEvent.press(screen.getByRole('button', { name: 'Chest discovery pending' }));
  expect(open).not.toHaveBeenCalled();
  mockEnabled = false;
  await app.rerender(<RewardChest family="field" opened opening onRevealComplete={complete} />);
  expect(screen.queryByTestId('chest-breach-canvas', { includeHiddenElements: true })).toBeNull();
  await act(() => mockComplete?.());
  expect(complete).toHaveBeenCalledTimes(1);
  await app.unmount();
  image.dispose();
});

test('the ritual owns only one clock and preloads the true pending reward without exposing its action or receipt early', async () => {
  const skia = jest.requireMock<typeof import('@shopify/react-native-skia')>('@shopify/react-native-skia');
  const image = skia.Skia.Image.MakeImageFromEncoded(skia.Skia.Data.fromBytes(readFileSync('assets/images/chests/field-open.png')));
  if (!image) throw new Error('Fixture art decode failed.');
  const source = jest.spyOn(skia, 'useImage').mockReturnValue(image);
  const complete = jest.fn<() => void>(), equip = jest.fn<() => void>();
  const app = await render(<ChestRitual family="field" opened opening onOpen={jest.fn<() => void>()}
    onRevealComplete={complete} onBack={jest.fn<() => void>()}
    discovery={{ item: getCollectible('fighter:shadow'), duplicate: false, shards: 0,
      action: { label: 'Equip', accessibilityLabel: 'Equip Nightblade', onPress: equip } }} />);
  await fireEvent(screen.getByTestId('ritual-stage'), 'layout', { nativeEvent: { layout: { width: 320, height: 568 } } });
  expect(screen.getAllByTestId('chest-breach-canvas', { includeHiddenElements: true })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Equip Nightblade' })).toBeNull();
  expect(screen.queryByText('NEW BRAWLER')).toBeNull();
  expect(source.mock.calls.some(([value]) => value === containmentVapor)).toBe(true);
  await act(() => mockComplete?.());
  expect(complete).toHaveBeenCalledTimes(1);
  expect(equip).not.toHaveBeenCalled();
  await app.unmount();
  image.dispose();
});
