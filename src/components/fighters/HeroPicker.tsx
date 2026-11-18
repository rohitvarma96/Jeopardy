import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFighter } from '../../data/fighters';
import type { FighterId } from '../../game/types/fighter';
import { usePlayerStore } from '../../store/player-store';
import { volt } from '../../theme';
import { VoltButton, VoltSectionLabel, VoltText } from '../volt';
import { FighterRoster } from './FighterRoster';

export function HeroPicker({ onClose }: { onClose: () => void }) {
  const fighterId = usePlayerStore((state) => state.fighterId);
  const collectionIds = usePlayerStore((state) => state.collectionIds);
  const saveFighter = usePlayerStore((state) => state.saveFighter);
  const error = usePlayerStore((state) => state.error);
  const [selected, setSelected] = useState<FighterId>(fighterId);
  const [saving, setSaving] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  return (
    <Modal transparent animationType="none" visible onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View testID="brawler-picker" accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <VoltSectionLabel index="01" label="Brawler roster" />
              <VoltText variant="title">Change Brawler</VoltText>
            </View>
            <VoltButton label="Close" accessibilityLabel="Close Brawler picker" variant="outline"
              size="compact" icon="close" onPress={onClose} />
          </View>
          {error ? <VoltText accessibilityRole="alert" tone="red" style={styles.notice}>{error}</VoltText> : (
          <VoltText tone="muted" style={styles.notice}>
            Choose an owned Brawler. Unlock more Brawlers from earned chests.
          </VoltText>
          )}
          <FighterRoster selected={selected} ownedIds={collectionIds} disabled={saving} onSelect={setSelected} />
          <VoltButton
            label={`Equip ${getFighter(selected).name}`}
            loading={saving}
            disabled={selected === fighterId || !collectionIds.includes(`fighter:${selected}`)}
            onPress={async () => {
              setSaving(true);
              try {
                if (await saveFighter(selected) && active.current) onClose();
              } finally {
                if (active.current) setSaving(false);
              }
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: volt.space.lg, backgroundColor: 'rgba(10, 10, 16, 0.94)' },
  sheet: {
    flex: 1, minHeight: 0, width: '100%', maxWidth: 680, alignSelf: 'center',
    padding: volt.space.lg, gap: volt.space.md, borderRadius: volt.layout.radius,
    backgroundColor: volt.color.ink, borderWidth: 1, borderColor: volt.color.border,
  },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: volt.space.md },
  heading: { flex: 1, minWidth: 140, gap: volt.space.sm },
  notice: { flexShrink: 0 },
});
