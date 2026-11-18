import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PlayerAvatar } from '../../src/components/player/PlayerAvatar';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Badge, Button, Card, EmptyState, ProgressBar, Screen } from '../../src/components/ui';
import { PagedItems } from '../../src/components/ui/PagedItems';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';
import { spacing } from '../../src/theme';

export default function Profile() {
  const router = useRouter();
  const player = usePlayerStore((state) => state.profile);
  const matches = usePlayerStore((state) => state.matches);
  const avatarId = usePlayerStore((state) => state.avatarId);
  const ready = usePlayerStore((state) => state.status === 'ready');
  const wins = matches.filter((match) => match.outcome.winner === 'player').length;
  const totals = matches.reduce((sum, match) => {
    const stats = match.fighters.player.stats;
    return {
      correct: sum.correct + stats.correct, questions: sum.questions + stats.correct + stats.wrong + stats.timeouts,
      damage: sum.damage + stats.damageDealt, combo: Math.max(sum.combo, match.fighters.player.bestCombo),
    };
  }, { correct: 0, questions: 0, damage: 0, combo: 0 });
  const stats = [
    { label: 'Matches', value: matches.length }, { label: 'Wins', value: wins },
    { label: 'Losses', value: matches.length - wins },
    { label: 'Win rate', value: matches.length ? `${Math.round(wins / matches.length * 100)}%` : '--' },
    { label: 'Answer accuracy', value: totals.questions ? `${Math.round(totals.correct / totals.questions * 100)}%` : '--' },
    { label: 'Correct answers', value: totals.correct }, { label: 'Damage dealt', value: totals.damage },
    { label: 'Best combo', value: totals.combo },
  ];
  return <Screen title="Profile" description="Local progression and completed match history." tabScreen previewLabel={null}
    headerAction={<Button label="Settings" variant="secondary" onPress={() => router.push(routes.settings)} />}
    pages={ready ? [
      { id: 'identity', label: 'Player', content: <Card style={styles.card}>
        <View style={styles.identity}>
          <PlayerAvatar username={player.username} avatarId={avatarId} appearance="volt" />
          <View style={styles.name}>
            <AppText variant="heading">{player.username}</AppText>
            <AppText tone="secondary">Local player / Level {player.level}</AppText>
          </View>
        </View>
        <Badge label={`Demo rank: ${player.rank}`} tone="accent" />
        <ProgressBar label={`XP to level ${player.level + 1}`} value={player.xp} max={player.xpForNextLevel} />
        <AppText>Coins: {player.coins} / Shards: {player.shards}</AppText>
        <AppText variant="caption" tone="secondary">Earned progress and your identity are saved on this device. Starting values are demo data.</AppText>
      </Card> },
      { id: 'statistics', label: 'Statistics', content: <>
        <AppText variant="heading">Match statistics</AppText>
        <PagedItems items={stats} keyExtractor={(item) => item.label} label="Statistics" columns={2} itemHeight={72}
          renderItem={(item) => <Card style={styles.stat}>
            <AppText variant="caption" tone="secondary">{item.label}</AppText>
            <AppText variant="heading">{item.value}</AppText>
          </Card>} />
      </> },
      { id: 'history', label: 'History', content: <>
        <AppText variant="heading">Recent matches</AppText>
        {matches.length ? <PagedItems items={matches.slice(0, 10)} keyExtractor={(item) => item.matchId}
          label="Matches" itemHeight={84} renderItem={(match) => <Button
            label={`${match.outcome.winner === 'player' ? 'Victory' : 'Defeat'}${match.outcome.reason === 'forfeit' ? ' (forfeit)' : ''} vs ${match.fighters.opponent.name} - ${match.matchId}`}
            variant="secondary" onPress={() => router.push({ pathname: routes.result, params: { matchId: match.matchId } })} />} />
          : <EmptyState icon="time-outline" title="No completed matches yet"
            description="Play an offline duel to start your history."
            action={<Button label="Go to Arena" onPress={() => router.navigate(routes.arena)} />} />}
      </> },
    ] : undefined}>
    <PlayerDataNotice />
  </Screen>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  name: { flex: 1, minWidth: 0, gap: spacing.xsmall },
  card: { flex: 1, minHeight: 0, justifyContent: 'space-evenly', padding: spacing.small, gap: spacing.small },
  stat: { padding: spacing.small, gap: spacing.xsmall },
});
