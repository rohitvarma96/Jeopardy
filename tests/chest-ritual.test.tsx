import { afterEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { CHESTS, CHEST_FAMILIES } from '../src/assets/chests';
import { duplicateBrawlers } from '../src/assets/chest-ritual';
import { humanFighters } from '../src/assets/human-fighters';
import { ChestRitual } from '../src/components/player/ChestRitual';
import { getCollectible } from '../src/data/collectibles';

jest.mock('../src/hooks/useBattleMotion', () => ({ useSceneMotion: () => ({ enabled: true, ready: true }) }));
afterEach(() => { jest.restoreAllMocks(); });

const callbacks = { onOpen: jest.fn<() => void>(), onBack: jest.fn<() => void>(), onRevealComplete: jest.fn<() => void>() };

test.each(CHEST_FAMILIES)('%s uses the exact closed/open paintings and section 06 composition', async family => {
  const app = await render(<ChestRitual family={family} opened={false} opening={false} {...callbacks} />);
  expect(screen.getByText('UNLOCK\nTHE LATCH.')).toBeTruthy();
  expect(screen.getByText('TAP THE CHEST LATCH')).toBeTruthy();
  expect(StyleSheet.flatten(screen.getByTestId('ritual-heading').props.style)).toMatchObject({ top: '16%' });
  expect(StyleSheet.flatten(screen.getByTestId('ritual-chest').props.style))
    .toMatchObject({ top: '35%', left: '8%', width: '84%', height: '36%' });
  const closed = screen.getByTestId('chest-closed-painting', { includeHiddenElements: true });
  const open = screen.getByTestId('chest-open-painting', { includeHiddenElements: true });
  expect(closed.props.source).toBe(CHESTS[family].closed);
  expect(open.props.source).toBe(CHESTS[family].open);
  expect(StyleSheet.flatten(closed.props.style)).toMatchObject({ opacity: 1 });
  expect(StyleSheet.flatten(open.props.style)).toMatchObject({ opacity: 0 });
  await app.rerender(<ChestRitual family={family} opened opening {...callbacks} />);
  expect(screen.getByText('REWARD SECURED / CONTAINMENT ACTIVE')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Chest discovery pending', disabled: true })).toBeTruthy();
  expect(StyleSheet.flatten(screen.getByTestId('chest-open-painting', { includeHiddenElements: true }).props.style))
    .toMatchObject({ opacity: 0 });
  expect(StyleSheet.flatten(screen.getByTestId('chest-closed-painting', { includeHiddenElements: true }).props.style))
    .toMatchObject({ opacity: 1 });
  expect(JSON.stringify(screen.toJSON())).not.toContain('Canvas');
});

test('settled discovery uses the unaltered full-body painting without replaying a second entrance', async () => {
  const timing = jest.spyOn(Reanimated, 'withTiming');
  await render(<ChestRitual family="arc" opened opening={false} {...callbacks} animateReveal
    discovery={{ item: getCollectible('fighter:shadow'), duplicate: false, shards: 0 }} />);
  const art = screen.getByTestId('ritual-brawler');
  expect(art.props.source).toBe(humanFighters.shadow.source);
  expect(StyleSheet.flatten(screen.getByTestId('ritual-brawler-frame').props.style))
    .toMatchObject({ top: '15%', left: '12%', width: '76%', height: '75%' });
  expect(StyleSheet.flatten(art.props.style).filter).toBeUndefined();
  expect(screen.getByText('RARE / SWIFT STRIKE')).toBeTruthy();
  expect(timing).not.toHaveBeenCalled();
});

test('duplicate retains the actual faded grayscale Brawler and exact saved shard receipt', async () => {
  await render(<ChestRitual family="sovereign" opened opening={false} {...callbacks}
    discovery={{ item: getCollectible('fighter:shadow'), duplicate: true, shards: 15 }} />);
  expect(screen.getByTestId('ritual-brawler').props.source).toBe(duplicateBrawlers.shadow);
  expect(StyleSheet.flatten(screen.getByTestId('ritual-brawler').props.style)).toMatchObject({ opacity: .24 });
  expect(screen.getByText('DUPLICATE BRAWLER')).toBeTruthy();
  expect(screen.getByText('+15 SHARDS')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Equip' })).toBeNull();
});

test('discovery action remains explicitly accessible and invokes only its provided controller', async () => {
  const equip = jest.fn<() => void>();
  await render(<ChestRitual family="field" opened opening={false} {...callbacks}
    discovery={{ item: getCollectible('fighter:shadow'), duplicate: false, shards: 0,
      action: { label: 'Equip', accessibilityLabel: 'Equip Nightblade', onPress: equip } }} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(equip).toHaveBeenCalledTimes(1);
});
