import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PlayerAvatar } from '../../src/components/player/PlayerAvatar';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Badge, Button, Card, EmptyState, ProgressBar, Screen } from '../../src/components/ui';
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

  return (
    <Screen title="Profile" description="Local progression and completed match history." tabScreen previewLabel={null}>
      <PlayerDataNotice />
      {ready ? <>
      <Card>
        <View style={styles.identity}>
          <PlayerAvatar username={player.username} avatarId={avatarId} />
          <View style={styles.name}>
            <AppText variant="heading">{player.username}</AppText>
            <AppText tone="secondary">Local player / Level {player.level}</AppText>
          </View>
        </View>
        <Badge label={`Demo rank: ${player.rank}`} tone="accent" />
        <ProgressBar label={`XP to level ${player.level + 1}`} value={player.xp} max={player.xpForNextLevel} />
        <AppText>Coins: {player.coins} / Shards: {player.shards}</AppText>
        <AppText variant="caption" tone="secondary">Starting level and balances are demo values. Match-earned progress and your identity are saved on this device.</AppText>
        <Button label="Settings" variant="secondary" onPress={() => router.push(routes.settings)} />
      </Card>
      <Card title="Match statistics" description="All saved offline matches. Forfeits count as losses.">
        <View style={styles.stats}>
          {[
            ['Matches', matches.length], ['Wins', wins], ['Losses', matches.length - wins],
            ['Win rate', matches.length ? `${Math.round(wins / matches.length * 100)}%` : '--'],
            ['Answer accuracy', totals.questions ? `${Math.round(totals.correct / totals.questions * 100)}%` : '--'],
            ['Correct answers', totals.correct], ['Damage dealt', totals.damage], ['Best combo', totals.combo],
          ].map(([label, value]) => (
            <View key={label} style={styles.stat}>
              <AppText variant="caption" tone="secondary">{label}</AppText>
              <AppText variant="heading">{value}</AppText>
            </View>
          ))}
        </View>
      </Card>
      <Card title="Recent matches" description="Latest 10 matches. Open a match for its full summary and rewards.">
        {matches.slice(0, 10).map((match) => (
          <Button key={match.matchId} label={`${match.outcome.winner === 'player' ? 'Victory' : 'Defeat'}${match.outcome.reason === 'forfeit' ? ' (forfeit)' : ''} vs ${match.fighters.opponent.name} - ${match.matchId}`}
            variant="secondary" onPress={() => router.push({ pathname: routes.result, params: { matchId: match.matchId } })} />
        ))}
        {matches.length === 0 ? <EmptyState icon="time-outline" title="No completed matches yet"
          description="Play an offline duel to start your history."
          action={<Button label="Go to Arena" onPress={() => router.navigate(routes.arena)} />} /> : null}
      </Card>
      </> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  name: { flex: 1, minWidth: 0, gap: spacing.xsmall },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.medium },
  stat: { flexGrow: 1, flexBasis: 128, minWidth: 0, gap: spacing.xsmall },
});
