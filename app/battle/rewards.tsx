import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { chestFamilyFor } from '../../src/assets/chests';
import { ChestRitual, type ChestDiscovery } from '../../src/components/player/ChestRitual';
import { SceneAction, SceneText } from '../../src/components/world/SceneControls';
import { WorldScene } from '../../src/components/world/WorldScene';
import { getCollectible } from '../../src/data/collectibles';
import { getFighter } from '../../src/data/fighters';
import { leaveBattle, returnToVault } from '../../src/features/battle/session';
import { usePlayerStore } from '../../src/store/player-store';
import { routes } from '../../src/navigation/routes';

export default function Rewards() {
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const latest = usePlayerStore((state) => state.matches[0]?.matchId);
  const id = matchId ?? latest;
  return <RewardScene key={id ?? 'missing'} matchId={id} />;
}

function RewardScene({ matchId }: { matchId?: string }) {
  const router = useRouter();
  const player = usePlayerStore();
  const [busy, setBusy] = useState(false);
  const [equipBusy, setEquipBusy] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [animateReveal, setAnimateReveal] = useState(false);
  const opening = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const record = player.matches.find((match) => match.matchId === matchId);
  const capsule = record?.capsule;
  const item = capsule?.opened ? getCollectible(capsule.collectibleId) : null;
  const open = async () => {
    if (!record || opening.current) return;
    opening.current = true;
    setPresenting(true);
    setBusy(true);
    try {
      const saved = await player.openCapsule(record.matchId);
      if (!saved && mounted.current) { opening.current = false; setPresenting(false); }
    } finally { if (mounted.current) setBusy(false); }
  };
  if (!record || !capsule || player.status !== 'ready') return <WorldScene title="Reward chest"
    utilities={false} onBack={returnToVault} backLabel="Return to Vault">
    {!record ? <View style={styles.center}><SceneText>No reward yet. Finish a duel to earn a chest.</SceneText>
      <SceneAction label="Arena home" icon="arena" onPress={leaveBattle} /></View>
      : !capsule ? <View style={styles.center}><SceneText>This forfeited match does not grant a chest.</SceneText></View> : null}
  </WorldScene>;
  const action: ChestDiscovery['action'] = !item || capsule.duplicate ? undefined : item.kind === 'fighter'
    ? {
        label: player.fighterId === item.fighterId ? 'Equipped' : 'Equip',
        accessibilityLabel: player.fighterId === item.fighterId ? 'Equipped' : `Equip ${getFighter(item.fighterId).name}`,
        disabled: player.fighterId === item.fighterId, loading: equipBusy,
        onPress: async () => {
            setEquipBusy(true);
            try { await player.saveFighter(item.fighterId); } finally { setEquipBusy(false); }
        },
      }
    : { label: 'Inspect', accessibilityLabel: 'Inspect in Armory', onPress: () => { returnToVault(); router.navigate(routes.armory); } };
  return <ChestRitual family={chestFamilyFor(record.seed, record.matchId)} opened={capsule.opened}
    opening={presenting} busy={busy} onOpen={open} onBack={returnToVault} error={player.error}
    onRevealComplete={() => { opening.current = false; setAnimateReveal(true); setPresenting(false); }}
    animateReveal={animateReveal}
    discovery={item ? { item, duplicate: capsule.duplicate, shards: capsule.shards, action } : undefined} />;
}
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: 20 },
});
