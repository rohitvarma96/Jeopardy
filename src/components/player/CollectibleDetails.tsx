import { StyleSheet, View } from 'react-native';

import { getBooster } from '../../data/boosters';
import { collectibleName, type Collectible, type Rarity } from '../../data/collectibles';
import { getFighter } from '../../data/fighters';
import { colors, radii, spacing } from '../../theme';
import { FighterArt } from '../fighters/FighterArt';
import { AppText, Badge, IconSlot } from '../ui';

export const rarityColors: Record<Rarity, string> = { common: colors.muted, rare: colors.primary, epic: colors.gold };

export function CollectibleDetails({ item }: { item: Collectible }) {
  const description = item.kind === 'fighter' ? getFighter(item.fighterId).passive.description : getBooster(item.boosterId).effect;
  return (
    <View style={[styles.details, { borderColor: rarityColors[item.rarity] }]}>
      <View style={styles.row}>
        {item.kind === 'fighter' ? <FighterArt fighterId={item.fighterId} height={100} />
          : <IconSlot name={getBooster(item.boosterId).icon} />}
        <View style={styles.text}>
          <AppText variant="heading">{collectibleName(item)}</AppText>
          <Badge label={`${item.rarity[0].toUpperCase()}${item.rarity.slice(1)} ${item.kind}`} />
          <AppText variant="caption" tone="secondary">{description}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  details: { borderWidth: 2, borderRadius: radii.medium, padding: spacing.small },
  row: { flexDirection: 'row', gap: spacing.small, alignItems: 'center' },
  text: { flex: 1, gap: spacing.small },
});
