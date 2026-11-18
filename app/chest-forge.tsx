import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CHESTS, CHEST_FAMILIES, type ChestFamily } from '../src/assets/chests';
import { RewardChest } from '../src/components/player/RewardChest';
import { AppText, Button, Screen } from '../src/components/ui';
import { routes } from '../src/navigation/routes';
import { colors } from '../src/theme';

export default function ChestForge() {
  const [family, setFamily] = useState<ChestFamily>('field');
  const [opened, setOpened] = useState(false);
  return <Screen title="Chest forge" description="Four container designs. Preview only; no rewards or inventory changes."
    previewLabel={null} backHref={routes.designLab}
    footer={<Button label={opened ? 'Close preview chest' : 'Open preview chest'} onPress={() => setOpened(!opened)} />}>
    <AppText variant="caption" tone="accent">DESIGN PREVIEW / NOT FOUR RARITY TIERS</AppText>
    <RewardChest family={family} opened={opened} preview onOpen={() => setOpened(true)} />
    <AppText variant="caption" tone="secondary">{CHESTS[family].detail}</AppText>
    <View style={styles.families}>
      {CHEST_FAMILIES.map((id) => <Pressable key={id} accessibilityRole="radio" accessibilityLabel={CHESTS[id].name}
        accessibilityState={{ checked: family === id }} onPress={() => { setFamily(id); setOpened(false); }}
        style={[styles.family, family === id && { borderColor: CHESTS[id].accent }]}>
        <AppText variant="caption">{CHESTS[id].name}</AppText>
      </Pressable>)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  families: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  family: { flexBasis: '47%', flexGrow: 1, minHeight: 48, padding: 8, justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
});
