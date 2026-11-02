import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { getBooster, isBattleBoosterId } from '../../data/boosters';
import { useBattleStore } from '../../features/battle/store';
import type { BattleView } from '../../game/battle';
import type { BoosterId } from '../../game/types/booster';
import { colors, layout, radii } from '../../theme';
import { AppText } from '../ui';
import { FeedbackPulse } from './FeedbackPulse';

const shortLabels: Record<Exclude<BoosterId, 'second-chance'>, string> = {
  '50-50': '50:50', 'extra-time': 'Time +5s',
  'double-damage': 'Double hit', 'mind-shield': 'Shield', 'streak-saver': 'Streak',
};

const accents: Record<Exclude<BoosterId, 'second-chance'>, string> = {
  '50-50': '#FFC83D',
  'extra-time': '#43E2FF',
  'double-damage': '#FFA26B',
  'mind-shield': '#C291FF',
  'streak-saver': '#59D7AC',
};

export function BoosterDock({ view, motionEnabled, condensed = false }: {
  view: BattleView; motionEnabled: boolean; condensed?: boolean;
}) {
  return (
    <View testID="booster-dock" style={styles.dock}>
      <View style={styles.row}>
        {view.boosters.map((state) => {
          if (!isBattleBoosterId(state.id)) return null;
          const booster = getBooster(state.id);
          const accent = accents[state.id];
          const note = state.used ? state.armed ? 'Used / armed' : 'Used' : state.canActivate ? 'Ready' : 'Wait';
          const disabled = state.used || !state.canActivate;
          const label = condensed && booster.id === 'extra-time' ? 'Time'
            : condensed && booster.id === 'double-damage' ? '2x hit' : shortLabels[state.id];
          return (
            <View key={booster.id} style={styles.slot}>
              <FeedbackPulse eventKey={`${view.question?.key}-${note}`} motionEnabled={motionEnabled} interactive>
                <Pressable testID={`booster-${booster.id}`} accessibilityRole="button"
                  accessibilityLabel={`${booster.name} booster, ${note.toLowerCase()}`}
                  accessibilityHint={booster.effect} accessibilityState={{ disabled }}
                  disabled={disabled} onPress={() => useBattleStore.getState().activateBooster(booster.id)}
                  style={({ pressed }) => [styles.ability, { borderColor: `${accent}70`, backgroundColor: `${accent}0D` },
                    condensed && styles.condensedAbility, state.used && styles.used, pressed && !disabled && styles.pressed]}>
                  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                    style={[styles.icon, { borderColor: `${accent}80`, backgroundColor: `${accent}22` },
                      condensed && styles.condensedIcon, state.used && styles.usedIcon]}>
                    <Ionicons testID={`power-icon-${booster.id}`} name={booster.id === 'extra-time' ? 'time-outline' : booster.icon}
                      size={condensed ? 18 : 20} color={state.used ? colors.muted : accent} />
                  </View>
                  <View style={styles.label}>
                    <AppText maxFontSizeMultiplier={1.25} style={[styles.name, state.used && styles.usedText]}>{label}</AppText>
                    <AppText maxFontSizeMultiplier={1.25}
                      style={[styles.note, { color: state.canActivate ? accent : colors.textSecondary }, state.used && styles.usedText]}>
                      {note.toUpperCase()}
                    </AppText>
                  </View>
                </Pressable>
              </FeedbackPulse>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { flexShrink: 0, marginTop: 'auto', gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  row: { flexDirection: 'row', gap: 6 },
  slot: { flex: 1 },
  ability: {
    minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8,
    borderRadius: radii.large, borderWidth: 1,
  },
  icon: { width: 32, height: 36, borderRadius: radii.medium, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, gap: 2 },
  condensedAbility: { minHeight: layout.touchTarget, padding: 6, borderRadius: radii.medium },
  condensedIcon: { width: 26, height: 30, borderRadius: radii.small },
  name: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  note: { fontSize: 10, lineHeight: 14, fontWeight: '700' },
  used: { backgroundColor: colors.track, borderColor: colors.border },
  usedIcon: { backgroundColor: colors.background, borderColor: colors.border },
  usedText: { color: colors.muted },
  pressed: { backgroundColor: colors.primaryAction },
});
