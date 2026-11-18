import { BlurMask, Canvas, Circle, Group, Image as SkiaImage, Line, Oval, useImage, vec, type SkImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { useAmbientClock } from '../../hooks/useAmbientClock';
import { useSceneMotion } from '../../hooks/useBattleMotion';
import { volt } from '../../theme';
import { SceneAtmosphere } from '../atmosphere/SceneAtmosphere';
import { AppText } from '../ui';
import { SigilButton, worldColors } from './SceneControls';
import {
  SAGE_DURATION, SAGE_PAINT_ORDER, SAGE_PARTS, sageLayer, sagePose, sageStageLayout, type SageClip,
} from './sage-performance';

export type BrawlerPerformanceHandle = { ready: () => void };
const atlasSource = require('../../../assets/images/fighters/home/sage-atlas.png');
const restSource = require('../../../assets/images/fighters/home/sage-rest.png');
let arrived = false;

function PaintedLayer({ layer, image, pose }: {
  layer: Parameters<typeof sageLayer>[0]; image: SkImage; pose: SharedValue<ReturnType<typeof sagePose>>;
}) {
  const clip = useDerivedValue(() => SAGE_PARTS[sageLayer(layer, pose.get()).part].rect);
  const transform = useDerivedValue(() => {
    const frame = sageLayer(layer, pose.get()), part = SAGE_PARTS[frame.part];
    return [{ translateX: frame.x }, { translateY: frame.y }, { rotate: frame.rotation },
      { scale: frame.scale }, { translateX: -part.rect.x - part.anchor.x }, { translateY: -part.rect.y - part.anchor.y }];
  });
  return <Group transform={transform}><Group clip={clip}>
    <SkiaImage image={image} x={0} y={0} width={1536} height={1536} fit="fill" />
  </Group></Group>;
}

function Constellation({ pose }: { pose: SharedValue<ReturnType<typeof sagePose>> }) {
  const opacity = useDerivedValue(() => pose.get().constellation);
  const points = [[374, 168], [430, 121], [504, 155], [474, 211], [414, 202]] as const;
  return <Group opacity={opacity}>
    {points.map(([x, y], i) => <Group key={i}>
      <Line p1={vec(x, y)} p2={vec(...points[(i + 1) % points.length])} color="#C8B2FF" strokeWidth={1.6} />
      <Circle cx={x} cy={y} r={5} color="#A78CFF"><BlurMask blur={5} style="normal" /></Circle>
      <Circle cx={x} cy={y} r={2.2} color="#F6F0FF" />
    </Group>)}
  </Group>;
}

export function SagePerformance({ width, height, artHeight, allowed, ref }: {
  width: number; height: number; artHeight: number; allowed: boolean; ref?: Ref<BrawlerPerformanceHandle>;
}) {
  const motion = useSceneMotion(!allowed);
  const [error, setError] = useState<Error | null>(null);
  const image = useImage(error ? null : atlasSource, setError);
  const enabled = motion.enabled && !!image && !error;
  const visible = motion.enabled && !error;
  const clock = useAmbientClock(enabled);
  const clip = useSharedValue<SageClip>('idle'), elapsed = useSharedValue(0);
  const current = useRef<SageClip>('idle');
  const end = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quiet = useRef<ReturnType<typeof setTimeout> | null>(null);
  const released = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedback, setFeedback] = useState({ caption: '', enabled });
  if (feedback.enabled !== enabled) setFeedback({ caption: '', enabled });
  const [idleEpoch, setIdleEpoch] = useState(0);
  const [bodyFocused, setBodyFocused] = useState(false);
  const [propFocused, setPropFocused] = useState(false);
  const holding = useRef(false);
  const layout = sageStageLayout(width, height, artHeight);
  const clearTimers = useCallback(() => {
    if (end.current) clearTimeout(end.current);
    if (quiet.current) clearTimeout(quiet.current);
    if (released.current) clearTimeout(released.current);
    end.current = quiet.current = released.current = null;
  }, []);
  const announce = useCallback((message: string) => {
    setFeedback({ caption: message, enabled });
    if (released.current) clearTimeout(released.current);
    released.current = setTimeout(() => setFeedback({ caption: '', enabled }), 1600);
  }, [enabled]);
  const play = useCallback((next: SageClip, priority = false, offset = 0) => {
    if (!priority && current.current !== 'idle' && current.current !== 'arrival' && current.current !== 'focus') return false;
    if (!enabled) return true;
    if (end.current) clearTimeout(end.current);
    if (quiet.current) clearTimeout(quiet.current);
    current.current = next;
    clip.set(next);
    cancelAnimation(elapsed);
    elapsed.set(offset);
    elapsed.set(withTiming(SAGE_DURATION[next], { duration: SAGE_DURATION[next] - offset, easing: Easing.linear }));
    if (next !== 'focus' && next !== 'ready') end.current = setTimeout(() => {
      current.current = 'idle';
      clip.set('idle');
      elapsed.set(0);
      setIdleEpoch(epoch => epoch + 1);
    }, SAGE_DURATION[next] - offset);
    return true;
  }, [clip, elapsed, enabled]);
  useImperativeHandle(ref, () => ({ ready: () => { play('ready', true); } }), [play]);
  useEffect(() => {
    clearTimers();
    current.current = 'idle';
    holding.current = false;
    clip.set('idle'); cancelAnimation(elapsed); elapsed.set(0);
    if (enabled) {
      if (!arrived) { arrived = true; play('arrival', true); }
    }
    return () => { clearTimers(); cancelAnimation(elapsed); };
  }, [clearTimers, clip, elapsed, enabled, play]);
  useEffect(() => {
    if (!enabled || current.current !== 'idle') return;
    const timer = setTimeout(() => play('signature'), 24000);
    quiet.current = timer;
    return () => clearTimeout(timer);
  }, [enabled, idleEpoch, play]);
  const pose = useDerivedValue(() => sagePose(clip.get(), clip.get() === 'idle' ? clock.get() : elapsed.get()));
  const propPosition = useAnimatedStyle(() => ({
    left: layout.left + pose.get().starX * layout.scale - 24,
    top: layout.top + pose.get().starY * layout.scale - 24,
  }));
  const body = {
    left: layout.left + 95 * layout.scale, top: layout.top + 30 * layout.scale,
    width: Math.max(48, 280 * layout.scale), height: Math.max(48, 650 * layout.scale),
  };
  const signature = () => { holding.current = false; play('signature'); };
  return <View style={StyleSheet.absoluteFill} testID="sage-performance">
    {visible ? <View testID="arena-living-canvas" pointerEvents="none" style={StyleSheet.absoluteFill}
      accessible accessibilityRole="image" accessibilityLabel="Astral Sage artwork">
      <Canvas style={{ width, height }} accessible={false}>
        <SceneAtmosphere width={width} height={height} time={clock} kind="arena" enabled />
        <Oval x={width * .24} y={height - 7} width={width * .52} height={8} color="#050811" opacity={.75}>
          <BlurMask blur={3} style="normal" />
        </Oval>
        {image ? <Group transform={[{ translateX: layout.left }, { translateY: layout.top }, { scale: layout.scale }]}>
          {SAGE_PAINT_ORDER.map(layer =>
            <PaintedLayer key={layer} layer={layer} image={image} pose={pose} />)}
          <Constellation pose={pose} />
        </Group> : null}
      </Canvas>
    </View> : null}
    {!enabled ? <Image source={restSource} resizeMode="contain" accessible={!visible} accessibilityRole="image"
      accessibilityElementsHidden={visible} importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}
      accessibilityLabel="Astral Sage artwork"
      style={{ position: 'absolute', left: layout.left, top: layout.top, width: 560 * layout.scale, height: 1000 * layout.scale }} /> : null}
    <Pressable testID="sage-body" accessibilityRole="button" accessibilityLabel="Acknowledge Astral Sage"
      accessibilityHint="The Brawler acknowledges you. Use the nameplate to change Brawler."
      disabled={!allowed} onPress={() => { announce('Sage acknowledges you.'); play('acknowledge'); }}
      onFocus={() => setBodyFocused(true)} onBlur={() => setBodyFocused(false)}
      style={[styles.body, body, bodyFocused && styles.focus]} />
    <Animated.View style={[styles.prop, propPosition]} pointerEvents="box-none">
      <Pressable testID="sage-prop" accessibilityRole="button" accessibilityLabel="Interact with Astral Sage's star"
        accessibilityHint="Tap to play the constellation. You can also hold, then release."
        disabled={!allowed} delayLongPress={300}
        onFocus={() => setPropFocused(true)} onBlur={() => setPropFocused(false)}
        onLongPress={() => { holding.current = play('focus'); if (holding.current) announce('Constellation focused.'); }}
        onPressOut={(event) => {
          if (holding.current) {
            holding.current = false;
            const { locationX: x, locationY: y } = event.nativeEvent;
            const inside = x >= -12 && x <= 60 && y >= -12 && y <= 60;
            play(inside ? 'signature' : 'recover', true, inside ? 650 : 0);
            if (inside) announce('Pinch the constellation.');
          }
        }}
        onTouchCancel={() => { holding.current = false; if (current.current === 'focus') play('recover', true); }}
        onPress={() => { announce('Pinch the constellation.'); signature(); }}
        style={[styles.propTouch, propFocused && styles.focus]}>
        <View pointerEvents="none" style={styles.propMark} />
      </Pressable>
    </Animated.View>
    <View style={styles.signature}>
      <SigilButton icon="space" label="Play Astral Sage signature" onPress={() => { announce('Pinch the constellation.'); signature(); }} disabled={!allowed} />
    </View>
    <View pointerEvents="none" style={styles.caption} accessibilityLiveRegion="polite">
      <AppText maxFontSizeMultiplier={1.2} style={styles.captionText}>{feedback.caption}</AppText>
    </View>
    {error ? <View style={styles.error}>
      <AppText accessibilityRole="alert" style={styles.captionText}>Sage animation could not load. The Brawler is still usable.</AppText>
      <SigilButton icon="next" label="Retry Sage animation" onPress={() => setError(null)} />
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  body: { position: 'absolute', borderRadius: 8 },
  focus: { borderWidth: 2, borderColor: worldColors.paper },
  prop: { position: 'absolute', width: 48, height: 48 },
  propTouch: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  propMark: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#C6B3FF55' },
  signature: { position: 'absolute', bottom: 8, right: 0 },
  caption: { position: 'absolute', top: 2, right: 0, maxWidth: '62%' },
  captionText: { color: worldColors.paper, fontFamily: volt.font.technical, fontSize: 9, lineHeight: 14 },
  error: { position: 'absolute', top: 0, left: 0, right: 0, padding: 8, backgroundColor: worldColors.ink, flexDirection: 'row', gap: 8 },
});
