import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FIGHTERS, getFighter } from '../../data/fighters';
import type { FighterId } from '../../game/types/fighter';
import { usePlayerStore } from '../../store/player-store';
import { spacing } from '../../theme';
import { AppText, Badge, Button, SelectableCard } from '../ui';
import { FighterArt } from './FighterArt';

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
        <View testID="hero-picker" accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <AppText variant="heading" style={styles.heading}>Change hero</AppText>
            <Button label="Close" accessibilityLabel="Close hero picker" variant="ghost" onPress={onClose} />
          </View>
          {error ? <AppText accessibilityRole="alert" style={styles.notice}>{error}</AppText> : (
          <AppText variant="caption" tone="secondary" style={styles.notice}>
            Choose an owned hero. Unlock more heroes from match capsules.
          </AppText>
          )}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.heroes}>
            {FIGHTERS.map((fighter) => {
              const owned = collectionIds.includes(`fighter:${fighter.id}`);
              return (
                <SelectableCard
                  key={fighter.id}
                  label={fighter.name}
                  hint={`${fighter.role}. ${fighter.passive.description}${owned ? '' : ' Locked. Collect from a capsule.'}`}
                  selected={selected === fighter.id}
                  disabled={!owned || saving}
                  onPress={() => setSelected(fighter.id)}
                  style={styles.hero}
                >
                  <View style={styles.heroRow}>
                    <FighterArt fighterId={fighter.id} height={120} />
                    <View style={styles.heroCopy}>
                      <AppText variant="heading">{fighter.name}</AppText>
                      <AppText variant="caption" tone="secondary">{fighter.role}</AppText>
                      <AppText variant="label" tone="accent">{fighter.passive.name}</AppText>
                      {!owned ? <Badge label="Locked - collect from a capsule" /> : fighterId === fighter.id ? <Badge label="Equipped" /> : null}
                    </View>
                  </View>
                </SelectableCard>
              );
            })}
          </ScrollView>
          <Button
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
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.medium, backgroundColor: 'rgba(9, 7, 18, 0.85)' },
  sheet: {
    width: '100%', maxWidth: 560, maxHeight: '100%', alignSelf: 'center',
    padding: spacing.medium, gap: spacing.small, borderRadius: 22,
    backgroundColor: '#1C192D', borderWidth: 1, borderColor: '#51415E',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  heading: { flex: 1 },
  notice: { flexShrink: 0 },
  scroll: { flexShrink: 1 },
  heroes: { gap: spacing.small, paddingVertical: spacing.small },
  hero: { backgroundColor: '#262039' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  heroCopy: { flex: 1, gap: spacing.xsmall },
});
