import { useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { battleAssets } from '../../assets/registry';
import { getBooster } from '../../data/boosters';
import { getFighter } from '../../data/fighters';
import { SIDES, type BattleView, type Side } from '../../game/battle';
import { colors, radii, spacing } from '../../theme';
import { AppText } from '../ui';
import { CombatStage, actorPosition, useCombatClock, type CombatClock, type StageGeometry } from './CombatStage';
import { outcomeText } from './battleText';
import { transitionFeedback, type CombatCue } from './combatFeedback';
import { battlePresentation, type CombatPresentation } from './combatPresentation';
import { FeedbackPulse } from './FeedbackPulse';
import { ImpactWord } from './ImpactWord';

type SceneProps = {
  view: BattleView; motionEnabled: boolean; outcomeOnly?: boolean; fill?: boolean;
  presentation?: CombatPresentation;
  replayKey?: number;
};

export function BattleScene({ view, motionEnabled, outcomeOnly = false, fill = false, presentation: study, replayKey = 0 }: SceneProps) {
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width - spacing.large * 2);
  const [measuredHeight, setMeasuredHeight] = useState(80);
  const height = fill ? measuredHeight : Math.min(260, Math.max(170, window.height * 0.26));
  const collapse = study ? study.finished : view.outcome?.reason === 'knockout';
  const fighterHeight = Math.max(1, Math.min(height - (height < 120 ? 16 : 40), (width - 24) * 0.65)
    * (collapse ? 0.8 : 1));
  const geometry = { width, height, fighterHeight };
  const presentation = study ?? battlePresentation(view, outcomeOnly);
  const clock = useCombatClock({ ...presentation, key: `${presentation.key}-${replayKey}` }, motionEnabled);
  const { elapsed } = clock;
  const transition = transitionFeedback(view);
  const { cues } = presentation;
  const shake = useAnimatedStyle(() => {
    let x = 0, y = 0;
    if (motionEnabled) {
      for (const cue of cues) {
        const time = elapsed.value - cue.contactMs;
        if (time >= 0 && time < 180 && (cue.damage > 0 || cue.blocked)) {
          const strength = cue.blocked ? 1 : cue.finishing ? 4 : cue.action === 'special' ? 2.5 : 1.5;
          x += Math.sin(time * 0.13) * strength * (1 - time / 180);
          y += Math.cos(time * 0.17) * strength * 0.35 * (1 - time / 180);
        }
      }
    }
    return { transform: [{ translateX: x }, { translateY: y }] };
  });

  return (
    <View testID="battle-scene" pointerEvents="none"
      onLayout={(event) => {
        const measured = event.nativeEvent.layout;
        if (measured.width > 0) setWidth(measured.width);
        if (fill && measured.height > 0) setMeasuredHeight(measured.height);
      }}
      style={[styles.scene, fill ? styles.fill : { height }]}>
      <Image source={battleAssets.arena.source}
        resizeMode={width / height > battleAssets.arena.width / battleAssets.arena.height ? 'contain' : 'cover'}
        style={StyleSheet.absoluteFill} accessible={false} />
      <Animated.View style={[StyleSheet.absoluteFill, shake]}>
        <CombatStage presentation={presentation} geometry={geometry} clock={clock} motionEnabled={motionEnabled} />
      </Animated.View>
      {SIDES.map((side) => <View key={side} testID={`fighter-${side}`} accessible accessibilityRole="image"
        accessibilityLabel={`${getFighter(presentation.fighters[side]).name} artwork`}
        style={{
          position: 'absolute', width: fighterHeight * 2 / 3, height: fighterHeight,
          left: actorPosition(side, geometry).x - fighterHeight / 3,
          bottom: height < 120 ? 5 : 14,
        }} />)}
      {!study && (!fill || height >= 110) ? <View style={styles.transition}>
        <FeedbackPulse eventKey={transition.key} motionEnabled={motionEnabled}>
          <AppText variant="caption" maxFontSizeMultiplier={1.3}
            style={[styles.sceneLabel, view.outcome?.winner === 'player' && styles.winningLabel]}>{transition.label}</AppText>
        </FeedbackPulse>
      </View> : null}
      {!study ? cues.map((cue) => <DamageLabel key={cue.key} cue={cue} clock={clock} geometry={geometry} motionEnabled={motionEnabled} />) : null}
      {cues.map((cue) => <ImpactWord key={`word-${cue.key}`} cue={cue} elapsed={elapsed}
        height={height} motionEnabled={motionEnabled} study={Boolean(study)} />)}
      {!outcomeOnly && !study ? SIDES.map((side) => (
        <FighterFeedback key={side} view={view} side={side} motionEnabled={motionEnabled} />
      )) : null}
    </View>
  );
}

