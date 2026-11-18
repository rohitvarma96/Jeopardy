import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FIGHTERS, getFighter } from '../../src/data/fighters';
import { brawlerRecord, careerMilestones, careerStats } from '../../src/features/progression/career';
import { usePlayerStore } from '../../src/store/player-store';
import { routes } from '../../src/navigation/routes';
import { volt } from '../../src/theme';
import { AppText } from '../../src/components/ui';
import { PagedItems } from '../../src/components/ui/PagedItems';
import { SceneText, SigilButton, worldColors } from '../../src/components/world/SceneControls';
import { WorldScene } from '../../src/components/world/WorldScene';
import { WorldIcon } from '../../src/components/world/WorldIcon';

type CareerSection = 'progress' | 'record' | 'milestones';
export default function Career() {
  const router = useRouter();
  const player = usePlayerStore();
  const [section, setSection] = useState<CareerSection>('progress');
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const stats = careerStats(player.matches);
  const owned = FIGHTERS.filter((fighter) => player.collectionIds.includes(`fighter:${fighter.id}`)).length;
  const milestones = careerMilestones(player.matches, owned);
  const milestone = milestones[milestoneIndex];
  const brawler = brawlerRecord(player.matches, player.fighterId);
  return <WorldScene title="Career" tab>
    <View accessibilityRole="tablist" accessibilityLabel="Career sections" style={styles.sections}>
      {(['progress', 'record', 'milestones'] as const).map((id) => <Pressable key={id} accessibilityRole="tab"
        accessibilityLabel={id} accessibilityState={{ selected: section === id }} onPress={() => setSection(id)}
        style={[styles.section, section === id && styles.activeSection]}>
        <AppText allowFontScaling={false} style={styles.sectionText}>{id.toUpperCase()}</AppText>
      </Pressable>)}
    </View>
    {player.status === 'ready' ? section === 'progress' ? <View style={styles.progress}>
      <View style={styles.identity}>
        <View style={styles.medallion}><AppText style={styles.level}>{player.profile.level}</AppText><AppText style={styles.levelLabel}>LEVEL</AppText></View>
        <View style={styles.identityCopy}><AppText style={styles.name}>{player.profile.username}</AppText><SceneText muted>Demo rank: {player.profile.rank}</SceneText></View>
      </View>
      <SceneText>{player.profile.xp} / {player.profile.xpForNextLevel} XP to level {player.profile.level + 1}</SceneText>
      <View accessible accessibilityRole="progressbar" accessibilityLabel={`XP to level ${player.profile.level + 1}`}
        accessibilityValue={{ min: 0, max: player.profile.xpForNextLevel, now: player.profile.xp }} style={styles.track}>
        <View style={[styles.fill, { width: `${player.profile.xp / player.profile.xpForNextLevel * 100}%` }]} />
      </View>
      <View style={styles.stats}>
        {[['Wins', stats.wins], ['Losses', stats.losses], ['Accuracy', stats.accuracy === null ? '--' : `${stats.accuracy}%`], ['Best combo', stats.bestCombo]].map(([label, value]) => <View key={label} style={styles.stat}>
          <AppText allowFontScaling={false} style={styles.statValue}>{value}</AppText><AppText maxFontSizeMultiplier={1.3} style={styles.statLabel}>{label}</AppText>
        </View>)}
      </View>
      <View style={styles.mastery}><WorldIcon name="brawlers" color={worldColors.pink} size={30} /><View style={styles.identityCopy}>
        <SceneText>{getFighter(player.fighterId).name} / {brawler.matches} played</SceneText><SceneText muted>{brawler.wins} wins / {owned} of 6 Brawlers collected</SceneText>
      </View></View>
      <SceneText muted style={styles.disclaimer}>Real local records. Milestones are recognition only, with no extra reward claims.</SceneText>
    </View> : section === 'record' ? <View style={styles.record}>
      <AppText style={styles.sectionTitle}>MATCH RECORD</AppText>
      {player.matches.length ? <PagedItems items={player.matches.slice(0, 30)} keyExtractor={(match) => match.matchId} label="Records" itemHeight={70}
        renderItem={(match) => <Pressable accessibilityRole="button"
          accessibilityLabel={`${match.outcome.winner === 'player' ? 'Victory' : 'Defeat'} vs ${match.fighters.opponent.name}, ${match.matchId}`}
          onPress={() => router.push({ pathname: routes.result, params: { matchId: match.matchId } })} style={styles.match}>
          <WorldIcon name="career" color={match.outcome.winner === 'player' ? worldColors.acid : worldColors.pink} />
          <View style={styles.identityCopy}><SceneText>{match.outcome.winner === 'player' ? 'VICTORY' : 'DEFEAT'} / {match.fighters.opponent.name}</SceneText>
            <SceneText muted>{match.fighters.player.score} damage / {match.xp} XP</SceneText></View>
          <WorldIcon name="next" size={18} />
        </Pressable>} /> : <SceneText>No completed matches yet. Your first duel starts the record.</SceneText>}
    </View> : <View style={styles.milestones}>
      <WorldIcon name={milestone.value >= milestone.goal ? 'equip' : 'career'} size={90} color={worldColors.acid} />
      <AppText style={styles.milestoneTitle}>{milestone.label}</AppText>
      <SceneText>{Math.min(milestone.value, milestone.goal)} / {milestone.goal} / {milestone.value >= milestone.goal ? 'ACHIEVED' : 'IN PROGRESS'}</SceneText>
      <SceneText muted>Permanent recognition from your saved record. No daily expiry, purchases or extra rewards.</SceneText>
      <View style={styles.milestoneNav}><SigilButton icon="back" label="Previous milestone" disabled={milestoneIndex === 0} onPress={() => setMilestoneIndex(milestoneIndex - 1)} />
        <SceneText>{milestoneIndex + 1} / {milestones.length}</SceneText>
        <SigilButton icon="next" label="Next milestone" disabled={milestoneIndex === milestones.length - 1} onPress={() => setMilestoneIndex(milestoneIndex + 1)} /></View>
    </View> : null}
  </WorldScene>;
}
const styles = StyleSheet.create({
  sections: { flexDirection: 'row', gap: 5, marginBottom: 12 },
  section: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#677183', backgroundColor: '#10131ACC' },
  activeSection: { borderBottomColor: worldColors.pink, backgroundColor: '#FF287B22' },
  sectionText: { color: worldColors.paper, fontSize: 9, fontFamily: volt.font.technical },
  progress: { flex: 1, minHeight: 0, justifyContent: 'space-evenly', gap: 6 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  identityCopy: { flex: 1, minWidth: 0 },
  medallion: { minWidth: 66, padding: 10, alignItems: 'center', backgroundColor: worldColors.paper, borderBottomWidth: 7, borderBottomColor: worldColors.pink, transform: [{ rotate: '-4deg' }] },
  level: { fontFamily: volt.font.display, fontSize: 42, lineHeight: 44, color: worldColors.ink },
  levelLabel: { color: worldColors.ink, fontSize: 8 },
  name: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 28, lineHeight: 30 },
  track: { height: 6, backgroundColor: worldColors.ink },
  fill: { height: 6, backgroundColor: worldColors.acid },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: 8 },
  stat: { width: '49%', minHeight: 54, borderLeftWidth: 2, borderLeftColor: worldColors.pink, paddingLeft: 10, backgroundColor: '#10131ABB' },
  statValue: { color: worldColors.acid, fontFamily: volt.font.display, fontSize: 29, lineHeight: 31 },
  statLabel: { color: worldColors.muted, fontSize: 10, lineHeight: 14 },
  mastery: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  disclaimer: { fontSize: 10, lineHeight: 15 },
  record: { flex: 1, minHeight: 0, gap: 10 },
  sectionTitle: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 30 },
  match: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#10131ADD', borderLeftWidth: 2, borderLeftColor: worldColors.pink, padding: 10 },
  milestones: { flex: 1, minHeight: 0, justifyContent: 'space-evenly', alignItems: 'flex-start', gap: 10 },
  milestoneTitle: { color: worldColors.paper, fontFamily: 'Bangers', fontSize: 38, lineHeight: 41 },
  milestoneNav: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
