import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BattleScene } from '../../src/components/battle/BattleScene';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Button, Card, EmptyState, HealthBar, Screen } from '../../src/components/ui';
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
  useEffect(() => {
    if (savingBattle) void claimMatch(savingBattle);
  }, [savingBattle, claimMatch]);
  const id = matchId ?? (battle?.outcome ? battle.setup.matchId : matches[0]?.matchId);
  const record = matches.find((entry) => entry.matchId === id);

  if (!record) {
    return (
      <Screen title="Results" description={savingBattle ? 'Saving your match and rewards locally.' : matchId ? 'The requested match was not found.' : 'No finished battle to show.'} previewLabel={null}>
        <PlayerDataNotice />
        {savingBattle ? (
          <Button label="Retry reward grant" disabled={!ready} onPress={() => void claimMatch(savingBattle)} />
        ) : (
        <EmptyState
          icon="ribbon-outline"
          title="No result yet"
          description="Finish a battle to see its result here."
          action={<Button label="Arena home" onPress={() => exitPreview()} />}
        />
        )}
      </Screen>
    );
  }

  const { outcome, fighters } = record;
  const names = { player: 'You', opponent: fighters.opponent.name };

  return (
    <Screen
      title={outcome.winner === 'player' ? 'Victory' : 'Defeat'}
      description={`${outcome.winner === 'player' ? 'You defeated' : 'You lost to'} ${names.opponent}. Final score is damage dealt, not XP or remaining HP.`}
      previewLabel={null}
    >
      <PlayerDataNotice />
      {battle?.outcome && battle.setup.matchId === record.matchId ? (
        <BattleScene view={selectBattleView(battle, battle.nowMs)} motionEnabled={motionEnabled} outcomeOnly />
      ) : null}
      <Card title="Final scores">
        <AppText>You: {fighters.player.score}</AppText>
        <AppText>{names.opponent}: {fighters.opponent.score}</AppText>
      </Card>
      <Card title="Final health">
        <HealthBar label="Your health" value={fighters.player.hp} max={record.startingHp} animate={motionEnabled} />
        <HealthBar label={`${names.opponent} health`} value={fighters.opponent.hp} max={record.startingHp} animate={motionEnabled} />
      </Card>
      {SIDES.map((side) => {
        const fighter = fighters[side];
        const used = fighter.boostersUsed.map((id) => getBooster(id).name);
        const rows: [string, string | number][] = [
          ['Correct answers', fighter.stats.correct],
          ['Wrong answers', fighter.stats.wrong],
          ['Timeouts', fighter.stats.timeouts],
          ['Damage dealt', fighter.stats.damageDealt],
          ['Attacks blocked', fighter.stats.attacksBlocked],
          ['Best combo', fighter.bestCombo],
          ['Boosters used', used.length > 0 ? used.join(', ') : 'None'],
        ];
        return (
          <Card key={side} title={`${side === 'player' ? 'You' : fighter.name} - ${getFighter(fighter.fighterId).name}`}>
            <View style={styles.rows}>
              {rows.map(([label, value]) => (
                <AppText key={label}>
                  {label}: {value}
                </AppText>
              ))}
            </View>
          </Card>
        );
      })}
      <Card title="Rewards saved">
        <AppText variant="heading">+{record.xp} XP / +{record.coins} coins</AppText>
        <AppText>Level {record.levelBefore} to {record.levelAfter}</AppText>
        {record.levelAfter > record.levelBefore ? <AppText accessibilityLiveRegion="polite">Level up!</AppText> : null}
        <AppText tone="secondary">{record.capsule ? record.capsule.opened ? 'Capsule already revealed. Your collectible is saved.' : 'One mystery capsule is ready to reveal.' : 'Forfeits do not grant rewards or a capsule.'}</AppText>
      </Card>
      <Button label="Continue" disabled={!ready} onPress={() => router.push({ pathname: routes.rewards, params: { matchId: record.matchId } })} />
      <Button label="Play again" onPress={playAgain} />
      <Button label="Arena home" variant="secondary" onPress={leaveBattle} />
      {__DEV__ ? <Button label="Animation preview" variant="ghost" onPress={() => router.push(routes.animationPreview)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rows: { gap: spacing.xsmall },
});
