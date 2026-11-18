import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CHESTS, CHEST_FAMILIES, type ChestFamily } from '../src/assets/chests';
import { ChestRitual } from '../src/components/player/ChestRitual';
import { RewardChest } from '../src/components/player/RewardChest';
import { TypeUnit } from '../src/components/brand/TypeUnit';
import { AppText, Button, Screen } from '../src/components/ui';
import { SceneAction, SceneText } from '../src/components/world/SceneControls';
import { WorldOverlay } from '../src/components/world/WorldOverlay';
import { getCollectible } from '../src/data/collectibles';
import { routes } from '../src/navigation/routes';
import { colors } from '../src/theme';

export default function ChestForge() {
  const params = useLocalSearchParams<{ family?: string; discovery?: string }>();
  const router = useRouter();
  const initial = CHEST_FAMILIES.find((id) => id === params.family);
  const [family, setFamily] = useState<ChestFamily>(initial ?? 'field');
  const [problem, setProblem] = useState(params.family !== undefined && !initial ? 'Unknown chest family. Select a valid preview below.' : '');
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [controls, setControls] = useState(false);
  const [note, setNote] = useState<string>();
  const practice = params.discovery === '1';
  const start = () => { setNote(undefined); setRevealed(false); setOpening(true); setOpened(true); };
  const reset = () => { setNote(undefined); setDuplicate(false); setRevealed(false); setOpening(false); setOpened(false); };
  const families = <View accessibilityRole="radiogroup" accessibilityLabel="Practice chest families" style={styles.families}>
    {CHEST_FAMILIES.map((id) => <Pressable key={id} accessibilityRole="radio" accessibilityLabel={CHESTS[id].name}
      accessibilityState={{ checked: family === id }} onPress={() => { reset(); setProblem(''); setFamily(id); setControls(false); }}
      style={[styles.family, family === id && { borderColor: CHESTS[id].accent }]}>
      <AppText variant="caption">{CHESTS[id].name}</AppText>
    </Pressable>)}
  </View>;
  if (practice) return <>
    <ChestRitual family={family} opened={opened} opening={opening} preview onOpen={start} obscured={controls}
      onRevealComplete={() => { setOpening(false); setRevealed(true); }} animateReveal
      onBack={() => router.canGoBack() ? router.back() : router.replace(routes.vault)}
      onControls={() => setControls(true)} onReplay={reset} error={problem || null} note={note}
      discovery={opened && (opening || revealed) ? {
        item: getCollectible('fighter:shadow'), duplicate, shards: duplicate ? 15 : 0,
        action: { label: 'Equip', accessibilityLabel: 'Preview equipping the discovered Brawler',
          onPress: () => setNote('Equip preview only. Nothing was changed.') },
      } : undefined} />
    {controls ? <WorldOverlay title="Chest controls" onClose={() => setControls(false)}>
      <SceneText>Choose the same four cosmetic chest designs as the Experience Board.</SceneText>
      {families}
      <SceneAction label="Reset study" icon="back" onPress={() => { reset(); setControls(false); }} />
      <SceneAction label="Preview duplicate" icon="shard" onPress={() => {
        setDuplicate(true); setOpened(true); setOpening(false); setRevealed(true); setControls(false);
      }} />
      <SceneText muted>Example contents only. Family does not change loot odds. Nothing is granted or saved.</SceneText>
    </WorldOverlay> : null}
  </>;
  const content = <>
    <AppText variant="caption" tone="accent">PRACTICE ONLY / NO ACCOUNT REWARDS</AppText>
    {problem ? <AppText accessibilityRole="alert">{problem}</AppText> : null}
      <TypeUnit lead="Reward hardware." punch="Precision built." size="compact" />
      <RewardChest key={family} family={family} opened={opened} opening={opening} preview onOpen={start}
        onRevealComplete={() => setOpening(false)} />
      <AppText variant="caption" tone="secondary">{CHESTS[family].detail}</AppText>
    {families}
  </>;
  return <Screen title="Chest forge" description="Four animated chest designs. Preview only; no rewards or inventory changes."
    previewLabel={null} backHref={routes.designLab}
    footer={<Button label={opened ? 'Close preview chest' : 'Open preview chest'} onPress={opened ? reset : start} />}>
    {content}
  </Screen>;
}

const styles = StyleSheet.create({
  families: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  family: { flexBasis: '47%', flexGrow: 1, minHeight: 48, padding: 8, justifyContent: 'center', borderWidth: 2, borderColor: colors.border, backgroundColor: '#10131ABB' },
});
