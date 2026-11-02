export type ComboState = { combo: number; bestCombo: number; streakSaverArmed: boolean };

/**
 * Combo is tracked only (no damage effect). A correct final answer extends it; a miss resets it
 * unless Streak Saver is armed, which is then consumed and the combo kept.
 */
export function applyComboResult(state: ComboState, correct: boolean): ComboState & { saved: boolean } {
  if (correct) {
    const combo = state.combo + 1;
    return { combo, bestCombo: Math.max(state.bestCombo, combo), streakSaverArmed: state.streakSaverArmed, saved: false };
  }
  if (state.streakSaverArmed) return { ...state, streakSaverArmed: false, saved: true };
  return { ...state, combo: 0, saved: false };
}
