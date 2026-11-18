import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FIGHTERS, getFighter } from '../../data/fighters';
import type { FighterId } from '../../game/types/fighter';
import { volt } from '../../theme';
import { PagedItems } from '../ui/PagedItems';
import { VoltButton, VoltOption, VoltTag, VoltText } from '../volt';
import { FighterArt } from './FighterArt';

export function FighterRoster({ selected, ownedIds, disabled = false, onSelect }: {
  selected: FighterId; ownedIds: readonly string[]; disabled?: boolean; onSelect: (id: FighterId) => void;
}) {
  const [details, setDetails] = useState(false);
  const { fontScale } = useWindowDimensions();
  const fighter = getFighter(selected);
  return <View style={styles.container}>
    {details ? <View style={styles.details}>
      {fontScale < 1.5 ? <FighterArt fighterId={selected} height={120} /> : null}
      <VoltText variant="heading">{fighter.name}</VoltText>
      <VoltText tone="muted">{fighter.role}</VoltText>
      <VoltText variant="label" tone="acid">{fighter.passive.name}</VoltText>
      <VoltText>{fighter.passive.description}</VoltText>
    </View> : <PagedItems items={FIGHTERS} keyExtractor={(item) => item.id} label="Fighters"
      columns={2} itemHeight={98} renderItem={(entry) => {
        const owned = ownedIds.includes(`fighter:${entry.id}`);
        return <VoltOption label={entry.name} role="radio" selected={selected === entry.id}
          disabled={disabled || !owned}
          accessibilityHint={`${entry.role}. ${entry.passive.description}${owned ? '' : ' Locked. Collect from a chest.'}`}
          onPress={() => onSelect(entry.id)} style={styles.tile}>
          <View style={styles.row}>
            {fontScale < 1.5 ? <FighterArt fighterId={entry.id} height={60} /> : null}
            <View style={styles.copy}>
              <VoltText variant="label">{entry.name}</VoltText>
              <VoltText variant="micro" tone={owned ? 'acid' : 'muted'}>{owned ? selected === entry.id ? 'SELECTED' : 'OWNED' : 'LOCKED'}</VoltText>
            </View>
          </View>
        </VoltOption>;
      }} />}
    <View style={styles.toolbar}>
      <VoltText variant="micro" tone="muted" style={styles.copy}>{fighter.passive.name}</VoltText>
      <VoltButton label={details ? 'Roster' : 'Fighter details'} variant="outline" size="compact"
        icon={details ? 'grid-outline' : 'information-circle-outline'} onPress={() => setDetails(!details)} />
    </View>
    {!ownedIds.includes(`fighter:${selected}`) ? <VoltTag label="Locked - collect from a chest" /> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: volt.space.sm },
  details: { flex: 1, minHeight: 0, gap: volt.space.sm, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: volt.space.sm },
  copy: { flex: 1, minWidth: 0 },
  tile: { minHeight: 98, justifyContent: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: volt.space.sm },
});
