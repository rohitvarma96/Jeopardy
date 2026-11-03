export type FighterId = 'arcane' | 'shadow' | 'sylva' | 'titan' | 'ember' | 'frost';

export type PassiveTrigger =
  | 'first-correct-answer'
  | 'first-fast-correct-answer'
  | 'first-incoming-hit';

export type FighterPassive = {
  name: string;
  description: string;
  trigger: PassiveTrigger;
  /** Damage added (offense) or prevented (defense), once per match. */
  amount: number;
};

export type Fighter = {
  id: FighterId;
  name: string;
  role: string;
  identity: string;
  passive: FighterPassive;
};
