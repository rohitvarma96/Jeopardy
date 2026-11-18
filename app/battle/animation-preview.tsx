import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ANIMATION_PREVIEWS } from '../../src/components/battle/animationPreviews';
import { BattleScene } from '../../src/components/battle/BattleScene';
import { actionPresentation } from '../../src/components/battle/combatPresentation';
import { ACTION_LABELS, COMBAT_ACTIONS, type CombatAction } from '../../src/components/fighters/combat/actions';
import { AppText, Button, Screen } from '../../src/components/ui';
import { PagedItems } from '../../src/components/ui/PagedItems';
import { VoltOption } from '../../src/components/volt';
import { FIGHTERS } from '../../src/data/fighters';
import { SIDES, type Side } from '../../src/game/battle';
import type { FighterId } from '../../src/game/types/fighter';
import { useBattleMotion } from '../../src/hooks/useBattleMotion';
import { routes } from '../../src/navigation/routes';
import { spacing } from '../../src/theme';

export default function AnimationPreview() {
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
  return <Screen title="Combat atelier" description="Original human illustrations with cue-driven pose and impact motion."
    backHref={routes.arena} previewLabel={null}
    footer={__DEV__ ? <View style={styles.row}>
      <Button label="Replay animation" style={styles.action} onPress={() => setReplay((value) => value + 1)} />
      <Button label={reduced ? 'Use system motion preference' : 'Preview reduced motion'} variant="secondary"
        style={styles.action} onPress={() => setReduced((value) => !value)} />
    </View> : null}
    pages={__DEV__ ? [
      ...SIDES.flatMap((side) => [
        { id: `${side}-fighter`, label: `${side === 'player' ? 'Left' : 'Right'} fighter`, content:
          <PagedItems items={FIGHTERS} keyExtractor={(item) => item.id} label={`${side} fighters`} columns={2} itemHeight={60}
            renderItem={(fighter) => <VoltOption label={`${side} character ${fighter.name}`} role="radio"
              selected={fighters[side] === fighter.id}
              onPress={() => { setFighters((value) => ({ ...value, [side]: fighter.id })); change(); }}>
              <AppText variant="caption">{fighter.name}</AppText>
            </VoltOption>} /> },
        { id: `${side}-action`, label: `${side === 'player' ? 'Left' : 'Right'} action`, content:
          <PagedItems items={COMBAT_ACTIONS} keyExtractor={(item) => item} label={`${side} actions`} columns={2} itemHeight={60}
            renderItem={(action) => <VoltOption label={`${side} action ${ACTION_LABELS[action]}`} role="radio"
              selected={fixture === null && actions[side] === action}
              onPress={() => { setActions((value) => ({ ...value, [side]: action })); change(); }}>
              <AppText variant="caption">{ACTION_LABELS[action]}</AppText>
            </VoltOption>} /> },
      ]),
      { id: 'fixtures', label: 'Battle fixtures', content:
        <PagedItems items={ANIMATION_PREVIEWS} keyExtractor={(item) => item.label} label="Fixtures" itemHeight={64}
          renderItem={(item, index) => <VoltOption label={item.label} role="radio" selected={fixture === index}
            onPress={() => { setFixture(index); setReplay((value) => value + 1); }} />} /> },
    ] : undefined}>
    {__DEV__ ? <View style={styles.scene}>
      <BattleScene replayKey={replay} view={view} motionEnabled={motionEnabled} presentation={presentation} fill />
    </View> : <AppText>Animation previews are available in development builds only.</AppText>}
  </Screen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.small },
  action: { flex: 1 },
  scene: { flex: 0.8, minHeight: 60 },
});
