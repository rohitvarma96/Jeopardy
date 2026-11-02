import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { FeedbackPulse } from '../../src/components/battle/FeedbackPulse';
import { CollectibleDetails } from '../../src/components/player/CollectibleDetails';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Button, Card, EmptyState, IconSlot, Screen } from '../../src/components/ui';
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
    <Screen title="Reward reveal" description="One deterministic local capsule per completed match. No purchases or real-money randomness." backHref={routes.arena} previewLabel={null}>
      <PlayerDataNotice />
      {!record ? <EmptyState title="No reward yet" description="Finish a battle to earn a mystery capsule." /> : !capsule ? (
        <Card><AppText>This forfeited match does not grant a capsule.</AppText></Card>
      ) : capsule.opened ? (
        <FeedbackPulse eventKey={`${record.matchId}-opened`} motionEnabled={motionEnabled}>
          <Card title={capsule.duplicate ? 'Duplicate converted' : 'Added to your collection'}>
            <CollectibleDetails item={getCollectible(capsule.collectibleId)} />
            <AppText accessibilityLiveRegion="polite">
              {capsule.duplicate ? `Already owned: +${capsule.shards} shards saved.` : 'Collectible saved. Change heroes on Arena or equip boosters during match setup.'}
            </AppText>
            <AppText tone="secondary">Reopening this reward never grants it again.</AppText>
          </Card>
        </FeedbackPulse>
      ) : (
        <Card title="Mystery capsule">
          <IconSlot name="cube-outline" label="Sealed mystery capsule" />
          <AppText>Common, rare or epic fighter or booster. Duplicates convert into shards.</AppText>
          <Button label="Open capsule" loading={busy} disabled={!ready} onPress={async () => {
            setBusy(true);
            try { await openCapsule(record.matchId); } finally { setBusy(false); }
          }} />
        </Card>
      )}
      <Button label="Play again" variant="secondary" onPress={playAgain} />
      <Button label="Arena home" onPress={leaveBattle} />
    </Screen>
  );
}
