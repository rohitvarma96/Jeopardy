export type BoosterId =
  | '50-50'
  | 'extra-time'
  | 'second-chance'
  | 'double-damage'
  | 'mind-shield'
  | 'streak-saver';

export type Booster = {
  id: BoosterId;
  name: string;
  effect: string;
};

export type BoosterLoadout = readonly [BoosterId, BoosterId, BoosterId];
