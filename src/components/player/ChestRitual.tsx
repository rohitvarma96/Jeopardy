import { useCallback, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CHESTS, type ChestFamily } from '../../assets/chests';
import { duplicateBrawlers, ritualBackdrop } from '../../assets/chest-ritual';
import { humanFighters } from '../../assets/human-fighters';
import { collectibleName, type Collectible } from '../../data/collectibles';
import { getFighter } from '../../data/fighters';
import { getBooster } from '../../data/boosters';
import { useChestOpening } from '../../hooks/useChestOpening';
import { worldIcons } from '../../assets/world-icons';
import { volt } from '../../theme';
import { AppText } from '../ui';
import { SceneAction, SigilButton } from '../world/SceneControls';
import { WorldIcon } from '../world/WorldIcon';
import { RewardChest } from './RewardChest';
import { ChestBreach, type CinematicReward } from './ChestBreach';
import { breachFrame } from './chest-breach';

export type ChestDiscovery = {
  item: Collectible; duplicate: boolean; shards: number;
  action?: { label: string; accessibilityLabel?: string; disabled?: boolean; loading?: boolean; onPress: () => void | Promise<void> };
};

export function ChestRitual({
  family, opened, opening, busy = false, disabled = false, preview = false, discovery, obscured = false,
  onOpen, onRevealComplete, onBack, onControls, onReplay, error, note,
}: {
  family: ChestFamily; opened: boolean; opening: boolean; busy?: boolean; disabled?: boolean; preview?: boolean;
  discovery?: ChestDiscovery; animateReveal?: boolean; obscured?: boolean; onOpen: () => void | Promise<void>; onRevealComplete: () => void;
  onBack: () => void; onControls?: () => void; onReplay?: () => void; error?: string | null; note?: string;
}) {
  const { width } = useWindowDimensions();
  const unit = Math.min(width, 600) / 100;
  const micro = { fontSize: unit * 2.7, lineHeight: unit * 4.05 };
  const item = discovery?.item;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const packKey = `${family}:${item?.id ?? 'none'}:${discovery?.duplicate ?? false}`;
  const [readiness, setReadiness] = useState<{ key: string; ready: boolean; error: Error | null }>({ key: packKey, ready: false, error: null });
  if (readiness.key !== packKey) setReadiness({ key: packKey, ready: false, error: null });
  const loaded = useCallback(() => setReadiness(current =>
    current.key === packKey && !current.ready ? { ...current, ready: true } : current), [packKey]);
  const artError = useCallback((error: Error) => setReadiness(current =>
    current.key === packKey ? { ...current, error } : current), [packKey]);
  const reward = useMemo<CinematicReward | undefined>(() => item ? item.kind === 'fighter'
    ? { ...humanFighters[item.fighterId], source: discovery?.duplicate ? duplicateBrawlers[item.fighterId] : humanFighters[item.fighterId].source,
        power: false, duplicate: !!discovery?.duplicate }
    : { source: worldIcons[item.boosterId], width: 96, height: 96, power: true, duplicate: !!discovery?.duplicate } : undefined,
  [item, discovery?.duplicate]);
  const presentation = useChestOpening({ family, opening, opened, suspended: obscured,
    assetsReady: readiness.key === packKey && readiness.ready && size.width > 0 && size.height > 0 && (!discovery || !!reward),
    onComplete: onRevealComplete });
  const active = presentation.motionActive && opening && opened && readiness.key === packKey && readiness.ready && size.width > 0 && size.height > 0;
  const [read, setRead] = useState({ key: `${packKey}:${opening}`, phase: 0, generation: 0 });
  const readKey = `${packKey}:${opening}`;
  if (read.key !== readKey) setRead({ key: readKey, phase: 0, generation: read.generation + 1 });
  const generation = read.generation;
  const markRead = useCallback((phase: number, serial: number) =>
    setRead(current => current.generation === serial ? { ...current, phase } : current), []);
  useAnimatedReaction(() => {
    if (!active) return 0;
    const p = presentation.progress.get();
    return p >= 2650 / 3200 ? 2 : p >= 2200 / 3200 ? 1 : 0;
  }, (phase, previous) => { if (phase > 0 && phase !== previous) runOnJS(markRead)(phase, generation); }, [active, generation]);
  const frame = useDerivedValue(() => breachFrame(presentation.progress.get()));
  const headingStyle = useAnimatedStyle(() => ({ opacity: active ? frame.get().copy : 1 }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: active ? frame.get().reward : opening ? 0 : 1 }));
  const receiptStyle = useAnimatedStyle(() => ({ opacity: active ? frame.get().receipt : opening ? 0 : 1 }));
  const firstRead = !opening || read.phase >= 1;
  const actionReady = !opening || read.phase >= 2;
  const subtitle = item ? `${item.rarity.toUpperCase()} / ${item.kind === 'fighter' ? getFighter(item.fighterId).passive.name.toUpperCase() : 'POWER'}` : '';
  if (readiness.error) throw readiness.error;
  return <SafeAreaView testID="chest-ritual" style={styles.safe}>
    <View testID="ritual-stage" style={styles.scene} onLayout={({ nativeEvent: { layout } }) => {
      if (layout.width > 0 && layout.height > 0) setSize(current =>
        current.width === layout.width && current.height === layout.height ? current : { width: layout.width, height: layout.height });
    }}>
      <Image source={ritualBackdrop} resizeMode="stretch" accessible={false} style={styles.backdrop} />
      <ChestBreach key={packKey} family={family} width={size.width} height={size.height}
        progress={presentation.progress} active={active} fullStage reward={reward} onReady={loaded} onError={artError} />
      <View style={[styles.header, { height: 7 * unit }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Return to Vault" onPress={onBack} style={styles.back}>
          <WorldIcon name="back" size={7 * unit} color="#F1F0E8" />
        </Pressable>
        <AppText accessibilityRole="header" style={[styles.screenName, { fontSize: 6.5 * unit, lineHeight: 7 * unit }]}>VAULT</AppText>
        <View style={styles.headerRight}>
          <AppText allowFontScaling={false} style={[styles.micro, styles.acid, { fontSize: 2.4 * unit, lineHeight: 3.6 * unit }]}>{preview ? 'PRACTICE' : 'EARNED / 01'}</AppText>
          {onControls ? <Pressable accessibilityRole="button" accessibilityLabel="Practice chest controls" onPress={onControls} style={styles.back}>
            <WorldIcon name="info" size={6 * unit} color="#F1F0E8" />
          </Pressable> : null}
        </View>
      </View>
      {!discovery || opening ? <>
        <Animated.View testID="ritual-heading" style={[styles.heading, headingStyle]}>
          <AppText allowFontScaling={false} style={[styles.micro, micro, styles.acid]}>{CHESTS[family].name.toUpperCase()}{preview ? ' / EXAMPLE' : ''}</AppText>
          <AppText accessibilityRole="header" maxFontSizeMultiplier={1.1} style={[styles.headline, { fontSize: 13 * unit, lineHeight: 12.35 * unit }]}>UNLOCK{'\n'}THE LATCH.</AppText>
          <AppText maxFontSizeMultiplier={1.2} style={[styles.copy, { fontSize: 3.1 * unit, lineHeight: 4.96 * unit, marginTop: 3 * unit }]}>
            {preview ? 'One practice chest. No account rewards.' : 'One earned chest. One real outcome.'}
          </AppText>
        </Animated.View>
        <View testID="ritual-chest" style={styles.chest}>
          <RewardChest family={family} opened={opened} opening={opening} busy={busy} disabled={disabled}
            preview={preview} caption={false} suspended={obscured} onOpen={onOpen}
            presentation={{ ...presentation, active }} />
        </View>
        <Animated.View style={[styles.instruction, headingStyle]}>
          {error ? <AppText accessibilityRole="alert" style={[styles.error, micro]}>{error}{'\n'}Tap the latch to retry.</AppText>
            : <AppText allowFontScaling={false} style={[styles.micro, micro, styles.acid]}>
              {busy && !opened ? 'SECURING YOUR REWARD...' : opened ? 'REWARD SECURED / CONTAINMENT ACTIVE' : 'TAP THE CHEST LATCH'}
            </AppText>}
        </Animated.View>
      </> : null}
      {item ? <View testID="ritual-discovery" accessibilityLiveRegion={firstRead ? 'polite' : 'none'}
        accessibilityElementsHidden={!firstRead} importantForAccessibility={firstRead ? 'auto' : 'no-hide-descendants'}
        pointerEvents={actionReady ? 'box-none' : 'none'} style={styles.discovery}>
        <Animated.View style={[styles.discoveryTitle, titleStyle]}>
          <AppText allowFontScaling={false} style={[styles.micro, micro, styles.acid]}>
            {discovery.duplicate ? `DUPLICATE ${item.kind === 'fighter' ? 'BRAWLER' : 'POWER'}` : `NEW ${item.kind === 'fighter' ? 'BRAWLER' : 'POWER'}`}
          </AppText>
          <AppText accessibilityRole="header" maxFontSizeMultiplier={1.1}
            style={[styles.discoveryName, { fontSize: 12 * unit, lineHeight: 10.8 * unit }]}>{collectibleName(item).toUpperCase()}</AppText>
          <AppText allowFontScaling={false} style={[styles.micro, micro, styles.rarity]}>{subtitle}</AppText>
        </Animated.View>
        {item.kind === 'fighter' ? <Animated.View testID="ritual-brawler-frame" style={[styles.brawler, !discovery.duplicate && styles.glow, receiptStyle]}>
          <Image testID="ritual-brawler" source={discovery.duplicate ? duplicateBrawlers[item.fighterId] : humanFighters[item.fighterId].source}
            accessible accessibilityRole="image" accessibilityLabel={`${collectibleName(item)} discovery artwork`} resizeMode="contain"
            style={[styles.brawlerArt, discovery.duplicate && styles.duplicate]} />
        </Animated.View> : <Animated.View style={[styles.power, discovery.duplicate && styles.duplicate, receiptStyle]}>
          <WorldIcon name={item.boosterId} size={26 * unit} color={discovery.duplicate ? '#A9AEBC' : '#E9FF3C'} />
          <AppText style={[styles.copy, micro]}>{getBooster(item.boosterId).effect}</AppText>
        </Animated.View>}
        {discovery.duplicate ? <Animated.View testID="ritual-duplicate" style={[styles.receipt, receiptStyle]}
          accessibilityElementsHidden={!actionReady} importantForAccessibility={actionReady ? 'auto' : 'no-hide-descendants'}>
          <AppText allowFontScaling={false} style={[styles.micro, micro]}>ALREADY OWNED / CONVERTED</AppText>
          <AppText style={[styles.shards, { fontSize: 13 * unit, lineHeight: 14.3 * unit }]}>+{discovery.shards} SHARDS</AppText>
          {preview ? <AppText allowFontScaling={false} style={[styles.micro, micro, styles.muted]}>EXAMPLE {item.rarity.toUpperCase()} DUPLICATE</AppText> : null}
        </Animated.View> : discovery.action ? <Animated.View style={[styles.equip, receiptStyle]}
          accessibilityElementsHidden={!actionReady} importantForAccessibility={actionReady ? 'auto' : 'no-hide-descendants'}>
          <SceneAction {...discovery.action} disabled={!actionReady || discovery.action.disabled}
            icon={item.kind === 'fighter' ? 'equip' : 'armory'}
            style={styles.equipButton} />
        </Animated.View> : null}
      </View> : null}
      <View style={styles.bottom}>
        <AppText allowFontScaling={false} style={[styles.micro, micro, styles.muted, styles.footerText]}>
          {note ?? (preview ? 'SAMPLE CONTENTS / NOT A REAL DROP' : discovery ? 'REWARD SAVED / NO SECOND GRANT' : 'OUTCOME IS FIXED BEFORE THE ANIMATION')}
        </AppText>
        {onReplay && discovery && !opening ? <SigilButton label="Open again" icon="back" onPress={onReplay} /> : null}
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0E14' },
  scene: { flex: 1, minHeight: 0, width: '100%', maxWidth: 600, alignSelf: 'center', overflow: 'hidden', backgroundColor: '#101924' },
  backdrop: { position: 'absolute', width: '100%', height: '100%' },
  header: { position: 'absolute', top: '3%', left: '5%', right: '5%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, zIndex: 2 },
  back: { minWidth: 48, minHeight: 48, alignItems: 'flex-start', justifyContent: 'center' },
  screenName: { fontFamily: volt.font.display, color: '#F1F0E8' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  micro: { fontFamily: volt.font.technical, color: '#F1F0E8', letterSpacing: .3, textAlign: 'center' },
  acid: { color: '#E9FF3C' },
  muted: { color: '#A9AEBC' },
  heading: { position: 'absolute', left: '5%', right: '5%', top: '16%', alignItems: 'center' },
  headline: { fontFamily: volt.font.display, color: '#F1F0E8', textAlign: 'center' },
  copy: { color: '#C1CCDA', textAlign: 'center' },
  chest: { position: 'absolute', top: '35%', left: '8%', width: '84%', height: '36%' },
  instruction: { position: 'absolute', bottom: '22%', left: '5%', right: '5%', alignItems: 'center' },
  error: { color: '#FFB7CF', textAlign: 'center' },
  discovery: { position: 'absolute', top: '10%', left: '3%', right: '3%', bottom: '15%' },
  discoveryTitle: { position: 'absolute', top: '3%', left: 0, right: 0, zIndex: 1, alignItems: 'center' },
  discoveryName: { fontFamily: volt.font.display, color: '#F1F0E8', textAlign: 'center' },
  rarity: { color: '#C1A8FF', marginTop: 8 },
  brawler: { position: 'absolute', top: '15%', left: '12%', width: '76%', height: '75%' },
  brawlerArt: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  // RN Web Image applies a direct filter twice; the frame owns the single glow.
  glow: Platform.OS === 'web' ? { filter: 'drop-shadow(0 0 22px #9166df66)' }
    : { shadowColor: '#9166DF', shadowOpacity: .4, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } },
  duplicate: { opacity: .24 },
  power: { position: 'absolute', top: '25%', left: '12%', width: '76%', height: '55%', alignItems: 'center', justifyContent: 'center', gap: 20 },
  equip: { position: 'absolute', bottom: 0, left: '25%', width: '50%', height: '12%', minHeight: 64 },
  equipButton: { flex: 1, minHeight: 48, paddingHorizontal: 10 },
  receipt: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  shards: { fontFamily: volt.font.display, color: '#E9FF3C', textAlign: 'center' },
  bottom: { position: 'absolute', bottom: '4%', left: '5%', right: '5%', borderTopWidth: 1, borderTopColor: '#71809266', paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { flex: 1, textAlign: 'left' },
});
