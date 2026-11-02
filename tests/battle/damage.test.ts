import { describe, expect, test } from '@jest/globals';

import {
  applyComboResult,
  BATTLE_RULES,
  calculateAttack,
  calculateRoundBonus,
  speedBonus,
  type AttackInput,
} from '../../src/game/battle';
import { NO_PASSIVES } from './helpers';

const attack = (overrides: Partial<AttackInput> = {}) =>
  calculateAttack({
    rules: NO_PASSIVES,
    kind: 'standard',
    elapsedMs: 1_000,
    timeMs: 12_000,
    attacker: { fighterId: 'arcane', passiveUsed: false, doubleDamageArmed: false },
    defender: { fighterId: 'shadow', passiveUsed: false, shieldArmed: false, hp: 100 },
    capRoom: 40,
    ...overrides,
  });

describe('speed bonus', () => {
  test.each([
    [0, 3],
    [2_999, 3],
    [3_000, 2],
    [5_999, 2],
    [6_000, 1],
    [8_999, 1],
    [9_000, 0],
    [11_999, 0],
    [16_000, 0],
    [-50, 3],
  ])('standard questions: %i ms -> +%i', (elapsed, bonus) => {
    expect(speedBonus(elapsed, 12_000, BATTLE_RULES.speedBonusMax)).toBe(bonus);
  });

  test.each([
    [0, 2],
    [3_999, 2],
    [4_000, 1],
    [7_999, 1],
    [8_000, 0],
    [11_999, 0],
  ])('clash questions: %i ms -> +%i', (elapsed, bonus) => {
    expect(speedBonus(elapsed, 12_000, BATTLE_RULES.clashSpeedBonusMax)).toBe(bonus);
  });
});

describe('attack damage', () => {
  test('base 10 plus speed bonus', () => {
    expect(attack()).toMatchObject({ base: 10, doubled: false, speedBonus: 3, raw: 13, damage: 13, blocked: false });
    expect(attack({ kind: 'clash', capRoom: null })).toMatchObject({ base: 10, speedBonus: 2, damage: 12 });
    expect(attack({ kind: 'sudden-death', capRoom: null, elapsedMs: 10_000 })).toMatchObject({ damage: 10 });
  });

  test('Double Damage doubles the base only and is consumed', () => {
    const hit = attack({ attacker: { fighterId: 'arcane', passiveUsed: false, doubleDamageArmed: true } });
    expect(hit).toMatchObject({ base: 20, doubled: true, speedBonus: 3, raw: 23, damage: 23 });
    expect(hit.consumes.doubleDamage).toBe(true);
  });

  test('Mind Shield blocks the whole event, including the doubled base, and is consumed', () => {
    const hit = attack({
      attacker: { fighterId: 'arcane', passiveUsed: false, doubleDamageArmed: true },
      defender: { fighterId: 'titan', passiveUsed: false, shieldArmed: true, hp: 100 },
      rules: BATTLE_RULES,
    });
    expect(hit).toMatchObject({ raw: 26, blocked: true, damage: 0, bulwarkReduction: 0, capReduction: 0 });
    // Shield, Double Damage and the attacker's passive are spent; Titan's Bulwark is not.
    expect(hit.consumes).toEqual({ doubleDamage: true, attackerPassive: true, shield: true, defenderPassive: false });
  });

  test('Mind Shield still blocks (and is spent on) a hit the round cap reduced to 0', () => {
    expect(attack({ capRoom: 0 })).toMatchObject({ damage: 0, capReduction: 13 });
    const blocked = attack({ capRoom: 0, defender: { fighterId: 'shadow', passiveUsed: false, shieldArmed: true, hp: 100 } });
    expect(blocked).toMatchObject({ blocked: true, damage: 0 });
    expect(blocked.consumes.shield).toBe(true);
  });

  test('the round cap limits standard damage; clash and sudden death are uncapped', () => {
    expect(attack({ capRoom: 5 })).toMatchObject({ raw: 13, capReduction: 8, damage: 5 });
    expect(attack({ capRoom: -3 })).toMatchObject({ capReduction: 13, damage: 0 });
    expect(attack({ kind: 'clash', capRoom: null })).toMatchObject({ capReduction: 0, damage: 12 });
  });

  test('damage never takes HP below 0', () => {
    expect(attack({ defender: { fighterId: 'shadow', passiveUsed: false, shieldArmed: false, hp: 4 } })).toMatchObject({
      raw: 13,
      damage: 4,
    });
    expect(attack({ defender: { fighterId: 'shadow', passiveUsed: false, shieldArmed: false, hp: 0 } }).damage).toBe(0);
  });

  test('Bulwark reduces the first unblocked hit by 3 before the cap', () => {
    const hit = attack({ rules: BATTLE_RULES, attacker: { fighterId: 'sylva', passiveUsed: false, doubleDamageArmed: false }, defender: { fighterId: 'titan', passiveUsed: false, shieldArmed: false, hp: 100 }, capRoom: 8 });
    expect(hit).toMatchObject({ raw: 13, bulwarkReduction: 3, capReduction: 2, damage: 8 });
    expect(hit.consumes.defenderPassive).toBe(true);
    const later = attack({ rules: BATTLE_RULES, attacker: { fighterId: 'sylva', passiveUsed: false, doubleDamageArmed: false }, defender: { fighterId: 'titan', passiveUsed: true, shieldArmed: false, hp: 100 } });
    expect(later).toMatchObject({ bulwarkReduction: 0, damage: 13 });
  });

  test.each([
    ['arcane', 'standard', 11_000, 3],
    ['shadow', 'standard', 5_999, 3],
    ['shadow', 'standard', 6_000, 0],
    ['sylva', 'standard', 1_000, 0],
    ['sylva', 'clash', 11_000, 3],
    ['titan', 'clash', 1_000, 0],
  ] as const)('%s offensive passive on a %s answer after %i ms: +%i', (fighterId, kind, elapsedMs, bonus) => {
    const hit = attack({
      rules: BATTLE_RULES,
      kind,
      elapsedMs,
      capRoom: kind === 'standard' ? 40 : null,
      attacker: { fighterId, passiveUsed: false, doubleDamageArmed: false },
    });
    expect(hit.passiveBonus).toBe(bonus);
    expect(hit.consumes.attackerPassive).toBe(bonus > 0);
  });

  test('passives do nothing once used or when disabled', () => {
    const titan = { fighterId: 'titan', passiveUsed: false, shieldArmed: false, hp: 100 } as const;
    expect(attack({ rules: BATTLE_RULES, attacker: { fighterId: 'arcane', passiveUsed: true, doubleDamageArmed: false } }).passiveBonus).toBe(0);
    expect(attack({ rules: NO_PASSIVES }).passiveBonus).toBe(0);
    expect(attack({ rules: NO_PASSIVES, defender: titan }).bulwarkReduction).toBe(0);
  });
});

