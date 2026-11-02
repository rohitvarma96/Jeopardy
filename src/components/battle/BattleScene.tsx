import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { battleAssets, fighterArt } from '../../assets/registry';
import { getBooster } from '../../data/boosters';
import { SIDES, type BattleView, type Side } from '../../game/battle';
import { colors, layout, radii, spacing } from '../../theme';
import { FighterArt } from '../fighters/FighterArt';
import { AppText } from '../ui';
import { outcomeText } from './battleText';
import { combatCues, transitionFeedback, type CombatCue } from './combatFeedback';
import { FeedbackPulse } from './FeedbackPulse';

type SceneProps = { view: BattleView; motionEnabled: boolean; outcomeOnly?: boolean; fill?: boolean };

export function BattleScene({ view, motionEnabled, outcomeOnly = false, fill = false }: SceneProps) {
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width - spacing.large * 2);
  const [measuredHeight, setMeasuredHeight] = useState(80);
  const height = fill ? measuredHeight : Math.min(220, Math.max(170, window.height * 0.23));
  const fighterHeight = Math.min(height - (fill && height < 120 ? 16 : 40), (width - 24) * 0.65);
  const cues = outcomeOnly ? [] : combatCues(view);
  const transition = transitionFeedback(view);
  const finishDelay = cues.length > 0 ? cues[cues.length - 1].delayMs + 480 : 0;

  return (
    <View
      testID="battle-scene"
      pointerEvents="none"
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
        if (fill) setMeasuredHeight(event.nativeEvent.layout.height);
      }}
      style={[styles.scene, fill ? styles.fill : { height }]}
    >
      <Image source={battleAssets.arena.source} style={StyleSheet.absoluteFill} resizeMode="cover" accessible={false} />
      <View style={[StyleSheet.absoluteFill, styles.shade]} />
      {SIDES.map((side) => (
        <View key={side} style={[styles.fighterSlot, side === 'player' ? styles.left : styles.right]}>
          <FighterActor
            side={side}
            view={view}
            height={fighterHeight}
            distance={Math.min(34, width * 0.085)}
            attack={cues.find((cue) => cue.attacker === side)}
            hit={cues.find((cue) => cue.target === side)}
            finishDelay={finishDelay}
            motionEnabled={motionEnabled}
          />
        </View>
      ))}
      {cues.map((cue) => <Impact key={cue.key} cue={cue} width={width} motionEnabled={motionEnabled} />)}
      {view.outcome?.winner === 'player' ? (
        <VictoryBurst eventKey={transition.key} delayMs={finishDelay} motionEnabled={motionEnabled} />
      ) : null}
      {!fill || height >= 110 ? <View style={styles.transition}>
        <FeedbackPulse eventKey={transition.key} motionEnabled={motionEnabled}>
          <AppText variant="caption" maxFontSizeMultiplier={1.3}
            style={[styles.sceneLabel, view.outcome?.winner === 'player' && styles.winningLabel]}>{transition.label}</AppText>
        </FeedbackPulse>
      </View> : null}
      {!outcomeOnly ? SIDES.map((side) => (
        <FighterFeedback key={side} view={view} side={side} motionEnabled={motionEnabled} />
      )) : null}
    </View>
  );
}

