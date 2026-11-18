import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BattleScene } from '../../src/components/battle/BattleScene';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Button, Card, EmptyState, HealthBar, Screen } from '../../src/components/ui';
import { PagedItems } from '../../src/components/ui/PagedItems';
import { getBooster } from '../../src/data/boosters';
import { getFighter } from '../../src/data/fighters';
import { leaveBattle, playAgain } from '../../src/features/battle/session';
import { useBattleStore } from '../../src/features/battle/store';
import { SIDES, selectBattleView } from '../../src/game/battle';
import { useBattleMotion } from '../../src/hooks/useBattleMotion';
import { usePlayerStore } from '../../src/store/player-store';
import { exitPreview } from '../../src/navigation/exitPreview';
import { routes } from '../../src/navigation/routes';
import { spacing } from '../../src/theme';

export default function Result() {
  const router = useRouter();
  const battle = useBattleStore((state) => state.battle);
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const matches = usePlayerStore((state) => state.matches);
  const claimMatch = usePlayerStore((state) => state.claimMatch);
  const ready = usePlayerStore((state) => state.status === 'ready');
  const motionEnabled = useBattleMotion();
  const savingBattle = battle?.outcome && (matchId === undefined || matchId === battle.setup.matchId) ? battle : null;
  useEffect(() => { if (savingBattle) void claimMatch(savingBattle); }, [savingBattle, claimMatch]);
  const id = matchId ?? (battle?.outcome ? battle.setup.matchId : matches[0]?.matchId);
  const record = matches.find((entry) => entry.matchId === id);
  if (!record) return <Screen title="Results"
    description={savingBattle ? 'Saving your match and rewards locally.' : matchId ? 'The requested match was not found.' : 'No finished battle to show.'}
    previewLabel={null}>
    <PlayerDataNotice />
    {savingBattle ? <Button label="Retry reward grant" disabled={!ready} onPress={() => void claimMatch(savingBattle)} />
      : <EmptyState icon="ribbon-outline" title="No result yet" description="Finish a battle to see its result here."
        action={<Button label="Arena home" onPress={() => exitPreview()} />} />}
  </Screen>;
  const { outcome, fighters } = record;
  return <Screen title={outcome.winner === 'player' ? 'Victory' : 'Defeat'}
    description={`Final score is damage dealt, not XP or remaining HP.`} previewLabel={null}
    exitHref={routes.arena} exitLabel="Arena home" onExit={leaveBattle}
    footer={<View style={styles.actions}>
      <Button label="Continue" disabled={!ready} style={styles.action}
        onPress={() => router.push({ pathname: routes.rewards, params: { matchId: record.matchId } })} />
      <Button label="Play again" variant="secondary" style={styles.action} onPress={playAgain} />
    </View>}
    pages={[
      { id: 'outcome', label: 'Outcome', content: <>
        <AppText variant="heading">{outcome.winner === 'player' ? 'You defeated' : 'You lost to'} {fighters.opponent.name}</AppText>
        <View style={styles.scene}>
          {battle?.outcome && battle.setup.matchId === record.matchId
            ? <BattleScene view={selectBattleView(battle, battle.nowMs)} motionEnabled={motionEnabled} outcomeOnly fill />
            : <AppText>Saved match / {getFighter(fighters.player.fighterId).name} vs {getFighter(fighters.opponent.fighterId).name}</AppText>}
        </View>
      </> },
      { id: 'scores', label: 'Final scores', content: <Card style={styles.page}>
        <AppText variant="heading">Final scores</AppText>
        <AppText>You: {fighters.player.score}</AppText>
        <AppText>{fighters.opponent.name}: {fighters.opponent.score}</AppText>
        <HealthBar label="Your health" value={fighters.player.hp} max={record.startingHp} animate={motionEnabled} />
        <HealthBar label={`${fighters.opponent.name} health`} value={fighters.opponent.hp} max={record.startingHp} animate={motionEnabled} />
      </Card> },
      ...SIDES.map((side) => {
        const fighter = fighters[side];
        const used = fighter.boostersUsed.map((boosterId) => getBooster(boosterId).name);
        const rows = [
          { label: 'Correct answers', value: fighter.stats.correct },
          { label: 'Wrong answers', value: fighter.stats.wrong },
          { label: 'Timeouts', value: fighter.stats.timeouts },
          { label: 'Damage dealt', value: fighter.stats.damageDealt },
          { label: 'Attacks blocked', value: fighter.stats.attacksBlocked },
          { label: 'Best combo', value: fighter.bestCombo },
          { label: 'Boosters used', value: used.length ? used.join(', ') : 'None' },
        ];
        return { id: side, label: side === 'player' ? 'Your stats' : 'Rival stats', content: <>
          <AppText variant="heading">{side === 'player' ? 'You' : fighter.name} - {getFighter(fighter.fighterId).name}</AppText>
          <PagedItems items={rows} keyExtractor={(item) => item.label} label="Battle stats" itemHeight={52}
            renderItem={(item) => <AppText>{item.label}: {item.value}</AppText>} />
        </> };
      }),
      { id: 'rewards', label: 'Rewards', content: <Card title="Rewards saved" style={styles.page}>
        <AppText variant="heading">+{record.xp} XP / +{record.coins} coins</AppText>
        <AppText>Level {record.levelBefore} to {record.levelAfter}</AppText>
        {record.levelAfter > record.levelBefore ? <AppText accessibilityLiveRegion="polite">Level up!</AppText> : null}
        <AppText tone="secondary">{record.capsule ? record.capsule.opened
          ? 'Chest already opened. Your collectible is saved.' : 'One earned chest is ready to open.'
          : 'Forfeits do not grant rewards or a chest.'}</AppText>
        {__DEV__ ? <Button label="Animation preview" variant="ghost" onPress={() => router.push(routes.animationPreview)} /> : null}
      </Card> },
    ]}>
    <PlayerDataNotice />
  </Screen>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.small },
  action: { flex: 1 },
  scene: { flex: 1, minHeight: 0 },
  page: { flex: 1, minHeight: 0, padding: spacing.small, gap: spacing.small, justifyContent: 'space-evenly' },
});
