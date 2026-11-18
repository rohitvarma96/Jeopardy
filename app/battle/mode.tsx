import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FighterArt } from '../../src/components/fighters/FighterArt';
import { AppText, Badge, Button, Screen, SelectableCard } from '../../src/components/ui';
import { PagedItems } from '../../src/components/ui/PagedItems';
import { GAME_MODES } from '../../src/data/modes';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import type { GameModeId } from '../../src/game/types/match';
import { routes } from '../../src/navigation/routes';
import { spacing } from '../../src/theme';

export default function Mode() {
  const router = useRouter();
  const { height, fontScale } = useWindowDimensions();
  const beginSetup = useMatchSetupStore((state) => state.beginSetup);
  const [modeId, setModeId] = useState<GameModeId>('offline-duel');
  return <Screen title="Mode selection" description="Choose your challenge. Make every answer count."
    backHref={routes.arena} previewLabel={null}
    footer={<Button label="Find opponent" variant="gold" onPress={() => {
      beginSetup(modeId); router.push(routes.matchmaking);
    }} />}
    pages={[
      { id: 'duel', label: 'Play now', content: <>
        {GAME_MODES.filter((mode) => mode.available).map((mode) => <SelectableCard key={mode.id}
          label={mode.name} hint={mode.description} selected={mode.id === modeId}
          onPress={() => setModeId(mode.id)} style={styles.card}>
          <Badge label="Available offline" tone="success" />
          {fontScale < 1.5 ? <View style={styles.scene}>
            <FighterArt fighterId="ember" height={Math.max(80, Math.min(240, height * 0.24))} />
            <AppText variant="heading" tone="accent">VS</AppText>
            <FighterArt fighterId="frost" height={Math.max(80, Math.min(240, height * 0.24))} />
          </View> : null}
          <AppText variant="heading">{mode.name}</AppText>
          <AppText tone="secondary">{mode.description}</AppText>
        </SelectableCard>)}
        <AppText variant="caption" tone="secondary">Local AI opponent. No connection needed.</AppText>
      </> },
      { id: 'future', label: 'Future modes', content: <PagedItems
        items={GAME_MODES.filter((mode) => !mode.available)} keyExtractor={(mode) => mode.id}
        label="Future modes" itemHeight={140} renderItem={(mode) => <SelectableCard
          label={`${mode.name}, unavailable future mode`} hint={mode.description}
          selected={false} disabled onPress={() => setModeId(mode.id)}>
          <AppText variant="heading">{mode.name}</AppText>
          <AppText variant="caption" tone="secondary">{mode.description}</AppText>
          <Badge label="Coming soon" />
        </SelectableCard>} /> },
    ]} />;
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 0, justifyContent: 'space-evenly', padding: spacing.small },
  scene: { flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
});