function FighterActor({
  side, view, height, distance, attack, hit, finishDelay, motionEnabled,
}: {
  side: Side; view: BattleView; height: number; distance: number;
  attack?: CombatCue; hit?: CombatCue; finishDelay: number; motionEnabled: boolean;
}) {
  const fighter = side === 'player' ? view.player : view.opponent;
  const direction = side === 'player' ? 1 : -1;
  const entrance = useSharedValue(0);
  const breath = useSharedValue(0);
  const lunge = useSharedValue(0);
  const shake = useSharedValue(0);
  const pose = useSharedValue(0);
  const winner = view.outcome?.winner;
  const attackKey = attack?.key;
  const attackDelay = attack?.delayMs ?? 0;
  const finishing = attack?.finishing ?? false;
  const hitKey = hit?.key;
  const hitDelay = (hit?.delayMs ?? 0) + 130;
  const hurt = (hit?.damage ?? 0) > 0 && !hit?.blocked;
  const outcomeKey = view.outcome?.atMs;

  useEffect(() => {
    entrance.value = motionEnabled ? -direction * 50 : 0;
    if (motionEnabled) entrance.value = withTiming(0, { duration: 420 });
    return () => cancelAnimation(entrance);
  }, [direction, fighter.fighterId, motionEnabled, entrance]);

  useEffect(() => {
    breath.value = 0;
    if (motionEnabled && !winner) {
      breath.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
    }
    return () => cancelAnimation(breath);
  }, [motionEnabled, winner, breath]);

  useEffect(() => {
    lunge.value = 0;
    if (motionEnabled && attackKey) {
      lunge.value = withDelay(attackDelay, withSequence(
        withTiming(-direction * 5, { duration: 60 }),
        withTiming(direction * distance * (finishing ? 1.25 : 1), { duration: 110 }),
        withTiming(0, { duration: 210 }),
      ));
    }
    return () => cancelAnimation(lunge);
  }, [attackKey, attackDelay, direction, distance, finishing, motionEnabled, lunge]);

  useEffect(() => {
    shake.value = 0;
    if (motionEnabled && hitKey && hurt) {
      shake.value = withDelay(hitDelay, withSequence(
        withTiming(-direction * 7, { duration: 45 }), withTiming(direction * 5, { duration: 50 }),
        withTiming(-direction * 3, { duration: 50 }), withTiming(0, { duration: 100 }),
      ));
    }
    return () => cancelAnimation(shake);
  }, [hitKey, hitDelay, hurt, direction, motionEnabled, shake]);

  useEffect(() => {
    pose.value = winner ? 1 : 0;
    if (motionEnabled && winner) {
      pose.value = 0;
      pose.value = withDelay(finishDelay, withTiming(1, { duration: 600 }));
    }
    return () => cancelAnimation(pose);
  }, [outcomeKey, winner, finishDelay, motionEnabled, pose]);

  const won = winner === side;
  const lost = winner !== undefined && !won;
  const actorStyle = useAnimatedStyle(() => ({
    opacity: 1 - (lost ? pose.value * 0.4 : 0),
    transform: [
      { translateX: entrance.value + lunge.value + shake.value },
      { translateY: -breath.value * 3 + pose.value * (won ? -8 : 9) },
      { rotate: `${shake.value * 0.45 + (lost ? pose.value * direction * 13 : 0)}deg` },
      { scale: 1 + breath.value * 0.012 + pose.value * (won ? 0.045 : -0.06) },
    ],
  }));

  return (
    <Animated.View testID={`fighter-${side}`} style={actorStyle}>
      <View style={side === 'opponent' && fighterArt[fighter.fighterId] ? styles.mirror : undefined}>
        <FighterArt fighterId={fighter.fighterId} height={height} />
      </View>
    </Animated.View>
  );
}

function Impact({ cue, width, motionEnabled }: { cue: CombatCue; width: number; motionEnabled: boolean }) {
  const progress = useSharedValue(0);
  const travel = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    travel.value = 0;
    if (motionEnabled) {
      progress.value = withDelay(cue.delayMs + 130, withTiming(1, { duration: 1000 }));
      travel.value = withDelay(cue.delayMs + 60, withTiming(1, { duration: 160 }));
    }
    return () => {
      cancelAnimation(progress);
      cancelAnimation(travel);
    };
  }, [cue.delayMs, motionEnabled, progress, travel]);

  const numberStyle = useAnimatedStyle(() => ({
    opacity: motionEnabled ? (progress.value > 0 ? Math.min(1, (1 - progress.value) * 4) : 0) : 1,
    transform: [
      { translateY: motionEnabled ? -progress.value * 28 : 0 },
      { scale: motionEnabled ? 1 + Math.sin(progress.value * Math.PI) * 0.18 : 1 },
    ],
  }));
  const effectStyle = useAnimatedStyle(() => ({
    opacity: motionEnabled && progress.value > 0 ? Math.max(0, 1 - progress.value * 3) : 0,
    transform: [{ scale: 0.5 + progress.value * (cue.finishing ? 3 : 2) }, { rotate: '-25deg' }],
  }));
  const trailStyle = useAnimatedStyle(() => ({
    opacity: motionEnabled && travel.value > 0 && travel.value < 1 ? 0.9 : 0,
    transform: [{ translateX: (cue.attacker === 'player' ? 1 : -1) * width * 0.5 * travel.value }],
  }));
  const tint = cue.blocked ? colors.primary : cue.finishing ? colors.gold : colors.damage;
  const label = cue.blocked ? 'Shielded' : cue.damage === 0 ? 'No damage' : `-${cue.damage}`;

  return (
    <>
      <Animated.View
        testID={`attack-${cue.key}`}
        style={[styles.trail, cue.attacker === 'player' ? styles.playerImpact : styles.opponentImpact,
          { backgroundColor: cue.finishing ? colors.gold : colors.primary }, trailStyle]}
      />
      <Animated.View
        testID={`impact-${cue.key}`}
        style={[styles.impact, cue.target === 'player' ? styles.playerImpact : styles.opponentImpact, effectStyle]}
      >
        <View style={[styles.ring, { borderColor: tint }]} />
        {!cue.blocked ? <View style={[styles.slash, { backgroundColor: tint }]} /> : null}
      </Animated.View>
      <Animated.View
        testID={`damage-${cue.key}`}
        style={[styles.damage, cue.target === 'player' ? styles.left : styles.right, numberStyle]}
      >
        <AppText variant="heading" maxFontSizeMultiplier={1.3} style={{ color: tint }}>{label}</AppText>
        {cue.finishing ? (
          <AppText variant="caption" maxFontSizeMultiplier={1.3}>Finisher</AppText>
        ) : null}
      </Animated.View>
    </>
  );
}

