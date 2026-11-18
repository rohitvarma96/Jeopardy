import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { BackHandler, Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { leaveBattle } from '../../features/battle/session';
import { useBattleStore } from '../../features/battle/store';
import { useBattleClock } from '../../features/battle/useBattleClock';
import { selectBattleView, SIDES, type BattleView, type QuestionView } from '../../game/battle';
import { useSceneMotion } from '../../hooks/useBattleMotion';
import { exitPreview } from '../../navigation/exitPreview';
import { routes } from '../../navigation/routes';
import { colors, layout, spacing } from '../../theme';
import { AppText, Button, EmptyState, Panel, Screen } from '../ui';
import { BattleHUD } from './BattleHUD';
import { BattleQuestion } from './BattleQuestion';
import { BattleScene } from './BattleScene';
import { BoosterDock } from './BoosterDock';
import { endText, outcomeText } from './battleText';
import { combatCues } from './combatFeedback';

const store = () => useBattleStore.getState();

export function BattleScreen() {
  const router = useRouter();
  const battle = useBattleStore((state) => state.battle);
  const nowMs = useBattleStore((state) => state.nowMs);
  const error = useBattleStore((state) => state.error);
  const revealUntilMs = useBattleStore((state) => state.revealUntilMs);
  const [confirming, setConfirming] = useState(false);
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usableHeight = window.height - insets.top - insets.bottom;
  const { enabled: motionEnabled, ready: motionReady } = useSceneMotion();
  const playing = battle !== null && battle.phase !== 'finished';
  const view = useMemo(() => (battle ? selectBattleView(battle, nowMs) : null), [battle, nowMs]);
  useBattleClock(playing);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!playing) return false;
      setConfirming(true);
      return true;
    });
    return () => subscription.remove();
  }, [playing]));

  if (!battle || !view) return (
    <Screen title="Battle arena" description="No battle is in progress." previewLabel={null}>
      <EmptyState icon="flash-outline" title="No active battle"
        description="Start a match from Arena home: choose a mode, draft categories, then pick your Brawler and boosters."
        action={<Button label="Arena home" onPress={() => exitPreview()} />} />
    </Screen>
  );

  const question = view.question?.status === 'abandoned' ? null : view.question;
  const compact = usableHeight < 700 || window.fontScale > 1.15 || (question?.prompt.length ?? 0) > 115;
  const names = { player: 'You', opponent: view.opponent.name };
  const autoAdvance = view.phase === 'resolved' && revealUntilMs !== null;
  const combatFocus = view.phase === 'resolved' && view.reveal !== null;
  const correctOption = combatFocus && question ? question.options.find((option) => option.correct === true) : null;
  if (combatFocus && question && !correctOption) throw new Error('Resolved battle question is missing its correct answer.');

  return (
    <SafeAreaView testID="battle-safe-area" edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View testID="battle-layout" style={[styles.layout, compact && styles.compactLayout]}>
        <BattleHUD view={view} motionEnabled={motionEnabled} compact={compact}
          onExit={() => {
            if (playing) setConfirming(true);
            else { leaveBattle(); router.replace(routes.arena); }
          }} />
        <View testID="battle-arena-region" style={[styles.arena, { maxHeight: Math.max(110, usableHeight * (combatFocus ? 0.48 : 0.32)) }]}>
          <BattleScene view={view} motionEnabled={motionEnabled} motionReady={motionReady} fill />
        </View>
        {question ? combatFocus ? <View testID="battle-correct-answer" style={styles.correctAnswer}>
          <AppText variant="caption" tone="secondary">CORRECT ANSWER</AppText>
          <AppText variant="label">{correctOption?.text}</AppText>
        </View> : <BattleQuestion question={question} compact={compact} motionEnabled={motionEnabled} /> : (
          <View style={styles.transition}>
            <AppText variant="heading" style={styles.center}>
              {view.outcome?.winner === 'player' ? 'Victory' : 'Defeat'}
            </AppText>
            <AppText style={styles.center} tone="secondary">
              {view.outcome ? endText(view.outcome, names) : null}
            </AppText>
          </View>
        )}
        <View testID="battle-status" style={[styles.status, compact && styles.compactStatus]}>
          {view.outcome ? <Button label="View result" onPress={() => router.replace(routes.result)} />
            : view.phase === 'resolved' ? autoAdvance
              ? <View style={styles.statusRow}>
                <ResolutionSummary view={view} />
                <AppText variant="caption" tone="secondary" maxFontSizeMultiplier={1.3}
                  accessibilityLabel="Next exchange automatically">NEXT</AppText>
              </View>
              : <Button label="Continue" onPress={() => store().continue()} />
              : question ? <QuestionStatus question={question} /> : null}
        </View>
        {error ? <AppText accessibilityRole="alert" style={styles.error}>{error.message}</AppText> : null}
        <BoosterDock view={view} motionEnabled={motionEnabled} condensed={usableHeight < 620 || window.fontScale > 1.15} />
      </View>
      {confirming && playing ? (
        <Modal transparent animationType="none" visible onRequestClose={() => setConfirming(false)}>
          <SafeAreaView style={styles.confirmation}>
            <View style={styles.confirmationContent}>
              <Panel accessibilityViewIsModal>
                <AppText variant="heading" accessibilityRole="alert">Forfeit this match?</AppText>
                <AppText tone="secondary">Forfeiting counts as a loss. The timer keeps running while you decide.</AppText>
                <View style={styles.row}>
                  <Button label="Forfeit match" onPress={() => { setConfirming(false); store().forfeit(); }} />
                  <Button label="Keep playing" variant="secondary" onPress={() => setConfirming(false)} />
                </View>
              </Panel>
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

function ResolutionSummary({ view }: { view: BattleView }) {
  const cues = combatCues(view);
  return (
    <View testID="question-resolution" style={styles.resolution}>
      {SIDES.map((side) => {
        const result = view.reveal?.results[side];
        const damage = cues.filter((cue) => cue.attacker === side).reduce((total, cue) => total + cue.damage, 0);
        if (!result) return null;
        const text = `${side === 'player' ? 'You' : view.opponent.name}: ${outcomeText(result.outcome)}. ${damage} damage dealt.`;
        return <AppText key={side} accessibilityLiveRegion="polite" accessibilityLabel={text}
          maxFontSizeMultiplier={1.3} style={styles.result}>
          {side === 'player' ? 'You' : view.opponent.name}: {outcomeText(result.outcome)}
          {'\n'}<AppText maxFontSizeMultiplier={1.3} style={styles.damage}>{damage} damage</AppText>
        </AppText>;
      })}
    </View>
  );
}

function QuestionStatus({ question }: { question: QuestionView }) {
  const text = question.status === 'locked' ? 'Answer locked / waiting for opponent'
        : question.remainingMs <= 0 ? "Time's up"
          : question.opponentLocked ? 'Opponent locked in' : 'Choose your answer';
  return (
    <View style={styles.statusRow}>
      <AppText accessibilityLiveRegion="polite" variant="caption" maxFontSizeMultiplier={1.3}
        tone="secondary" style={styles.statusText}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  layout: {
    flex: 1, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center',
    paddingHorizontal: 12, paddingBottom: 6, gap: 6,
  },
  arena: { flex: 1, flexShrink: 1, flexBasis: '23%', minHeight: 80, zIndex: 0 },
  compactLayout: { gap: 3 },
  correctAnswer: { padding: 8, gap: 4, backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.success },
  transition: { flex: 1, justifyContent: 'center', gap: spacing.medium, padding: spacing.medium },
  status: { minHeight: 24, flexShrink: 0, justifyContent: 'center' },
  compactStatus: { minHeight: layout.touchTarget },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { flex: 1, textAlign: 'center' },
  center: { textAlign: 'center' },
  resolution: { flex: 1, flexDirection: 'row', gap: 8 },
  result: { flex: 1, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  damage: { fontSize: 12, lineHeight: 16, color: colors.gold, fontWeight: '600' },
  error: { color: colors.damage, fontSize: 12, lineHeight: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  confirmation: { flex: 1, backgroundColor: colors.background },
  confirmationContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.medium },
});
