import { Asset } from 'expo-asset';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';

import { humanFighters } from '../../src/assets/human-fighters';
import { battleAssets } from '../../src/assets/registry';
import { AppText } from '../../src/components/ui';
import { BrawlerStage } from '../../src/components/world/BrawlerStage';
import { SceneAction, SceneText, worldColors } from '../../src/components/world/SceneControls';
import { WorldIcon } from '../../src/components/world/WorldIcon';
import { WorldScene } from '../../src/components/world/WorldScene';
import { getCategory } from '../../src/data/categories';
import { getFighter } from '../../src/data/fighters';
import { useBattleStore } from '../../src/features/battle/store';
import { useMatchSetupStore, validateMatchSetup } from '../../src/features/match-setup/store';
import { useBattleMotion } from '../../src/hooks/useBattleMotion';
import { exitPreview } from '../../src/navigation/exitPreview';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';
import type { MatchSetup } from '../../src/game/types/match';

export default function Versus() {
  const router = useRouter();
  const setup = useMatchSetupStore((state) => state.ready);
  const [loadedSetup, setLoadedSetup] = useState<MatchSetup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const motion = useBattleMotion();
  const assetsReady = !!setup && loadedSetup === setup;
  const leave = useCallback(() => {
    useMatchSetupStore.getState().reset();
    exitPreview(routes.arena);
  }, []);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { leave(); return true; });
    const app = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => { subscription.remove(); app.remove(); };
  }, [leave]));
  useEffect(() => {
    if (!setup) return;
    let mounted = true;
    // The battle clock does not exist until all locally bundled stage sources are ready.
    const assets = [battleAssets.arena.source, humanFighters[setup.fighterId].source, humanFighters[setup.opponent.fighterId].source];
    Promise.all(assets.map((source) => Asset.fromModule(source).downloadAsync())).then(() => {
      if (mounted) setLoadedSetup(setup);
    }, (reason: unknown) => {
      console.warn(`VS entrance assets could not load on attempt ${attempt + 1}.`, reason);
      if (mounted) setError('Arena assets could not load. Retry or return to the lobby.');
    });
    return () => { mounted = false; };
  }, [setup, attempt]);
  const enter = useCallback(() => {
    if (!setup || !assetsReady || !active) return;
    if (useMatchSetupStore.getState().ready !== setup) return;
    const player = usePlayerStore.getState();
    const errors = validateMatchSetup(useMatchSetupStore.getState(), setup.boosterIds);
    if (player.status !== 'ready') errors.push('Player data is not ready.');
    if (player.fighterId !== setup.fighterId || player.boosterIds.some((id, index) => id !== setup.boosterIds[index])) errors.push('Equipment changed. Return to the lobby and redeploy.');
    if (errors.length) { setError(errors.join(' ')); return; }
    try {
      useBattleStore.getState().start(setup);
      useMatchSetupStore.getState().reset();
      router.dismissAll();
      router.push(routes.battleArena);
    } catch (reason) {
      console.warn('VS entrance could not start the duel.', reason);
      setError(reason instanceof Error ? reason.message : 'The duel could not start.');
    }
  }, [setup, assetsReady, active, router]);
  useFocusEffect(useCallback(() => {
    if (!assetsReady || error || !active) return;
    const timer = setTimeout(enter, motion ? 850 : 0);
    return () => clearTimeout(timer);
  }, [assetsReady, error, active, enter, motion]));
  return <WorldScene title="Versus" utilities={false} onBack={leave} backLabel="Cancel entrance"
    footer={error ? <SceneAction label="Retry entrance" icon="arena" onPress={() => {
      setError(null); setLoadedSetup(null); setAttempt(attempt + 1);
    }} />
      : <SceneAction label={assetsReady ? 'Enter duel now' : 'Loading arena'} disabled={!assetsReady || !active} onPress={enter} />}>
    <Stack.Screen options={{ gestureEnabled: false }} />
    {!setup ? <View style={styles.center}><SceneText>No validated match is ready. Deploy from Arena first.</SceneText>
      <SceneAction label="Arena home" icon="arena" onPress={leave} /></View> : <>
      <AppText style={styles.title}>KNOWLEDGE IS YOUR WEAPON.</AppText>
      <View style={styles.banners}>
        <View style={styles.banner}><BrawlerStage fighterId={setup.fighterId} /><SceneText>{getFighter(setup.fighterId).name}</SceneText><AppText style={styles.label}>YOU</AppText></View>
        <View style={styles.vs}><AppText style={styles.vsText}>VS</AppText></View>
        <View style={styles.banner}><BrawlerStage fighterId={setup.opponent.fighterId} mirror /><SceneText>{getFighter(setup.opponent.fighterId).name}</SceneText><AppText style={styles.label}>LOCAL AI</AppText></View>
      </View>
      <View style={styles.categories}>{setup.categories.map(({ categoryId }) => <View key={categoryId}
        accessible accessibilityLabel={getCategory(categoryId).name} style={styles.crest}>
        <WorldIcon name={categoryId} size={24} color={worldColors.acid} />
      </View>)}</View>
      {error ? <AppText accessibilityRole="alert" style={styles.error}>{error}</AppText>
        : <SceneText muted>{assetsReady ? 'Arena ready. The clock starts on entry.' : 'Loading local stage assets before starting the timer.'}</SceneText>}
    </>}
  </WorldScene>;
}
const styles = StyleSheet.create({
  title: { color: worldColors.paper, fontFamily: 'BarlowCondensed-ExtraBold', fontSize: 28, lineHeight: 30 },
  banners: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8, paddingVertical: 12 },
  banner: { flex: 1, minWidth: 0, gap: 5, backgroundColor: '#10131A66', borderBottomWidth: 3, borderBottomColor: worldColors.pink, padding: 6 },
  vs: { justifyContent: 'center' },
  vsText: { color: worldColors.acid, fontFamily: 'Bangers', fontSize: 38, transform: [{ rotate: '-8deg' }] },
  label: { color: worldColors.acid, fontFamily: 'SpaceMono-Regular', fontSize: 9, lineHeight: 15 },
  categories: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  crest: { width: 42, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#677183', backgroundColor: '#10131ABB' },
  center: { flex: 1, justifyContent: 'center', gap: 20 },
  error: { color: '#FFB7CF', fontSize: 12, lineHeight: 18 },
});
