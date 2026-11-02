import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fighterArt } from '../../src/assets/registry';
import { FighterArt } from '../../src/components/fighters/FighterArt';
import { MatchSetupScreen } from '../../src/components/navigation/MatchSetupScreen';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Badge, Button, SelectableCard } from '../../src/components/ui';
import { FIGHTERS, getFighter } from '../../src/data/fighters';
import { getCollectible } from '../../src/data/collectibles';
import { isDraftComplete } from '../../src/features/category-draft/draft';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import type { FighterId } from '../../src/game/types/fighter';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';
import { spacing } from '../../src/theme';

export default function FighterSelect() {
  const router = useRouter();
  const draftComplete = useMatchSetupStore((state) => isDraftComplete(state.draft));
  const matchFighter = useMatchSetupStore((state) => state.fighterId);
  const confirmFighter = useMatchSetupStore((state) => state.confirmFighter);
  const playerReady = usePlayerStore((state) => state.status === 'ready');
  const savedFighter = usePlayerStore((state) => state.fighterId);
  const saveFighter = usePlayerStore((state) => state.saveFighter);
  const collectionIds = usePlayerStore((state) => state.collectionIds);
  const [saving, setSaving] = useState(false);
  const [choice, setChoice] = useState<FighterId | null>(null);
  const saveGeneration = useRef(0);
  useFocusEffect(useCallback(() => () => { saveGeneration.current += 1; }, []));
  const selected = choice ?? matchFighter ?? savedFighter;

  if (!draftComplete) {
    return <MatchSetupScreen step="fighterSelect" blocked="Complete the category draft before choosing a fighter." />;
  }

  return (
    <MatchSetupScreen step="fighterSelect">
      {playerReady ? (
        <>
          <PlayerDataNotice />
          {FIGHTERS.map((fighter) => (
            <SelectableCard
              key={fighter.id}
              label={fighter.name}
              hint={`${fighter.role}. Passive: ${fighter.passive.description}`}
              selected={selected === fighter.id}
              disabled={saving || !collectionIds.includes(`fighter:${fighter.id}`)}
              onPress={() => setChoice(fighter.id)}
            >
              <View style={styles.row}>
                <FighterArt fighterId={fighter.id} height={120} />
                <View style={styles.fill}>
                  <AppText variant="heading">{fighter.name}</AppText>
                  <AppText variant="label" tone="accent">{fighter.role}</AppText>
                  <AppText variant="caption" tone="secondary">{fighter.identity}</AppText>
                  <Badge label={`Rarity: ${getCollectible(`fighter:${fighter.id}`).rarity}`} />
                  {fighterArt[fighter.id] ? null : <Badge label="Placeholder art" />}
                </View>
              </View>
              <AppText variant="label">Passive: {fighter.passive.name}</AppText>
              <AppText variant="caption" tone="secondary">{fighter.passive.description}</AppText>
              {!collectionIds.includes(`fighter:${fighter.id}`) ? <Badge label="Locked - collect from a capsule" /> : null}
            </SelectableCard>
          ))}
          <Button
            label={`Confirm ${getFighter(selected).name}`}
            loading={saving}
            disabled={!collectionIds.includes(`fighter:${selected}`)}
            onPress={async () => {
              const generation = saveGeneration.current;
              setSaving(true);
              try {
                if (!await saveFighter(selected)) return;
                if (generation !== saveGeneration.current) return;
                confirmFighter(selected);
                router.push(routes.loadout);
              } finally { setSaving(false); }
            }}
          />
        </>
      ) : (
        <PlayerDataNotice />
      )}
    </MatchSetupScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.medium },
  fill: { flex: 1, minWidth: 100, gap: spacing.xsmall },
});
