import { otherSide, type BattleView, type Side } from '../../game/battle';
import { actionContact, type CombatAction } from '../fighters/combat/actions';

export type CombatCue = {
  key: string;
  attacker: Side;
  target: Side;
  damage: number;
  blocked: boolean;
  finishing: boolean;
  delayMs: number;
  contactMs: number;
  action: Extract<CombatAction, 'attack' | 'special'>;
};

/** Read published resolutions only. Never infer a hit from an answer or an HP difference. */
export function combatCues(view: BattleView): CombatCue[] {
  const reveal = view.reveal;
  if (!reveal) return [];
  let cursor = 0;
  return reveal.hits.filter((hit) => !hit.void).map((hit, index) => {
    const target = otherSide(hit.attacker);
    const finishing = view.outcome?.reason === 'knockout' && view.outcome.winner === hit.attacker && hit.targetHp === 0;
    const action = finishing || hit.doubled || (reveal.results[hit.attacker]?.comboAfter ?? 0) >= 3
      ? 'special' : 'attack';
    const contact = actionContact(view[hit.attacker].fighterId, action);
    const guard = hit.blocked ? actionContact(view[target].fighterId, 'block') : 0;
    const contactMs = cursor + Math.max(contact, guard);
    const delayMs = contactMs - contact;
    cursor = contactMs + 180;
    return {
      key: `${reveal.key}-hit-${index}`,
      attacker: hit.attacker,
      target,
      damage: hit.damage,
      blocked: hit.blocked,
      finishing,
      delayMs,
      contactMs,
      action,
    };
  });
}

export function transitionFeedback(view: BattleView) {
  if (view.outcome) {
    const label = view.outcome.winner === 'player' ? 'Victory' : 'Defeat';
    return {
      key: `outcome-${view.outcome.atMs}`,
      label: view.outcome.reason === 'knockout' ? `Knockout - ${label}` : label,
    };
  }
  return { key: `question-${view.questionNumber}`, label: `Question ${view.questionNumber} - Fight!` };
}
