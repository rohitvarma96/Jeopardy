import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { FighterArt } from '../../src/components/fighters/FighterArt';
import { MatchSetupScreen } from '../../src/components/navigation/MatchSetupScreen';
import { AppText, Badge, Button, Card, LoadingState } from '../../src/components/ui';
import { getFighter } from '../../src/data/fighters';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';
import { MatchmakingCancelledError, mockMatchmaking } from '../../src/services/mock-matchmaking';
import { spacing } from '../../src/theme';

export default function Matchmaking() {
  const router = useRouter();
  const modeId = useMatchSetupStore((state) => state.modeId);
  const match = useMatchSetupStore((state) => state.match);
  const matchFound = useMatchSetupStore((state) => state.matchFound);
  const reset = useMatchSetupStore((state) => state.reset);
  const [error, setError] = useState<string>();

  useFocusEffect(useCallback(() => {
    if (!modeId || match) return;
    let controller: AbortController | null = null;
    const stop = () => { controller?.abort(); controller = null; };
    const seed = useMatchSetupStore.getState().nextSeed;
    const start = () => {
      if (controller) return;
      const request = new AbortController();
      controller = request;
      setError(undefined);
      mockMatchmaking
      .findOpponent({ modeId, seed }, request.signal)
      .then(async (found) => {
        if (request.signal.aborted) return;
        const matchId = await usePlayerStore.getState().reserveMatchId();
        if (request.signal.aborted) return;
        if (!matchId) { setError('Unable to save a unique match ID. Go back and retry loading player data.'); return; }
        matchFound({ ...found, matchId });
      })
      .catch((reason: unknown) => {
        if (!request.signal.aborted && !(reason instanceof MatchmakingCancelledError)) {
          console.warn('Mock matchmaking failed.', reason);
          setError('Matchmaking failed. Go back and try again.');
        }
      });
    };
    if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') start();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' ? start() : stop());
    return () => { stop(); subscription.remove(); };
  }, [modeId, match, matchFound]));

  const cancel = () => {
    reset();
    if (router.canGoBack()) router.back();
    else router.replace(routes.mode);
  };

  const opponent = match?.opponent;

  return (
    <MatchSetupScreen step="matchmaking" blocked={modeId ? undefined : 'Choose a mode to start matchmaking.'}>
      <Card>
        {error ? (
          <AppText accessibilityRole="alert">{error}</AppText>
        ) : opponent ? (
          <View style={styles.row}>
            <FighterArt fighterId={opponent.fighterId} height={135} />
            <View style={styles.fill}>
              <Badge label="Opponent found" tone="success" />
              <AppText variant="heading">{opponent.name}</AppText>
              <AppText tone="secondary">Local AI opponent - {getFighter(opponent.fighterId).name}</AppText>
              <AppText variant="caption">Level {opponent.level} - {opponent.rank}</AppText>
            </View>
          </View>
        ) : (
          <LoadingState label="Searching for a local opponent..." />
        )}
      </Card>
      {opponent ? (
        <Button label="Continue to category draft" onPress={() => router.push(routes.categoryDraft)} />
      ) : null}
      <Button label={opponent ? 'Cancel match' : 'Cancel search'} variant="secondary" onPress={cancel} />
    </MatchSetupScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.medium },
  fill: { flex: 1, minWidth: 100, gap: spacing.xsmall },
});
