import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ResultTableau } from '../../src/components/battle/ResultTableau';
import { PagedItems } from '../../src/components/ui/PagedItems';
import { SceneAction, SceneText, SigilButton } from '../../src/components/world/SceneControls';
import { WorldOverlay } from '../../src/components/world/WorldOverlay';
import { WorldScene } from '../../src/components/world/WorldScene';
import { leaveBattle, playAgain } from '../../src/features/battle/session';
import { useBattleStore } from '../../src/features/battle/store';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';

export default function Result() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const battle = useBattleStore((state) => state.battle);
  const player = usePlayerStore();
  const [details, setDetails] = useState(false);
  const savingBattle = battle?.outcome && (!matchId || matchId === battle.setup.matchId) ? battle : null;
  useEffect(() => { if (savingBattle) void usePlayerStore.getState().claimMatch(savingBattle); }, [savingBattle]);
  const id = matchId ?? (battle?.outcome ? battle.setup.matchId : player.matches[0]?.matchId);
  const record = player.matches.find((match) => match.matchId === id);
  const won = record?.outcome.winner === 'player';
  return <WorldScene title={record ? won ? 'Victory' : 'Defeat' : 'Results'} utilities={false}
    entrance={false}
    onBack={leaveBattle} backLabel="Leave results" footer={record ? <View style={styles.actions}>
      <SceneAction label={record.capsule && !record.capsule.opened ? 'Open' : 'Home'}
        accessibilityLabel={record.capsule && !record.capsule.opened ? 'Open earned chest' : 'Arena home'} icon={record.capsule && !record.capsule.opened ? 'vault' : 'arena'}
        style={styles.primary} onPress={() => record.capsule && !record.capsule.opened
          ? router.push({ pathname: routes.rewards, params: { matchId: record.matchId } }) : leaveBattle()} />
      <SigilButton icon="deploy" label="Rematch" onPress={playAgain} />
      <SigilButton icon="career" label="Inspect match record" onPress={() => setDetails(true)} />
    </View> : undefined}>
    {!record ? <View style={styles.recovery}>
      <SceneText>{savingBattle ? 'Securing your result and rewards before another duel.' : matchId ? 'The requested match was not found.' : 'No result yet. Finish a duel first.'}</SceneText>
      {savingBattle ? <SceneAction label="Retry reward grant" icon="career" disabled={player.status !== 'ready'}
        onPress={async () => { await player.claimMatch(savingBattle); }} /> : <SceneAction label="Arena home" icon="arena" onPress={leaveBattle} />}
    </View> : <ResultTableau key={record.matchId} record={record}
      fresh={!matchId && Boolean(battle?.outcome) && battle?.setup.matchId === record.matchId && player.matches[0]?.matchId === record.matchId}
      account={player.matches[0]?.matchId === record.matchId && player.profile.level === record.levelAfter ? player.profile : undefined} />}
    {details && record ? <WorldOverlay title="Match record" onClose={() => setDetails(false)}>
      <PagedItems items={[
        { label: 'Your damage score', value: record.fighters.player.score },
        { label: 'Rival damage score', value: record.fighters.opponent.score },
        { label: 'Your final HP', value: record.fighters.player.hp },
        { label: 'Rival final HP', value: record.fighters.opponent.hp },
        { label: 'Correct answers', value: record.fighters.player.stats.correct },
        { label: 'Wrong answers', value: record.fighters.player.stats.wrong },
        { label: 'Timeouts', value: record.fighters.player.stats.timeouts },
        { label: 'Attacks blocked', value: record.fighters.player.stats.attacksBlocked },
      ]} keyExtractor={(item) => item.label} label="Match details" itemHeight={52}
        renderItem={(item) => <SceneText>{item.label}: {item.value}</SceneText>} />
      <SceneText muted>Damage is the score, not XP or remaining HP. Rewards are saved exactly once.</SceneText>
    </WorldOverlay> : null}
  </WorldScene>;
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  primary: { flex: 1 },
  recovery: { flex: 1, justifyContent: 'center', gap: 20 },
});
