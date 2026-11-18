import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';

import { BrawlerStage } from '../../src/components/world/BrawlerStage';
import { SceneAction, SceneText, worldColors } from '../../src/components/world/SceneControls';
import { WorldIcon } from '../../src/components/world/WorldIcon';
import { WorldScene } from '../../src/components/world/WorldScene';
import { getFighter } from '../../src/data/fighters';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import { exitPreview } from '../../src/navigation/exitPreview';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';
import { MatchmakingCancelledError, mockMatchmaking } from '../../src/services/mock-matchmaking';
import { AppText } from '../../src/components/ui';
import { volt } from '../../src/theme';

export default function Matchmaking() {
  const router = useRouter();
  const modeId = useMatchSetupStore((state) => state.modeId);
  const match = useMatchSetupStore((state) => state.match);
  const matchFound = useMatchSetupStore((state) => state.matchFound);
  const fighterId = usePlayerStore((state) => state.fighterId);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const cancel = useCallback(() => {
    useMatchSetupStore.getState().reset();
    exitPreview(routes.arena);
  }, []);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { cancel(); return true; });
    return () => listener.remove();
  }, [cancel]));
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
      mockMatchmaking.findOpponent({ modeId, seed }, request.signal).then(async (found) => {
        if (request.signal.aborted) return;
        const matchId = await usePlayerStore.getState().reserveMatchId();
        if (request.signal.aborted) return;
        if (!matchId) { setError('Could not reserve a saved match ID. Retry search.'); return; }
        matchFound({ ...found, matchId });
      }).catch((reason: unknown) => {
        if (!request.signal.aborted && !(reason instanceof MatchmakingCancelledError)) {
          console.warn(`Local opponent acquisition failed on attempt ${attempt + 1}.`, reason);
          setError('Search failed. Retry or return to Arena.');
        }
      });
    };
    if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') start();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' ? start() : stop());
    return () => { stop(); subscription.remove(); };
  }, [modeId, match, matchFound, attempt]));
  useEffect(() => {
    if (match) router.replace(routes.categoryDraft);
  }, [match, router]);
  return <WorldScene title="Opponent acquisition" utilities={false} onBack={cancel} backLabel="Cancel search"
    footer={error ? <SceneAction label="Retry search" icon="arena" onPress={() => setAttempt(attempt + 1)} /> : undefined}>
    <Stack.Screen options={{ gestureEnabled: false }} />
    {!modeId ? <View style={styles.recovery}><SceneText>No active deployment. Start from the lobby.</SceneText>
      <SceneAction label="Arena home" icon="arena" onPress={cancel} /></View> : <>
      <AppText maxFontSizeMultiplier={1.2} style={styles.title}>FIND YOUR RIVAL.</AppText>
      <SceneText muted>Local AI acquisition. No network or human queue.</SceneText>
      <View style={styles.banners}>
        <View style={styles.banner}><BrawlerStage fighterId={fighterId} /><SceneText>{getFighter(fighterId).name}</SceneText><AppText style={styles.ready}>READY</AppText></View>
        <View style={styles.versus}><WorldIcon name="arena" size={40} color={worldColors.pink} /></View>
        <View style={styles.banner}>
          <View style={styles.signal}><WorldIcon name="brawlers" size={70} color={worldColors.muted} /></View>
          <SceneText>LOCAL AI</SceneText><AppText style={styles.ready}>SEARCHING</AppText>
        </View>
      </View>
      {error ? <AppText accessibilityRole="alert" style={styles.error}>{error}</AppText>
        : <SceneText muted>Acquiring an opponent and securing your match record...</SceneText>}
    </>}
  </WorldScene>;
}
const styles = StyleSheet.create({
  title: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 36, lineHeight: 38 },
  banners: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8, paddingVertical: 16 },
  banner: { flex: 1, minWidth: 0, gap: 5, borderBottomWidth: 3, borderBottomColor: worldColors.acid, backgroundColor: '#10131A88', padding: 8 },
  versus: { justifyContent: 'center' },
  signal: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#677183' },
  ready: { color: worldColors.acid, fontFamily: volt.font.technical, fontSize: 9, lineHeight: 15 },
  recovery: { flex: 1, justifyContent: 'center', gap: 18 },
  error: { color: '#FFB7CF', fontSize: 13, lineHeight: 19 },
});
