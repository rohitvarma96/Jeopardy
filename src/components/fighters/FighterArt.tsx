import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View } from 'react-native';

import { fighterArt } from '../../assets/registry';
import { getFighter } from '../../data/fighters';
import type { FighterId } from '../../game/types/fighter';
import { colors, radii, spacing } from '../../theme';
import { AppText } from '../ui';

type FighterArtProps = { fighterId: FighterId; height: number };

/** Full-body art at 2:3, or an explicitly labeled placeholder preserving the same frame. */
export function FighterArt({ fighterId, height }: FighterArtProps) {
  const art = fighterArt[fighterId];
  const { name, icon } = getFighter(fighterId);
  const frame = { height, width: (height * 2) / 3 };

  if (!art) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${name} artwork placeholder. Final artwork pending.`}
        style={[styles.placeholder, frame]}
      >
        <Ionicons name={icon} size={Math.min(48, height / 3)} color={colors.muted} />
        <AppText variant="caption" tone="secondary" style={styles.placeholderText}>
          Placeholder{'\n'}art pending
        </AppText>
      </View>
    );
  }

  return (
    <Image
      source={art.source}
      accessibilityLabel={`${name} artwork`}
      resizeMode="contain"
      style={frame}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xsmall,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.muted,
    backgroundColor: colors.background,
    padding: spacing.xsmall,
  },
  placeholderText: { textAlign: 'center' },
});
