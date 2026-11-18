import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { humanFighters } from '../../src/assets/human-fighters';
import { getCollectible } from '../../src/data/collectibles';
import { FIGHTERS, getFighter } from '../../src/data/fighters';
import { usePlayerStore } from '../../src/store/player-store';
import type { FighterId } from '../../src/game/types/fighter';
import { volt } from '../../src/theme';
import { AppText } from '../../src/components/ui';
import { BrawlerStage } from '../../src/components/world/BrawlerStage';
import { SceneAction, SceneText, SigilButton, worldColors } from '../../src/components/world/SceneControls';
import { WorldIcon } from '../../src/components/world/WorldIcon';
import { WorldOverlay } from '../../src/components/world/WorldOverlay';
import { WorldScene } from '../../src/components/world/WorldScene';

export default function Brawlers() {
  const player = usePlayerStore();
  const [choice, setChoice] = useState<FighterId | null>(null);
  const [details, setDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const { height, fontScale } = useWindowDimensions();
  const selected = choice ?? player.fighterId;
  const fighter = getFighter(selected);
  const owned = player.collectionIds.includes(`fighter:${selected}`);
  const equipped = selected === player.fighterId;
  const rarity = getCollectible(`fighter:${selected}`).rarity;
  const compact = height < 720 || fontScale >= 1.5;
  return <WorldScene title="Brawlers" tab footer={<View style={styles.actions}>
    <SigilButton icon="info" label="Inspect Brawler details" onPress={() => setDetails(true)} />
    <SceneAction label={!owned ? 'Locked' : equipped ? 'Equipped' : `Equip ${fighter.name}`} icon={!owned ? 'lock' : 'equip'}
      disabled={player.status !== 'ready' || !owned || equipped} loading={saving} style={styles.equip}
      onPress={async () => {
        setSaving(true);
        try { await player.saveFighter(selected); } finally { setSaving(false); }
      }} />
  </View>}>
    {player.status === 'ready' ? <>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <AppText maxFontSizeMultiplier={1.2} style={[styles.name, compact && styles.compactName]}>{fighter.name.toUpperCase()}</AppText>
          <AppText maxFontSizeMultiplier={1.2} style={styles.status}>{rarity.toUpperCase()} / {owned ? equipped ? 'EQUIPPED' : 'OWNED' : 'NOT COLLECTED'}</AppText>
        </View>
        <WorldIcon name={owned ? 'brawlers' : 'lock'} color={owned ? worldColors.acid : worldColors.muted} size={32} />
      </View>
      <BrawlerStage fighterId={selected} />
      {!compact ? <SceneText muted>{fighter.role}</SceneText> : null}
      <AppText maxFontSizeMultiplier={1.2} style={styles.passive}>{fighter.passive.name}</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Brawler portraits" style={styles.rail}>
        {FIGHTERS.map((entry) => {
          const collected = player.collectionIds.includes(`fighter:${entry.id}`);
          return <Pressable key={entry.id} accessibilityRole="radio" accessibilityLabel={entry.name}
            accessibilityHint={collected ? 'Owned Brawler. Inspect before equipping.' : 'Locked Brawler. Inspect how to collect.'}
            accessibilityState={{ checked: selected === entry.id, disabled: saving }} disabled={saving}
            onPress={() => setChoice(entry.id)} style={[styles.portrait, selected === entry.id && styles.selected]}>
            <Image source={humanFighters[entry.id].source} accessible={false} resizeMode="cover"
              style={[styles.portraitArt, !collected && { opacity: 0.65 }]} />
            <View style={styles.portraitState}><WorldIcon name={collected ? player.fighterId === entry.id ? 'equip' : 'brawlers' : 'lock'} size={12} color={worldColors.acid} /></View>
          </Pressable>;
        })}
      </View>
    </> : null}
    {details ? <WorldOverlay title={fighter.name} onClose={() => setDetails(false)}>
      <WorldIcon name="brawlers" size={52} color={worldColors.pink} />
      <SceneText>{fighter.identity}</SceneText>
      <AppText style={styles.detailHeading}>{fighter.passive.name}</AppText>
      <SceneText>{fighter.passive.description}</SceneText>
      <SceneText muted>{owned ? 'Owned locally. Collection rarity does not change combat power.' : 'Collect from an earned chest. No purchase or unlock shortcut is available.'}</SceneText>
    </WorldOverlay> : null}
  </WorldScene>;
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  headingCopy: { flex: 1 },
  name: { fontFamily: volt.font.display, color: worldColors.paper, fontSize: 48, lineHeight: 46 },
  compactName: { fontSize: 32, lineHeight: 33 },
  status: { fontFamily: volt.font.technical, color: worldColors.pink, fontSize: 9, lineHeight: 14 },
  passive: { color: worldColors.acid, fontSize: 13, lineHeight: 18, marginVertical: 5 },
  rail: { flexDirection: 'row', gap: 2 },
  portrait: { flex: 1, minWidth: 48, height: 64, borderWidth: 1, borderColor: '#677183', backgroundColor: '#10131AAA', overflow: 'hidden' },
  selected: { borderWidth: 2, borderColor: worldColors.acid },
  portraitArt: { position: 'absolute', top: -4, left: 0, width: '100%', height: 145 },
  portraitState: { position: 'absolute', right: 2, bottom: 2, backgroundColor: worldColors.ink },
  actions: { flexDirection: 'row', gap: 8 },
  equip: { flex: 1 },
  detailHeading: { color: worldColors.acid, fontFamily: volt.font.display, fontSize: 30 },
});
