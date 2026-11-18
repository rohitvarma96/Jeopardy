import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { chestFamilyFor } from '../../src/assets/chests';
import { FeedbackPulse } from '../../src/components/battle/FeedbackPulse';
import { CollectibleDetails } from '../../src/components/player/CollectibleDetails';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { RewardChest } from '../../src/components/player/RewardChest';
import { AppText, Button, EmptyState, Screen } from '../../src/components/ui';
import { getCollectible } from '../../src/data/collectibles';
import { leaveBattle, playAgain } from '../../src/features/battle/session';
import { useBattleMotion } from '../../src/hooks/useBattleMotion';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';

export default function Rewards() {
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const matches = usePlayerStore((state) => state.matches);
  const ready = usePlayerStore((state) => state.status === 'ready');
  const openCapsule = usePlayerStore((state) => state.openCapsule);
  const [busy, setBusy] = useState(false);
  const motionEnabled = useBattleMotion();
  const record = matches.find((entry) => entry.matchId === (matchId ?? matches[0]?.matchId));
  const capsule = record?.capsule;

  return (
    <Screen title="Reward reveal" description="One earned chest per completed match. Chest appearance does not change reward odds."
      backHref={routes.arena} previewLabel={null} exitHref={routes.arena} exitLabel="Arena home" onExit={leaveBattle}
      footer={<Button label="Play again" variant="secondary" onPress={playAgain} />}>
      <PlayerDataNotice />
      {!record ? <EmptyState title="No reward yet" description="Finish a battle to earn a reward chest." /> : !capsule ? (
        <AppText>This forfeited match does not grant a chest.</AppText>
      ) : capsule.opened ? (
        <FeedbackPulse eventKey={`${record.matchId}-opened`} motionEnabled={motionEnabled} style={styles.reveal}>
          <RewardChest family={chestFamilyFor(record.seed, record.matchId)} opened compact />
          <View style={styles.loot}>
            <AppText variant="heading">{capsule.duplicate ? 'Duplicate converted' : 'Added to your collection'}</AppText>
            <CollectibleDetails item={getCollectible(capsule.collectibleId)} />
            <AppText accessibilityLiveRegion="polite">
              {capsule.duplicate ? `Already owned: +${capsule.shards} shards saved.` : 'Collectible saved. Change heroes on Arena or equip boosters during match setup.'}
            </AppText>
          </View>
        </FeedbackPulse>
      ) : (
        <View style={styles.reveal}>
          <RewardChest family={chestFamilyFor(record.seed, record.matchId)} opened={false} busy={busy}
            disabled={!ready} onOpen={async () => {
            setBusy(true);
            try { await openCapsule(record.matchId); } finally { setBusy(false); }
          }} />
          <AppText variant="caption" tone="secondary">Common 70% / Rare 25% / Epic 5%. Duplicates become shards.</AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  reveal: { flex: 1, minHeight: 0, gap: 8 },
  loot: { flex: 1, minHeight: 0, gap: 8 },
});
