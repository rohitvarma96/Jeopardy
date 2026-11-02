import { Pressable, StyleSheet, View } from 'react-native';

import { getCategory } from '../../data/categories';
import { getFighter } from '../../data/fighters';
import type { BattleView, FighterView } from '../../game/battle';
import { colors, layout } from '../../theme';
import { AppText, HealthBar, IconSlot } from '../ui';

export function BattleHUD({ view, motionEnabled, onExit, compact }: {
  view: BattleView; motionEnabled: boolean; onExit: () => void; compact: boolean;
}) {
  return (
    <View testID="battle-hud" style={styles.hud}>
      <View style={styles.heading}>
        <AppText variant="label" tone="accent" style={styles.category} maxFontSizeMultiplier={1.3}>
          {view.categoryId ? getCategory(view.categoryId).name.toUpperCase() : 'MIXED'}
        </AppText>
        <AppText variant="caption" style={styles.progress} maxFontSizeMultiplier={1.3}>
          QUESTION {view.questionNumber}
        </AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={view.outcome ? 'Arena home' : 'Forfeit'}
          onPress={onExit} style={({ pressed }) => [styles.exit, pressed && styles.pressed]}>
          <IconSlot name="close-outline" size="small" />
        </Pressable>
      </View>
      <View style={styles.duel}>
        <FighterHealth fighter={view.player} initiative={view.initiative === 'player'} motionEnabled={motionEnabled} compact={compact} />
        <AppText variant="caption" tone="accent" maxFontSizeMultiplier={1.3} style={styles.vs}>VS</AppText>
        <FighterHealth fighter={view.opponent} initiative={view.initiative === 'opponent'} motionEnabled={motionEnabled} compact={compact} />
      </View>
    </View>
  );
}

function FighterHealth({ fighter, initiative, motionEnabled, compact }: {
  fighter: FighterView; initiative: boolean; motionEnabled: boolean; compact: boolean;
}) {
  const player = fighter.side === 'player';
  const name = player ? `${getFighter(fighter.fighterId).name} / YOU` : fighter.name;
  return (
    <View style={styles.health}>
      <View style={styles.identity}>
        <AppText variant="label" maxFontSizeMultiplier={1.3} style={styles.name}>
          {name}{compact && fighter.combo ? ` x${fighter.combo}` : ''}
        </AppText>
        {compact ? <AppText variant="caption" maxFontSizeMultiplier={1.3} style={styles.hp}>{fighter.hp} HP</AppText> : null}
      </View>
      <HealthBar label={player ? 'Your health' : `${fighter.name} health`} value={fighter.hp}
        max={fighter.maxHp} animate={motionEnabled} showLabel={false} />
      {!compact ? <View style={styles.healthDetail}>
        <AppText variant="caption" maxFontSizeMultiplier={1.3} style={styles.hp}>{fighter.hp} HP</AppText>
        <AppText variant="caption" maxFontSizeMultiplier={1.3} tone={fighter.combo ? 'accent' : 'secondary'}>
          {fighter.combo ? `x${fighter.combo} COMBO` : initiative ? 'INITIATIVE' : getFighter(fighter.fighterId).name}
        </AppText>
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: { flexShrink: 0, paddingHorizontal: 4 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { fontSize: 12, letterSpacing: 1 },
  progress: { flex: 1, textAlign: 'right', fontSize: 11 },
  exit: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  duel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  health: { flex: 1, gap: 4 },
  name: { fontSize: 12, lineHeight: 16 },
  identity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  vs: { color: colors.gold },
  healthDetail: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  hp: { fontWeight: '700' },
});
