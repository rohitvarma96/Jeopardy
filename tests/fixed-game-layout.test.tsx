import { afterEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { humanFighters } from '../src/assets/human-fighters';
import { FighterArt } from '../src/components/fighters/FighterArt';
import { PageDeck } from '../src/components/ui/PageDeck';
import { PagedItems } from '../src/components/ui/PagedItems';
import { Screen } from '../src/components/ui/Screen';
import { FIGHTERS } from '../src/data/fighters';

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => false, replace: jest.fn(), back: jest.fn() }),
}));

afterEach(() => { jest.restoreAllMocks(); });

test('fixed game screens contain no scroll host and retain bottom navigation', async () => {
  await render(<Screen title="Fixed screen" description="Game screen" previewLabel={null}>
    <ReactNative.Text>Viewport content</ReactNative.Text>
  </Screen>);
  expect(JSON.stringify(screen.toJSON())).not.toMatch(/ScrollView|FlatList/);
  expect(screen.getByTestId('screen-content')).toBeTruthy();
  expect(screen.getByTestId('game-navigation')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Arena' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Career' })).toBeTruthy();
});

test('section paging makes only one self-contained panel active', async () => {
  await render(<PageDeck pages={[
    { id: 'one', label: 'Player', content: <ReactNative.Text>Identity content</ReactNative.Text> },
    { id: 'two', label: 'Stats', content: <ReactNative.Text>Statistics content</ReactNative.Text> },
  ]} />);
  expect(screen.queryByText('Statistics content')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Next section' }));
  expect(screen.getByText('Statistics content')).toBeTruthy();
  expect(screen.queryByText('Identity content')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Previous section' }));
  expect(screen.getByText('Identity content')).toBeTruthy();
});

test.each([1, 2])('paged collections expose every item without scrolling at %sx text', async (fontScale) => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 320, height: 568, fontScale, scale: 1 });
  const items = Array.from({ length: 10 }, (_, index) => String(index + 1));
  await render(<PagedItems items={items} keyExtractor={(item) => item} label="Items" itemHeight={64}
    renderItem={(item) => <ReactNative.Text>{`Entry ${item}`}</ReactNative.Text>} />);
  const seen = new Set<string>();
  for (let index = 0; index < 10; index++) {
    screen.queryAllByText(/^Entry /).forEach((item) => seen.add(item.props.children));
    const next = screen.getByRole('button', { name: 'Next Items' });
    if (next.props.accessibilityState.disabled) break;
    await fireEvent.press(next);
  }
  expect(seen.size).toBe(10);
  expect(JSON.stringify(screen.toJSON())).not.toContain('ScrollView');
});

test.each(FIGHTERS)('$name uses a complete human illustration without the old vector mascot', async (fighter) => {
  await render(<FighterArt fighterId={fighter.id} height={180} />);
  const art = humanFighters[fighter.id];
  const image = screen.getByRole('image', { name: `${fighter.name} artwork` });
  expect(image.props.source).toBe(art.source);
  expect(ReactNative.StyleSheet.flatten(image.props.style)).toMatchObject({
    height: 180, width: 180 * art.width / art.height,
  });
  expect(art.width / art.height).toBeGreaterThan(0.45);
  expect(art.width / art.height).toBeLessThan(0.65);
  expect(JSON.stringify(screen.toJSON())).not.toContain('Canvas');
});
