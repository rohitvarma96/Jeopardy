/**
 * Tunable combat values (CTX-04, CTX-05). Interpretations are documented in
 * docs/GAMEPLAY_DECISIONS.md; the engine reads only these values.
 */
export type BattleRules = {
  startingHp: number;
  questionTimeMs: number;
  baseDamage: number;
  speedBonusMax: number;
  extraTimeMs: number;
  doubleDamageMultiplier: number;
  fiftyFiftyRemoves: number;
  passivesEnabled: boolean;
};

export const BATTLE_RULES: BattleRules = {
  startingHp: 100,
  questionTimeMs: 12_000,
  baseDamage: 10,
  speedBonusMax: 3,
  extraTimeMs: 5_000,
  doubleDamageMultiplier: 2,
  fiftyFiftyRemoves: 2,
  passivesEnabled: true,
};
