import { getFighter } from '../../data/fighters';
import type { FighterId } from '../types/fighter';
import type { BattleRules } from './rules';

/**
 * Speed bonus from elapsed time since the question opened, on the base timer:
 * `max - floor(elapsed * (max + 1) / window)`, clamped to 0..max.
 */
export function speedBonus(elapsedMs: number, windowMs: number, max: number): number {
  const steps = Math.floor((Math.max(0, elapsedMs) * (max + 1)) / windowMs);
  return Math.max(0, Math.min(max, max - steps));
}

export function offensivePassiveBonus(
  rules: BattleRules,
  fighterId: FighterId,
  used: boolean,
  elapsedMs: number,
  timeMs: number,
): number {
  if (!rules.passivesEnabled || used) return 0;
  const { trigger, amount } = getFighter(fighterId).passive;
  if (trigger === 'first-correct-answer') return amount;
  if (trigger === 'first-fast-correct-answer') return elapsedMs < timeMs / 2 ? amount : 0;
  return 0;
}

export function defensivePassiveReduction(rules: BattleRules, fighterId: FighterId, used: boolean): number {
  if (!rules.passivesEnabled || used) return 0;
  const { trigger, amount } = getFighter(fighterId).passive;
  return trigger === 'first-incoming-hit' ? amount : 0;
}

export type AttackInput = {
  rules: BattleRules;
  elapsedMs: number;
  timeMs: number;
  attacker: { fighterId: FighterId; passiveUsed: boolean; doubleDamageArmed: boolean };
  defender: { fighterId: FighterId; passiveUsed: boolean; shieldArmed: boolean; hp: number };
};

export type AttackBreakdown = {
  base: number;
  doubled: boolean;
  speedBonus: number;
  passiveBonus: number;
  raw: number;
  blocked: boolean;
  bulwarkReduction: number;
  damage: number;
  consumes: { doubleDamage: boolean; attackerPassive: boolean; shield: boolean; defenderPassive: boolean };
};

/**
 * One attack event: raw = base (x Double Damage) + speed + attacker passive; then Mind Shield
 * blocks it entirely, else Bulwark, then HP (never below 0).
 */
export function calculateAttack({ rules, elapsedMs, timeMs, attacker, defender }: AttackInput): AttackBreakdown {
  const doubled = attacker.doubleDamageArmed;
  const base = doubled ? rules.baseDamage * rules.doubleDamageMultiplier : rules.baseDamage;
  const speed = speedBonus(elapsedMs, timeMs, rules.speedBonusMax);
  const passiveBonus = offensivePassiveBonus(rules, attacker.fighterId, attacker.passiveUsed, elapsedMs, timeMs);
  const raw = base + speed + passiveBonus;
  const consumes = { doubleDamage: doubled, attackerPassive: passiveBonus > 0, shield: false, defenderPassive: false };

  if (defender.shieldArmed) {
    return {
      base, doubled, speedBonus: speed, passiveBonus, raw,
      blocked: true, bulwarkReduction: 0, damage: 0,
      consumes: { ...consumes, shield: true },
    };
  }

  const bulwark = defensivePassiveReduction(rules, defender.fighterId, defender.passiveUsed);
  const bulwarkReduction = Math.min(bulwark, raw);
  const mitigated = raw - bulwarkReduction;
  return {
    base, doubled, speedBonus: speed, passiveBonus, raw,
    blocked: false,
    bulwarkReduction,
    damage: Math.min(mitigated, Math.max(0, defender.hp)),
    consumes: { ...consumes, defenderPassive: bulwark > 0 },
  };
}
