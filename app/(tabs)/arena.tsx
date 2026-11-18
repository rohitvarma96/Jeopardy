import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { getFighter } from '../../src/data/fighters';
import { useBattleStore } from '../../src/features/battle/store';
import { preparationError } from '../../src/features/loadout/preparation';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import { usePlayerStore } from '../../src/store/player-store';
import { routes } from '../../src/navigation/routes';
import { volt } from '../../src/theme';
import { AppText } from '../../src/components/ui';
import { BrawlerStage } from '../../src/components/world/BrawlerStage';
import type { BrawlerPerformanceHandle } from '../../src/components/world/SagePerformance';
import { SceneAction, SceneText, SigilButton, worldColors } from '../../src/components/world/SceneControls';
import { WorldIcon } from '../../src/components/world/WorldIcon';
import { WorldOverlay } from '../../src/components/world/WorldOverlay';
import { WorldScene } from '../../src/components/world/WorldScene';

export default function Arena() {
  const router = useRouter();
  const player = usePlayerStore();
  const battle = useBattleStore((state) => state.battle);
  const { width, height, fontScale } = useWindowDimensions();
  const [modes, setModes] = useState(false);
  const performance = useRef<BrawlerPerformanceHandle>(null);
  const ready = player.status === 'ready';
  const fighter = getFighter(player.fighterId);
  const compact = height < 720 || fontScale >= 1.5;
  const wide = width >= 850 && fontScale < 1.5;
  const pending = player.matches.filter((match) => match.capsule && !match.capsule.opened).length;
  const problem = preparationError(player);
  const unsaved = !!battle?.outcome && !player.matches.some((record) => record.matchId === battle.setup.matchId);
  const deploy = () => {
    if (problem || unsaved) return;
    performance.current?.ready();
    useMatchSetupStore.getState().beginSetup('offline-duel');
    router.push(routes.matchmaking);
  };
  return <WorldScene title="Arena" tab footer={ready ? <View style={styles.deployRow}>
    <Pressable accessibilityRole="button" accessibilityLabel="Choose game mode" onPress={() => setModes(true)} style={styles.mode}>
      <WorldIcon name="arena" size={20} color={worldColors.acid} />
      <View><AppText maxFontSizeMultiplier={1.2} style={styles.modeName}>AI DUEL</AppText><AppText allowFontScaling={false} style={styles.micro}>OFFLINE / 1V1</AppText></View>
    </Pressable>
    <SceneAction label={problem ? 'Repair kit' : 'Duel'} icon={problem ? 'armory' : 'deploy'}
      variant={problem ? 'primary' : 'signal'} disabled={!ready || unsaved} style={styles.deploy}
      onPress={problem ? () => router.navigate(routes.armory) : deploy} />
  </View> : undefined}>
    {ready ? <>
      <View style={styles.identity}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Career" onPress={() => router.navigate(routes.career)} style={styles.player}>
          <View accessible accessibilityLabel={`Level ${player.profile.level}`} style={styles.crest}><AppText style={styles.level}>{player.profile.level}</AppText></View>
          <View style={styles.playerCopy}>
            <SceneText>{player.profile.username}</SceneText>
            <AppText allowFontScaling={false} style={styles.micro}>{player.profile.xp} / {player.profile.xpForNextLevel} XP</AppText>
            <View accessible accessibilityRole="progressbar" accessibilityLabel={`XP to level ${player.profile.level + 1}`}
              accessibilityValue={{ min: 0, max: player.profile.xpForNextLevel, now: player.profile.xp }} style={styles.xpTrack}>
              <View style={[styles.xp, { width: `${player.profile.xp / player.profile.xpForNextLevel * 100}%` }]} />
            </View>
          </View>
        </Pressable>
        <SigilButton icon="vault" label="Open earned chests" badge={pending} onPress={() => router.navigate(routes.vault)} />
      </View>
      <View style={[styles.main, wide && styles.wideMain]}>
        <View style={[styles.stage, wide && styles.wideStage]}>
          <View style={styles.stageTouch}>
            <BrawlerStage fighterId={fighter.id} animated={!modes} interactive ref={performance}
              onInspect={() => router.navigate(routes.brawlers)} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Change Brawler" accessibilityHint="Open the Brawler hangar."
            onPress={() => router.navigate(routes.brawlers)} style={styles.brawlerCopy}>
            <AppText maxFontSizeMultiplier={1.2} style={[styles.name, compact && styles.compactName]}>{fighter.name.toUpperCase()}</AppText>
            <View style={styles.inspectRow}><AppText maxFontSizeMultiplier={1.2} style={styles.passive}>{fighter.passive.name}</AppText>
              <WorldIcon name="brawlers" size={16} color={worldColors.acid} /></View>
          </Pressable>
        </View>
        <View style={[styles.prep, wide && styles.widePrep]}>
          <View style={styles.prepHeader}>
            <AppText maxFontSizeMultiplier={1.2} style={styles.micro}>YOUR THREE POWERS</AppText>
            {!compact ? <SceneText muted>Outthink. Outplay.</SceneText> : null}
          </View>
          <View style={styles.sockets}>
            {player.boosterIds.map((id, index) => <Pressable key={index} accessibilityRole="button"
              accessibilityLabel={`Inspect power socket ${index + 1}`} onPress={() => router.navigate(routes.armory)} style={styles.socket}>
              <WorldIcon name={id} size={compact ? 23 : 29} color={worldColors.acid} />
              <AppText allowFontScaling={false} style={styles.slot}>0{index + 1}</AppText>
            </Pressable>)}
          </View>
          {problem ? <SceneText style={styles.repair}>{problem}</SceneText> : null}
          {wide ? <View style={styles.broadcast}>
            <AppText style={styles.broadcastType}>THINK FAST.{'\n'}HIT HARDER.</AppText>
            <SceneText muted>Knowledge is your weapon.</SceneText>
          </View> : null}
        </View>
      </View>
      <AppText allowFontScaling={false} style={styles.local}>LOCAL PROGRESSION / {player.profile.rank} IS A DEMO RANK</AppText>
    </> : <View style={styles.loading}><SceneText>Your Brawler appears when local data is ready.</SceneText></View>}
    {modes ? <WorldOverlay title="Game modes" onClose={() => setModes(false)}>
      <WorldIcon name="arena" size={56} color={worldColors.acid} />
      <AppText style={styles.overlayTitle}>AI DUEL</AppText>
      <SceneText>One shared question. Two independent answers. Faster correct answers hit harder.</SceneText>
      <SceneText muted>Available offline. Online Ranked and Friend Challenge are not available in this prototype.</SceneText>
      <SceneAction label="AI Duel selected" icon="equip" onPress={() => setModes(false)} />
    </WorldOverlay> : null}
  </WorldScene>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  player: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  crest: { width: 38, height: 44, backgroundColor: worldColors.paper, borderBottomWidth: 5, borderBottomColor: worldColors.pink, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  level: { fontFamily: volt.font.display, fontSize: 27, lineHeight: 30, color: worldColors.ink },
  playerCopy: { flex: 1, maxWidth: 230, gap: 2 },
  micro: { color: worldColors.muted, fontFamily: volt.font.technical, fontSize: 8, lineHeight: 13, letterSpacing: 0.6 },
  xpTrack: { backgroundColor: '#050A13', height: 3, width: '100%' },
  xp: { backgroundColor: worldColors.acid, height: 3 },
  main: { flex: 1, minHeight: 0, gap: 8 },
  wideMain: { flexDirection: 'row', gap: 40 },
  stage: { flex: 1, minHeight: 0 },
  wideStage: { flex: 1.5 },
  stageTouch: { flex: 1, minHeight: 0 },
  brawlerCopy: { position: 'absolute', left: 0, bottom: 9, minHeight: 48, maxWidth: '75%', backgroundColor: '#10131AB0', padding: 6, borderLeftWidth: 3, borderLeftColor: worldColors.pink },
  inspectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 42, lineHeight: 40 },
  compactName: { fontSize: 30, lineHeight: 30 },
  passive: { color: worldColors.acid, fontSize: 11, lineHeight: 16 },
  prep: { gap: 5 },
  widePrep: { flex: 1, justifyContent: 'center' },
  prepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sockets: { flexDirection: 'row', gap: 8 },
  socket: { flex: 1, minHeight: 49, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10131AC0', borderWidth: 1, borderColor: '#8D9A9370', borderBottomWidth: 2, borderBottomColor: worldColors.acid },
  slot: { color: worldColors.muted, fontSize: 9 },
  repair: { color: '#FFB7CF', fontSize: 11, lineHeight: 15 },
  local: { color: worldColors.muted, fontSize: 7, lineHeight: 11, textAlign: 'center', marginTop: 4 },
  deployRow: { flexDirection: 'row', gap: 10 },
  mode: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#748398', padding: 9, minHeight: 56, backgroundColor: '#10131AC0' },
  modeName: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 24, lineHeight: 25 },
  deploy: { width: '44%', minWidth: 144, maxWidth: 224 },
  broadcast: { gap: 12, marginTop: 28 },
  broadcastType: { color: worldColors.paper, fontFamily: 'Bangers', fontSize: 66, lineHeight: 63, transform: [{ rotate: '-4deg' }] },
  loading: { flex: 1, justifyContent: 'center' },
  overlayTitle: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 46, lineHeight: 48 },
});