function DamageLabel({ cue, clock, geometry, motionEnabled }: {
  cue: CombatCue; clock: CombatClock; geometry: StageGeometry; motionEnabled: boolean;
}) {
  const position = actorPosition(cue.target, geometry);
  const { elapsed } = clock;
  const style = useAnimatedStyle(() => {
    const progress = (elapsed.value - cue.contactMs) / 900;
    return {
      opacity: motionEnabled ? progress < 0 ? 0 : Math.max(0, Math.min(1, (1 - progress) * 3)) : 1,
      transform: [
        { translateY: motionEnabled ? -Math.max(0, progress) * 26 : 0 },
        { scale: motionEnabled ? 1 + Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI) * 0.12 : 1 },
      ],
    };
  });
  const tint = cue.blocked ? '#BFE9FF' : cue.action === 'special' ? colors.gold : '#FFF0D7';
  const label = cue.blocked ? 'Shielded' : cue.damage === 0 ? 'No damage' : `-${cue.damage}`;
  return <Animated.View testID={`damage-${cue.key}`}
    style={[styles.damage, { left: position.x - 56, top: geometry.height * 0.25 }, style]}>
    <AppText variant="heading" maxFontSizeMultiplier={1.3} style={{ color: tint }}>{label}</AppText>
    {cue.finishing ? <AppText variant="caption" maxFontSizeMultiplier={1.3} style={styles.finisher}>FINISHER</AppText> : null}
  </Animated.View>;
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
  return <View style={[styles.feedback, side === 'player' ? styles.left : styles.right,
    view.outcome && styles.outcomeFeedback,
    view.outcome && (side === 'player' ? styles.outcomePlayer : styles.outcomeOpponent)]}>
    <FeedbackPulse eventKey={`${key}-${boosterId}-${result?.outcome}-${result?.comboAfter}`} motionEnabled={motionEnabled}>
      {lines.map((line) => <AppText key={line} variant="caption" maxFontSizeMultiplier={1.25} style={styles.feedbackText}>{line}</AppText>)}
    </FeedbackPulse>
  </View>;
}

const styles = StyleSheet.create({
  scene: { borderRadius: radii.large, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  fill: { flex: 1 },
  transition: { position: 'absolute', top: 7, maxWidth: '94%', alignSelf: 'center' },
  sceneLabel: { color: '#E8D3A5', backgroundColor: '#101422DD', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.full, fontSize: 10, letterSpacing: 0.6 },
  winningLabel: { color: colors.success },
  feedback: { position: 'absolute', bottom: 3, width: '50%', paddingHorizontal: 6, alignItems: 'center' },
  outcomeFeedback: { top: 8, bottom: undefined },
  outcomePlayer: { alignItems: 'flex-start' },
  outcomeOpponent: { alignItems: 'flex-end' },
  left: { left: 0 },
  right: { right: 0 },
  feedbackText: { alignSelf: 'center', textAlign: 'center', backgroundColor: '#101422E8',
    color: colors.text, fontSize: 9, lineHeight: 12, paddingHorizontal: 5, borderRadius: 4 },
  damage: { position: 'absolute', width: 112, alignItems: 'center' },
  finisher: { color: colors.gold, fontSize: 9, letterSpacing: 1.5 },
});
