import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { BOOSTERS, getBooster, isBattleBoosterId } from '../../src/data/boosters';
import { replacePower } from '../../src/features/loadout/preparation';
import type { BoosterId } from '../../src/game/types/booster';
import { usePlayerStore } from '../../src/store/player-store';
import { volt } from '../../src/theme';
import { AppText } from '../../src/components/ui';
import { SceneAction, SceneText, SigilButton, worldColors } from '../../src/components/world/SceneControls';
import { WorldIcon } from '../../src/components/world/WorldIcon';
import { WorldOverlay } from '../../src/components/world/WorldOverlay';
import { WorldScene } from '../../src/components/world/WorldScene';

export default function Armory() {
  const player = usePlayerStore();
  const [slot, setSlot] = useState(0);
  const [inspected, setInspected] = useState<BoosterId | null>(null);
  const [saving, setSaving] = useState(false);
  const [guide, setGuide] = useState(false);
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 720 || fontScale >= 1.5;
  const selected = inspected ?? player.boosterIds[slot];
  const power = getBooster(selected);
  const owned = player.collectionIds.includes(`booster:${selected}`);
  const compatible = isBattleBoosterId(selected);
  const duplicate = player.boosterIds.some((id, index) => id === selected && index !== slot);
  const already = player.boosterIds[slot] === selected;
  const reason = !owned ? 'Collect this power from an earned chest.' : !compatible ? 'Legacy power: not available in continuous duels.'
    : duplicate ? 'Already in another socket. Powers must be distinct.' : already ? 'Equipped. Tap a socket, then inspect a replacement.' : `Ready to replace socket 0${slot + 1}.`;
  return <WorldScene title="Armory" tab footer={<View style={styles.actions}>
    <SigilButton icon="info" label="Inspect power guide" onPress={() => setGuide(true)} />
    <SceneAction label={already ? 'Equipped' : `Fit socket ${slot + 1}`} icon="equip" loading={saving}
      disabled={player.status !== 'ready' || !owned || !compatible || duplicate || already}
      style={styles.fit} onPress={async () => {
        const next = replacePower(player.boosterIds, slot, selected);
        setSaving(true);
        try { await player.saveLoadout(next); } finally { setSaving(false); }
      }} />
  </View>}>
    {player.status === 'ready' ? <>
      <View style={styles.intro}>
        <AppText maxFontSizeMultiplier={1.2} style={[styles.title, compact && styles.compactTitle]}>BUILD YOUR EDGE.</AppText>
        <SceneText muted>3 sockets. One power per question.</SceneText>
      </View>
      <View style={styles.console}>
        <View pointerEvents="none" style={styles.consoleRule} />
        {player.boosterIds.map((id, index) => <Pressable key={index} accessibilityRole="radio"
          accessibilityLabel={`Power socket ${index + 1}: ${getBooster(id).name}`}
          accessibilityState={{ checked: slot === index, disabled: saving }} disabled={saving}
          onPress={() => { setSlot(index); setInspected(null); }}
          style={[styles.socket, slot === index && styles.activeSocket, !isBattleBoosterId(id) && styles.repair]}>
          <WorldIcon name={id} size={compact ? 30 : 44} color={slot === index ? worldColors.ink : worldColors.acid} />
          <AppText allowFontScaling={false} style={[styles.socketNumber, slot === index && { color: worldColors.ink }]}>0{index + 1} / {isBattleBoosterId(id) ? 'READY' : 'REPAIR'}</AppText>
        </Pressable>)}
      </View>
      <View style={styles.inspection}>
        <AppText maxFontSizeMultiplier={1.2} style={styles.powerName}>{power.name.toUpperCase()}</AppText>
        <SceneText style={styles.reason}>{reason}</SceneText>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel="Power collection" style={styles.collection}>
        {BOOSTERS.map((booster) => {
          const collected = player.collectionIds.includes(`booster:${booster.id}`);
          return <Pressable key={booster.id} accessibilityRole="radio" accessibilityLabel={booster.name}
            accessibilityHint={`${booster.effect} ${collected ? 'Owned.' : 'Locked.'}`}
            accessibilityState={{ checked: selected === booster.id, disabled: saving }} disabled={saving}
            onPress={() => setInspected(booster.id)}
            style={[styles.power, selected === booster.id && styles.selectedPower]}>
            <WorldIcon name={booster.id} size={compact ? 22 : 27} color={collected && isBattleBoosterId(booster.id) ? worldColors.acid : worldColors.muted} />
            <AppText allowFontScaling={false} style={styles.powerLabel}>{booster.name}</AppText>
            {!collected ? <View style={styles.lock}><WorldIcon name="lock" size={10} /></View> : null}
          </Pressable>;
        })}
      </View>
    </> : null}
    {guide ? <WorldOverlay title={power.name} onClose={() => setGuide(false)}>
      <WorldIcon name={selected} size={70} color={worldColors.acid} />
      <SceneText>{power.effect}</SceneText>
      <SceneText muted>Each compatible power is used once per match. At most one activation per question, before you answer.</SceneText>
      <SceneText>{reason}</SceneText>
    </WorldOverlay> : null}
  </WorldScene>;
}
const styles = StyleSheet.create({
  intro: { gap: 3 },
  title: { color: worldColors.paper, fontFamily: 'Bangers', fontSize: 44, lineHeight: 47, transform: [{ rotate: '-2deg' }] },
  compactTitle: { fontSize: 30, lineHeight: 33 },
  console: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  consoleRule: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: '#FF287B70', transform: [{ rotate: '-10deg' }] },
  socket: { flex: 1, minHeight: 78, maxHeight: 120, aspectRatio: 0.9, borderWidth: 2, borderColor: '#8E9AA8', backgroundColor: '#111A26', alignItems: 'center', justifyContent: 'center', gap: 7 },
  activeSocket: { backgroundColor: worldColors.acid, borderColor: worldColors.paper, transform: [{ translateY: -10 }, { rotate: '-3deg' }] },
  repair: { borderColor: worldColors.pink },
  socketNumber: { color: worldColors.muted, fontFamily: volt.font.technical, fontSize: 8, lineHeight: 12 },
  inspection: { gap: 3, minHeight: 62, paddingBottom: 8 },
  powerName: { color: worldColors.paper, fontFamily: volt.font.display, fontSize: 30, lineHeight: 32 },
  reason: { color: worldColors.muted, fontSize: 12, lineHeight: 17 },
  collection: { flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: 6 },
  power: { width: '32%', minHeight: 61, padding: 5, gap: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10131ADD', borderWidth: 1, borderColor: '#677183' },
  selectedPower: { borderColor: worldColors.acid, backgroundColor: '#EEFA3610' },
  powerLabel: { color: worldColors.paper, fontSize: 9, lineHeight: 12, textAlign: 'center' },
  lock: { position: 'absolute', top: 4, right: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  fit: { flex: 1 },
});
