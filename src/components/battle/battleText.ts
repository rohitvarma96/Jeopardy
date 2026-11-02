import { getBooster } from '../../data/boosters';
import type { AnswerOutcome, BattleOutcome, Hit, Side } from '../../game/battle';
import type { BoosterId } from '../../game/types/booster';

export type Names = Record<Side, string>;

/** "You" / opponent name as a sentence subject, and the matching object form. */
export const subject = (side: Side, names: Names) => (side === 'player' ? 'You' : names.opponent);
export const object = (side: Side, names: Names) => (side === 'player' ? 'you' : names.opponent);

export function outcomeText(outcome: AnswerOutcome) {
  return outcome === 'correct' ? 'Correct' : outcome === 'wrong' ? 'Wrong answer' : "Time's up";
}

export function hitText(hit: Hit, names: Names): string {
  const attacker = subject(hit.attacker, names);
  const defender = object(hit.attacker === 'player' ? 'opponent' : 'player', names);
  if (hit.void) return `${attacker} also answered correctly, but the match had already ended.`;
  const parts = [`${hit.base} base${hit.doubled ? ' (Double Damage)' : ''}`, `${hit.speedBonus} speed`];
  if (hit.passiveBonus > 0) parts.push(`${hit.passiveBonus} passive`);
  if (hit.blocked) {
    return `Mind Shield blocked ${hit.attacker === 'player' ? 'your' : `${names.opponent}'s`} attack (${hit.raw} damage prevented).`;
  }
  const reductions = hit.bulwarkReduction > 0 ? ` - ${hit.bulwarkReduction} Bulwark` : '';
  return `${attacker} hit ${defender} for ${hit.damage} (${parts.join(' + ')}${reductions}).`;
}

export function boosterRevealText(side: Side, boosterId: BoosterId, names: Names) {
  const name = getBooster(boosterId).name;
  return side === 'player' ? `You used ${name}.` : `${names.opponent} used ${name}.`;
}

export function endText(outcome: BattleOutcome, names: Names): string {
  const won = outcome.winner === 'player';
  switch (outcome.reason) {
    case 'knockout':
      return won ? `Knockout! ${names.opponent} is out of health.` : 'Knockout. You ran out of health.';
    case 'hp-lead':
      return won
        ? 'You finished with more health.'
        : `${names.opponent} finished with more health.`;
    case 'sudden-death':
      return won ? 'You won the sudden-death question.' : `${names.opponent} won the sudden-death question.`;
    case 'forfeit':
      return won ? `${names.opponent} forfeited the match.` : 'You forfeited the match.';
  }
}
