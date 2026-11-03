import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ANIMATION_PREVIEWS } from '../../src/components/battle/animationPreviews';
import { BattleScene } from '../../src/components/battle/BattleScene';
import { actionPresentation } from '../../src/components/battle/combatPresentation';
import { ACTION_LABELS, COMBAT_ACTIONS, type CombatAction } from '../../src/components/fighters/combat/actions';
import { COMBAT_ROSTER } from '../../src/components/fighters/combat/roster';
import { AppText, Button } from '../../src/components/ui';
import { FIGHTERS, getFighter } from '../../src/data/fighters';
import { SIDES, type Side } from '../../src/game/battle';
import type { FighterId } from '../../src/game/types/fighter';
import { useBattleMotion } from '../../src/hooks/useBattleMotion';
import { routes } from '../../src/navigation/routes';
import { colors, spacing } from '../../src/theme';

export default function AnimationPreview() {
  const router = useRouter();
  const [fighters, setFighters] = useState<Record<Side, FighterId>>({ player: 'ember', opponent: 'frost' });
  const [actions, setActions] = useState<Record<Side, CombatAction>>({ player: 'idle', opponent: 'idle' });
  const [fixture, setFixture] = useState<number | null>(null);
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  const motionEnabled = useBattleMotion(reduced);
  const preview = ANIMATION_PREVIEWS[fixture ?? 0];
  const view = {
    ...preview.view,
    player: { ...preview.view.player, fighterId: fighters.player },
    opponent: { ...preview.view.opponent, fighterId: fighters.opponent },
  };
  const presentation = fixture === null ? actionPresentation(fighters, actions, replay) : undefined;
  const change = () => { setFixture(null); setReplay((value) => value + 1); };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Button label="Back" variant="ghost" onPress={() => router.canGoBack() ? router.back() : router.replace(routes.arena)} />
        <AppText variant="heading" style={styles.title}>Combat atelier</AppText>
        <AppText variant="caption" tone="accent">SKIA</AppText>
      </View>
      {__DEV__ ? <>
        <View style={styles.titleRow}>
          <AppText variant="caption" tone="secondary">{fixture === null
            ? motionEnabled ? 'ACTION STUDY / MOTION ON' : 'ACTION STUDY / STILL'
            : preview.label}</AppText>
          <AppText variant="caption" tone="accent">6 WARRIORS / 6 ACTIONS</AppText>
        </View>
        <BattleScene replayKey={replay} view={view} motionEnabled={motionEnabled} presentation={presentation} />
        <ScrollView testID="combat-lab-controls" style={styles.scroll} contentContainerStyle={styles.controls}>
        <View style={styles.replay}>
          <Button label="Replay animation" variant="gold" onPress={() => setReplay((value) => value + 1)} />
          <Button label={reduced ? 'Use system motion preference' : 'Preview reduced motion'}
            variant="secondary" onPress={() => setReduced((value) => !value)} />
        </View>
        {SIDES.map((side) => <View key={side} style={styles.panel}>
          <View style={styles.titleRow}>
            <AppText variant="label">{side === 'player' ? 'LEFT WARRIOR' : 'RIGHT WARRIOR'}</AppText>
            <AppText variant="caption" style={{ color: COMBAT_ROSTER[fighters[side]].accent }}>
              {COMBAT_ROSTER[fighters[side]].special}
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FIGHTERS.map((fighter) => <Choice key={fighter.id} label={`${side} character ${fighter.name}`}
              text={fighter.name} selected={fighters[side] === fighter.id}
              onPress={() => { setFighters((value) => ({ ...value, [side]: fighter.id })); change(); }} />)}
          </ScrollView>
          <View style={styles.actions}>
            {COMBAT_ACTIONS.map((action) => <Choice key={action} label={`${side} action ${ACTION_LABELS[action]}`}
              text={ACTION_LABELS[action]} selected={fixture === null && actions[side] === action}
              onPress={() => { setActions((value) => ({ ...value, [side]: action })); change(); }} />)}
          </View>
        </View>)}
        <AppText variant="caption" tone="secondary">
          {getFighter(fighters.player).name} and {getFighter(fighters.opponent).name} have separate rigs and action clocks.
          {' '}Non-idle actions recover automatically; Fall Down holds until another action is selected.
          {' '}Reduced motion keeps a static pose and readable battle feedback, with no particles or shake.
        </AppText>
        <AppText variant="heading">Battle fixtures</AppText>
        <View style={styles.actions}>
          {ANIMATION_PREVIEWS.map((item, index) => <Choice key={item.label} label={item.label} text={item.label}
            selected={fixture === index} onPress={() => { setFixture(index); setReplay((value) => value + 1); }} />)}
        </View>
        </ScrollView>
      </> : <AppText>Animation previews are available in development builds only.</AppText>}
    </SafeAreaView>
  );
}

function Choice({ text, label, selected, onPress }: {
  text: string; label: string; selected: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selected }}
    onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
    <AppText variant="caption" style={selected ? styles.selectedText : undefined}>{text}</AppText>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 12, gap: spacing.small },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small },
  title: { flex: 1, fontSize: 22, lineHeight: 28 },
  scroll: { flex: 1 },
  controls: { gap: spacing.medium, paddingBottom: spacing.large },
  replay: { gap: spacing.small },
  panel: { padding: spacing.medium, gap: spacing.small, borderRadius: 16, borderWidth: 1, borderColor: '#4C4256', backgroundColor: '#1C192B' },
  chips: { gap: spacing.small, paddingVertical: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  chip: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#292338', borderWidth: 1, borderColor: '#4C4256' },
  selected: { borderColor: colors.gold, backgroundColor: '#493B2D' },
  selectedText: { color: '#FFE7AE' },
  pressed: { opacity: 0.7 },
});
