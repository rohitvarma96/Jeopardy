import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CHESTS, CHEST_FAMILIES, chestFamilyFor } from '../../src/assets/chests';
import { RewardChest } from '../../src/components/player/RewardChest';
import { AppText } from '../../src/components/ui';
import { SceneAction, SceneText, SigilButton, worldColors } from '../../src/components/world/SceneControls';
import { WorldIcon } from '../../src/components/world/WorldIcon';
import { WorldScene } from '../../src/components/world/WorldScene';
import { usePlayerStore } from '../../src/store/player-store';
import { routes } from '../../src/navigation/routes';
import { volt } from '../../src/theme';

export default function Vault() {
  const router = useRouter();
  const player = usePlayerStore();
  const [selected, setSelected] = useState(0);
  const [practiceSelected, setPracticeSelected] = useState(0);
  const [section, setSection] = useState<'earned' | 'practice' | null>(null);
  const pending = player.matches.filter((match) => match.capsule && !match.capsule.opened);
  const practice = section === 'practice' || (section === null && pending.length === 0);
  const index = Math.min(selected, Math.max(0, pending.length - 1));
  const record = pending[index];
  const family = CHEST_FAMILIES[practiceSelected];
  const preview = () => router.push({ pathname: routes.chestForge, params: { family, discovery: '1' } });
  return <WorldScene title="Vault" tab footer={<SceneAction label={practice ? `Open practice ${CHESTS[family].name}` : record ? 'Inspect earned chest' : 'Enter Arena'}
    icon={practice || record ? 'vault' : 'arena'} disabled={player.status !== 'ready'}
    onPress={practice ? preview : () => record ? router.push({ pathname: routes.rewards, params: { matchId: record.matchId } }) : router.navigate(routes.arena)} />}>
    {player.status === 'ready' ? <>
      <View accessibilityRole="tablist" accessibilityLabel="Vault chest types" style={styles.tabs}>
        {(['earned', 'practice'] as const).map((id) => <Pressable key={id} accessibilityRole="tab"
          accessibilityLabel={id === 'earned' ? 'Earned chests' : 'Practice chests'}
          accessibilityState={{ selected: practice === (id === 'practice') }} onPress={() => setSection(id)}
          style={[styles.tab, practice === (id === 'practice') && styles.activeTab]}>
          <AppText allowFontScaling={false} style={styles.tabLabel}>{id === 'earned' ? `EARNED / ${pending.length}` : 'PRACTICE / 4'}</AppText>
        </Pressable>)}
      </View>
      <View style={styles.heading}>
        <AppText style={styles.headline}>{practice ? 'TRY THE HARDWARE.' : record ? 'EARNED. NOT BOUGHT.' : 'YOUR NEXT DISCOVERY.'}</AppText>
        <SceneText muted>{practice ? 'Four repeatable test chests. No account rewards.' : `${pending.length} unopened ${pending.length === 1 ? 'chest' : 'chests'} / saved on this device`}</SceneText>
      </View>
      {practice ? <RewardChest key={family} family={family} opened={false} preview onOpen={preview} />
        : record ? <RewardChest family={chestFamilyFor(record.seed, record.matchId)} opened={false}
        onOpen={() => router.push({ pathname: routes.rewards, params: { matchId: record.matchId } })} /> : <View style={styles.empty}>
        <WorldIcon name="vault" size={100} color={worldColors.pink} />
        <SceneText>Finish a duel to earn a chest. Wins and non-forfeit losses both count.</SceneText>
      </View>}
      <View style={styles.selector}>
        <SigilButton icon="back" label={practice ? 'Previous practice chest' : 'Previous earned chest'}
          disabled={practice ? practiceSelected === 0 : index === 0}
          onPress={() => practice ? setPracticeSelected(practiceSelected - 1) : setSelected(index - 1)} />
        <SceneText>{practice ? `TEST ${practiceSelected + 1} / 4` : record ? `CHEST ${index + 1} / ${pending.length}` : 'NO PENDING CHESTS'}</SceneText>
        <SigilButton icon="next" label={practice ? 'Next practice chest' : 'Next earned chest'}
          disabled={practice ? practiceSelected === 3 : index >= pending.length - 1}
          onPress={() => practice ? setPracticeSelected(practiceSelected + 1) : setSelected(index + 1)} />
      </View>
      <SceneText muted style={styles.odds}>{practice ? 'Preview contents are examples, not real drops. Open again as often as you like.'
        : 'Common 70% / Rare 25% / Epic 5%. Container style never changes the odds.'}</SceneText>
    </> : null}
  </WorldScene>;
}
const styles = StyleSheet.create({
  heading: { gap: 4 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tab: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10131ACC', borderBottomWidth: 2, borderBottomColor: '#677183' },
  activeTab: { borderBottomColor: worldColors.pink },
  tabLabel: { color: worldColors.paper, fontFamily: volt.font.technical, fontSize: 9, lineHeight: 14 },
  headline: { fontFamily: volt.font.display, fontSize: 30, lineHeight: 32, color: worldColors.paper },
  empty: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', gap: 22 },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  odds: { fontSize: 10, lineHeight: 15, marginTop: 6 },
});
