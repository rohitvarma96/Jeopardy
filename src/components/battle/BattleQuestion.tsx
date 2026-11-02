import { Pressable, StyleSheet, View } from 'react-native';

import { getCategory } from '../../data/categories';
import { useBattleStore } from '../../features/battle/store';
import type { OptionView, QuestionView } from '../../game/battle';
import { colors, layout, radii } from '../../theme';
import { AppText, IconSlot, ProgressBar, type IconName } from '../ui';
import { FeedbackPulse } from './FeedbackPulse';

export function BattleQuestion({ question, compact, motionEnabled }: {
  question: QuestionView; compact: boolean; motionEnabled: boolean;
}) {
  const canAnswer = question.status === 'answering' && question.remainingMs > 0;
  const seconds = Math.ceil(question.remainingMs / 1000);
  const locked = question.status === 'locked';
  const resolved = question.status === 'resolved';
  return (
    <View testID="battle-question" style={[styles.panel, compact ? styles.compactPanel : styles.spaciousPanel]}>
      <View style={styles.metadata}>
        <AppText variant="caption" maxFontSizeMultiplier={1.3} tone="accent" style={styles.category}>
          {getCategory(question.categoryId).name.toUpperCase()} / {question.difficulty.toUpperCase()}
        </AppText>
        <AppText testID="question-clock" maxFontSizeMultiplier={1.3}
          style={[styles.clock, seconds <= 3 && !resolved && styles.urgent]}>
          {resolved ? 'REVEAL' : `${String(seconds).padStart(2, '0')}s${locked ? ' / LOCKED' : ''}`}
        </AppText>
      </View>
      <AppText testID="question-prompt" accessibilityRole="header" maxFontSizeMultiplier={1.4}
        style={[styles.prompt, compact && styles.compactPrompt]}>{question.prompt}</AppText>
      <ProgressBar label="Seconds remaining" value={seconds} max={Math.ceil(question.totalMs / 1000)}
        showLabel={false} tone={seconds <= 3 ? 'danger' : 'primary'} />
      <View testID="battle-answers" style={[styles.options, compact ? styles.grid : styles.spaciousPanel]}>
        {question.options.map((option) => (
          <View key={`${question.key}-${option.index}`} style={compact ? styles.gridSlot : styles.spaciousPanel}>
            <AnswerOption option={option} compact={compact} motionEnabled={motionEnabled}
              disabled={!canAnswer || option.removed} />
          </View>
        ))}
      </View>
    </View>
  );
}

function AnswerOption({ option, disabled, motionEnabled, compact }: {
  option: OptionView; disabled: boolean; motionEnabled: boolean; compact: boolean;
}) {
  const unavailable = option.removed;
  const tone = option.correct === true ? 'correct'
    : option.correct === false && option.selected ? 'wrong' : option.selected ? 'selected' : 'idle';
  const notes = [
    option.removed ? 'removed by 50:50' : null,
    option.selected ? 'your answer' : null, tone === 'correct' ? 'correct answer' : null,
    tone === 'wrong' ? 'wrong' : null,
  ].filter((note): note is string => note !== null);
  const icon: IconName | null = tone === 'correct' ? 'checkmark-circle' : tone === 'wrong' ? 'close-circle'
    : unavailable ? 'remove-circle-outline' : option.selected ? 'radio-button-on' : null;
  return (
    <FeedbackPulse eventKey={tone} motionEnabled={motionEnabled} wrong={tone === 'wrong'} interactive
      style={styles.spaciousPanel}>
      <Pressable testID={`answer-${option.index}`} accessibilityRole="button"
        accessibilityLabel={[`${option.label}. ${option.text}`, ...notes].join(', ')}
        accessibilityState={{ disabled, selected: option.selected }} disabled={disabled}
        onPress={() => useBattleStore.getState().answer(option.index)}
        style={({ pressed }) => [styles.option, compact && styles.gridOption, optionTones[tone],
          unavailable && styles.unavailable, pressed && !disabled && styles.pressed]}>
        <AppText maxFontSizeMultiplier={1.3} style={styles.letter}>{option.label}</AppText>
        <AppText maxFontSizeMultiplier={1.4} style={[styles.optionText, unavailable && styles.struck]}>{option.text}</AppText>
        {icon ? <View style={styles.answerIcon}><IconSlot name={icon} size="small" /></View> : null}
      </Pressable>
    </FeedbackPulse>
  );
}

const styles = StyleSheet.create({
  panel: { flexShrink: 0, gap: 8, padding: 10, backgroundColor: colors.surface, borderRadius: radii.large },
  compactPanel: { gap: 4, padding: 8 },
  spaciousPanel: { flexGrow: 1 },
  metadata: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  category: { flex: 1, fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
  clock: { fontSize: 14, lineHeight: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  urgent: { color: colors.damage },
  prompt: { fontSize: 21, lineHeight: 27, fontWeight: '700' },
  compactPrompt: { fontSize: 18, lineHeight: 23 },
  options: { gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%' },
  gridSlot: { width: '49%' },
  option: {
    minHeight: layout.touchTarget, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingLeft: 10, paddingRight: 28, borderRadius: radii.medium, borderWidth: 1,
    backgroundColor: colors.background,
  },
  gridOption: { minHeight: layout.touchTarget, flexGrow: 1 },
  letter: { fontSize: 12, lineHeight: 18, color: colors.gold, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 15, lineHeight: 20 },
  answerIcon: { position: 'absolute', right: 2, top: 2, transform: [{ scale: 0.75 }] },
  unavailable: { opacity: 0.55 },
  struck: { textDecorationLine: 'line-through' },
  pressed: { backgroundColor: colors.primaryAction },
});

const optionTones = StyleSheet.create({
  idle: { borderColor: colors.border },
  selected: { borderColor: colors.primary, backgroundColor: '#39285E' },
  correct: { borderColor: colors.success, backgroundColor: '#163C36' },
  wrong: { borderColor: colors.damage, backgroundColor: '#472638' },
});
