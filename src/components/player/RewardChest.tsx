import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { CHESTS, type ChestFamily } from '../../assets/chests';
import { volt } from '../../theme';
import { AppText } from '../ui';

export function RewardChest({ family, opened, busy = false, disabled = false, onOpen, compact = false, preview = false }: {
  family: ChestFamily; opened: boolean; busy?: boolean; disabled?: boolean;
  onOpen?: () => void | Promise<void>; compact?: boolean; preview?: boolean;
}) {
  const [error, setError] = useState<Error | null>(null);
  const chest = CHESTS[family];
  if (error) throw error;
  const art = <Image source={opened ? chest.open : chest.closed} resizeMode="contain"
    accessible accessibilityRole="image" accessibilityLabel={`${opened ? 'Open' : 'Closed'} ${chest.name}`}
    onError={(event) => setError(new Error(`Unable to load ${chest.name}: ${event.nativeEvent.error}`))}
    style={styles.art} />;
  return <View style={[styles.container, compact && styles.compact]}>
    {opened ? art : <Pressable accessibilityRole="button"
      accessibilityLabel={preview ? 'Preview opening the chest' : 'Open reward chest'}
      accessibilityHint={preview ? 'Design preview only. No rewards or player data are changed.'
        : `${chest.name}. Opens the earned reward once; chest style does not change loot odds.`}
      accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy}
      onPress={onOpen} style={({ pressed }) => [styles.object, pressed && styles.pressed]}>
      {art}
    </Pressable>}
    {!compact ? <View style={styles.caption}>
      <AppText variant="heading">{chest.name}</AppText>
      <AppText variant="caption" style={{ color: chest.accent }}>
        {preview ? opened ? 'OPEN STATE / PREVIEW ONLY' : 'CLOSED STATE / TAP TO PREVIEW'
          : busy ? 'Securing your reward...' : opened ? 'CHEST OPENED / REWARD SAVED' : 'TAP THE LATCH TO OPEN'}
      </AppText>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 100, gap: volt.space.sm, alignItems: 'stretch' },
  compact: { flex: 0, height: 100, minHeight: 80 },
  object: { flex: 1, minHeight: 80 },
  art: { flex: 1, minHeight: 0, width: '100%', height: '100%' },
  caption: { alignItems: 'center', gap: volt.space.xs },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
