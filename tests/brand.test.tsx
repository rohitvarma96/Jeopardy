import { afterEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import BrandStudio from '../app/brand-studio';
import { BRAND } from '../src/assets/brand';
import { BrandLogo } from '../src/components/brand/BrandLogo';
import { KeyVisual } from '../src/components/brand/KeyVisual';
import { TypeUnit } from '../src/components/brand/TypeUnit';
import { CollectibleDetails } from '../src/components/player/CollectibleDetails';
import { getCollectible } from '../src/data/collectibles';
import { routes } from '../src/navigation/routes';
import { usePlayerStore } from '../src/store/player-store';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, canGoBack: () => false, replace: jest.fn(), back: jest.fn() }),
}));

afterEach(() => { jest.restoreAllMocks(); });

test.each(['color', 'chalk', 'ink'] as const)('%s logo is a bundled readable image with the same aspect ratio', async (variant) => {
  await render(<BrandLogo width={220} variant={variant} />);
  const logo = screen.getByRole('image', { name: 'Brain Brawlers logo' });
  expect(logo.props.source).toBe(BRAND.logo[variant]);
  expect(StyleSheet.flatten(logo.props.style)).toMatchObject({ width: 220, height: 70 });
});

test('decorative logo copies do not repeat screen reader announcements', async () => {
  await render(<BrandLogo decorative />);
  expect(screen.queryByRole('image', { name: 'Brain Brawlers logo' })).toBeNull();
});

test('type units expose one meaningful heading and do not animate question text', async () => {
  await render(<TypeUnit lead="Think fast." punch="Hit harder." />);
  expect(screen.getByRole('header', { name: 'Think fast. Hit harder.' })).toBeTruthy();
  expect(JSON.stringify(screen.toJSON())).not.toMatch(/Animated|ScrollView/);
});

test('key artwork has a useful description without duplicate logo/marketing headings', async () => {
  await render(<KeyVisual compact />);
  expect(screen.getByRole('image', { name: /Original Brain Brawlers artwork/ })).toBeTruthy();
  expect(screen.queryByRole('header', { name: 'Think fast. Hit harder.' })).toBeNull();
  expect(screen.queryByRole('image', { name: 'Brain Brawlers logo' })).toBeNull();
  expect(StyleSheet.flatten(screen.getByRole('image', { name: /Original Brain Brawlers artwork/ }).props.style))
    .toMatchObject({ width: '100%', height: '100%' });
});

test('short artwork panels omit the type unit rather than clipping the punchline', async () => {
  await render(<KeyVisual testID="key-art" />);
  await fireEvent(screen.getByTestId('key-art'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 114 } },
  });
  expect(screen.queryByText('HIT HARDER.', { includeHiddenElements: true })).toBeNull();
  await fireEvent(screen.getByTestId('key-art'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 115 } },
  });
  expect(screen.getByText('HIT HARDER.', { includeHiddenElements: true })).toBeTruthy();
});

test('brand studio switches logo treatments without mutating saved game data', async () => {
  const before = usePlayerStore.getState();
  await render(<BrandStudio />);
  expect(screen.getByRole('header', { name: 'Brand studio' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Show monochrome logo' }));
  expect(screen.getByRole('button', { name: 'Show color logo' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Next section' }));
  expect(screen.getByRole('image', { name: /Original Brain Brawlers artwork/ })).toBeTruthy();
  expect(usePlayerStore.getState()).toBe(before);
  expect(mockPush).not.toHaveBeenCalled();
  expect(routes.brandStudio).toBe('/brand-studio');
});

test('collection rarity calls characters Brawlers without changing their saved IDs', async () => {
  const item = getCollectible('fighter:shadow');
  await render(<CollectibleDetails item={item} />);
  expect(screen.getByText('Rare Brawler')).toBeTruthy();
  expect(screen.queryByText('Rare fighter')).toBeNull();
  expect(item.id).toBe('fighter:shadow');
});