describe('round bonuses', () => {
  test.each([
    [2, 1, { roundWinner: true, perfect: false, amount: 5 }],
    [3, 1, { roundWinner: true, perfect: true, amount: 10 }],
    [3, 3, { roundWinner: false, perfect: true, amount: 5 }],
    [1, 1, { roundWinner: false, perfect: false, amount: 0 }],
    [0, 0, { roundWinner: false, perfect: false, amount: 0 }],
    [1, 2, { roundWinner: false, perfect: false, amount: 0 }],
  ])('%i vs %i correct', (correct, opponentCorrect, expected) => {
    expect(calculateRoundBonus(BATTLE_RULES, correct, opponentCorrect, 40, 100)).toMatchObject({
      ...expected,
      damage: expected.amount,
      capReduction: 0,
    });
  });

  test('bonuses count toward the round cap and never take HP below 0', () => {
    expect(calculateRoundBonus(BATTLE_RULES, 3, 0, 1, 100)).toMatchObject({ amount: 10, capReduction: 9, damage: 1 });
    expect(calculateRoundBonus(BATTLE_RULES, 3, 0, 0, 100)).toMatchObject({ capReduction: 10, damage: 0 });
    expect(calculateRoundBonus(BATTLE_RULES, 3, 0, 40, 4)).toMatchObject({ damage: 4 });
  });
});

describe('combo', () => {
  test('correct answers extend the combo and track the best', () => {
    expect(applyComboResult({ combo: 2, bestCombo: 2, streakSaverArmed: false }, true)).toEqual({
      combo: 3,
      bestCombo: 3,
      streakSaverArmed: false,
      saved: false,
    });
    expect(applyComboResult({ combo: 0, bestCombo: 4, streakSaverArmed: true }, true)).toEqual({
      combo: 1,
      bestCombo: 4,
      streakSaverArmed: true,
      saved: false,
    });
  });

  test('a miss resets the combo unless Streak Saver is armed, which is then spent', () => {
    expect(applyComboResult({ combo: 3, bestCombo: 3, streakSaverArmed: false }, false)).toEqual({
      combo: 0,
      bestCombo: 3,
      streakSaverArmed: false,
      saved: false,
    });
    expect(applyComboResult({ combo: 3, bestCombo: 3, streakSaverArmed: true }, false)).toEqual({
      combo: 3,
      bestCombo: 3,
      streakSaverArmed: false,
      saved: true,
    });
  });
});