function FighterFeedback({ view, side, motionEnabled }: { view: BattleView; side: Side; motionEnabled: boolean }) {
  const result = view.reveal?.results[side];
  const boosterId = side === 'player' ? view.question?.boosterUsed : result?.boosterId;
  const key = side === 'player' ? view.question?.key : view.reveal?.key;
  const lines = [
    boosterId ? `${getBooster(boosterId).name} activated` : null,
    result ? outcomeText(result.outcome) : null,
    result && (result.comboAfter >= 2 || result.comboSaved)
      ? `Combo x${result.comboAfter}${result.comboSaved ? ' saved!' : '!'}` : null,
  ].filter((line): line is string => line !== null);
  if (lines.length === 0) return null;

  return (
    <View style={[styles.feedback, side === 'player' ? styles.left : styles.right]}>
      <FeedbackPulse eventKey={`${key}-${boosterId}-${result?.outcome}-${result?.comboAfter}`} motionEnabled={motionEnabled}>
        {lines.map((line) => <AppText key={line} variant="caption" maxFontSizeMultiplier={1.25} style={styles.feedbackText}>{line}</AppText>)}
      </FeedbackPulse>
    </View>
  );
}

function VictoryBurst({ eventKey, delayMs, motionEnabled }: { eventKey: string; delayMs: number; motionEnabled: boolean }) {
  const burst = useSharedValue(0);
  useEffect(() => {
    burst.value = 0;
    if (motionEnabled) burst.value = withDelay(delayMs, withTiming(1, { duration: 1100 }));
    return () => cancelAnimation(burst);
  }, [eventKey, delayMs, motionEnabled, burst]);
  const style = useAnimatedStyle(() => ({
    opacity: motionEnabled && burst.value > 0 ? 1 - burst.value : 0,
    transform: [{ scale: 0.4 + burst.value * 2.2 }, { rotate: `${burst.value * 20}deg` }],
  }));
  return (
    <Animated.View testID="victory-burst" style={[styles.burst, style]}>
      {Array.from({ length: 8 }, (_, index) => (
        <View key={index} style={[styles.ray, { transform: [{ rotate: `${index * 45}deg` }] }]} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: { borderRadius: radii.large, overflow: 'hidden', borderWidth: layout.borderWidth, borderColor: colors.border },
  fill: { flex: 1 },
  shade: { backgroundColor: `${colors.background}33`, zIndex: 1 },
  fighterSlot: { position: 'absolute', bottom: 10, width: '50%', alignItems: 'center', zIndex: 2 },
  left: { left: 0 },
  right: { right: 0 },
  mirror: { transform: [{ scaleX: -1 }] },
  transition: { position: 'absolute', top: 8, maxWidth: '94%', alignSelf: 'center', zIndex: 5 },
  sceneLabel: { color: colors.gold, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.full },
  winningLabel: { color: colors.success },
  feedback: { position: 'absolute', bottom: 4, width: '50%', paddingHorizontal: 4, zIndex: 5 },
  feedbackText: { textAlign: 'center', backgroundColor: colors.background, color: colors.text },
  damage: { position: 'absolute', top: '37%', width: '50%', alignItems: 'center', zIndex: 4 },
  impact: { position: 'absolute', top: '45%', width: 42, height: 42, zIndex: 3 },
  playerImpact: { left: '25%', marginLeft: -21 },
  opponentImpact: { left: '75%', marginLeft: -21 },
  ring: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 3, borderRadius: radii.full },
  slash: { position: 'absolute', width: 60, height: 4, left: -9, top: 19, borderRadius: radii.full },
  trail: { position: 'absolute', top: '55%', width: 32, height: 4, borderRadius: radii.full, zIndex: 3 },
  burst: { position: 'absolute', left: '25%', top: '50%', width: 80, height: 80, marginLeft: -40, marginTop: -40, zIndex: 3 },
  ray: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderTopWidth: 3, borderColor: colors.gold, borderRadius: radii.full },
});
