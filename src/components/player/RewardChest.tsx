import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { CHESTS, type ChestFamily } from '../../assets/chests';
import { useChestOpening } from '../../hooks/useChestOpening';
import { volt } from '../../theme';
import { AppText } from '../ui';
import { ChestBreach } from './ChestBreach';

export type ChestPresentation = Pick<ReturnType<typeof useChestOpening>, 'progress' | 'motionActive'> & { active: boolean };
type Props = {
  family: ChestFamily; opened: boolean; opening?: boolean; busy?: boolean; disabled?: boolean;
  onOpen?: () => void | Promise<void>; onRevealComplete?: () => void; compact?: boolean; preview?: boolean;
  caption?: boolean; suspended?: boolean; presentation?: ChestPresentation;
};

export function RewardChest(props: Props) {
  return props.presentation ? <ChestObject {...props} hidePaintings={props.presentation.active} />
    : <AutonomousChest {...props} />;
}

function AutonomousChest({
  family, opened, opening = false, busy = false, disabled = false, onOpen,
  onRevealComplete, compact = false, preview = false, caption = true, suspended = false,
}: Props) {
  const [error, setError] = useState<Error | null>(null);
  const [artReady, setArtReady] = useState({ family, open: false, effect: false });
  if (artReady.family !== family) setArtReady({ family, open: false, effect: false });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const loadedOpen = artReady.family === family && artReady.open;
  const loadedEffect = artReady.family === family && artReady.effect;
  const effectReady = useCallback(() => setArtReady(current =>
    current.family === family && !current.effect ? { ...current, effect: true } : current), [family]);
  const paintingReady = useCallback(() => setArtReady(current =>
    current.family === family && !current.open ? { ...current, open: true } : current), [family]);
  const { progress, motionActive } = useChestOpening({
    family, opening, opened, suspended, onComplete: onRevealComplete,
    assetsReady: loadedOpen && loadedEffect && size.width > 0 && size.height > 0,
  });
  const effectActive = opening && opened && motionActive && loadedOpen && loadedEffect && size.width > 0 && size.height > 0;
  if (error) throw error;
  return <ChestObject family={family} opened={opened} opening={opening} busy={busy} disabled={disabled}
    onOpen={onOpen} compact={compact} preview={preview} caption={caption} hidePaintings={effectActive}
    onLayout={(width, height) => setSize(current => current.width === width && current.height === height ? current : { width, height })}
    onPaintingReady={paintingReady} onError={setError}>
    <ChestBreach key={family} family={family} width={size.width} height={size.height} active={effectActive}
      progress={progress} onReady={effectReady} onError={setError} />
  </ChestObject>;
}

function ChestObject({ family, opened, opening = false, busy = false, disabled = false, onOpen,
  compact = false, preview = false, caption = true, hidePaintings, onLayout, onPaintingReady, onError, children }: Props & {
    hidePaintings: boolean; onLayout?: (width: number, height: number) => void;
    onPaintingReady?: () => void; onError?: (error: Error) => void; children?: import('react').ReactNode;
  }) {
  const chest = CHESTS[family];
  const art = <View accessible accessibilityRole="image"
    accessibilityLabel={`${opened ? 'Open' : 'Closed'} ${chest.name}`} style={styles.art}
    onLayout={({ nativeEvent: { layout } }) => {
      if (layout.width > 0 && layout.height > 0) onLayout?.(layout.width, layout.height);
    }}>
    <Image testID="chest-closed-painting" source={chest.closed} resizeMode="contain" accessible={false}
      onError={(event) => { if (onError) onError(new Error(event.nativeEvent.error)); else throw new Error(event.nativeEvent.error); }}
      style={[styles.painting, { opacity: !hidePaintings && (!opened || opening) ? 1 : 0 }]} />
    <Image testID="chest-open-painting" source={chest.open} resizeMode="contain" accessible={false} onLoad={onPaintingReady}
      onError={(event) => { if (onError) onError(new Error(event.nativeEvent.error)); else throw new Error(event.nativeEvent.error); }}
      style={[styles.painting, { opacity: opened && !opening && !hidePaintings ? 1 : 0 }]} />
    {children}
  </View>;
  const interactive = !opened || opening;
  return <View style={[styles.container, compact && styles.compact]}>
    {interactive ? <Pressable accessibilityRole="button"
      accessibilityLabel={opening ? opened ? 'Chest discovery pending' : 'Securing chest reward' : preview ? 'Preview opening the chest' : 'Open reward chest'}
      accessibilityHint={opening ? opened ? 'Reward saved. The chest builds pressure before opening.' : 'Waiting for the local reward save.'
        : preview ? 'Design preview only. No rewards or player data are changed.' : `${chest.name}. Opens the earned reward once.`}
      accessibilityState={{ disabled: disabled || opening || busy, busy: opening || busy }}
      disabled={disabled || opening || busy}
      onPress={onOpen}
      style={({ pressed }) => [styles.object, pressed && styles.pressed]}>
      {art}
    </Pressable> : art}
    {!compact && caption ? <View style={styles.caption}>
      <AppText variant="heading">{chest.name}</AppText>
      <AppText variant="caption" style={{ color: chest.accent }}>
        {opening ? opened ? 'REWARD SECURED / CONTAINMENT ACTIVE' : 'SECURING YOUR REWARD...'
          : preview ? opened ? 'OPEN STATE / PREVIEW ONLY' : 'CLOSED STATE / TAP TO PREVIEW'
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
  painting: { position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 },
  caption: { alignItems: 'center', gap: volt.space.xs },
  pressed: { opacity: .9, transform: [{ scale: .98 }] },
});
