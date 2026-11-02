import { otherSide, type BattleView, type Side } from '../../game/battle';

export type CombatCue = {
  key: string;
  attacker: Side;
  target: Side;
  damage: number;
  blocked: boolean;
  finishing: boolean;
  delayMs: number;
};

/** Read published resolutions only. Never infer a hit from an answer or an HP difference. */
export function combatCues(view: BattleView): CombatCue[] {
  const reveal = view.reveal;
  if (!reveal) return [];
  return reveal.hits.filter((hit) => !hit.void).map((hit, index) => ({
      key: `${reveal.key}-hit-${index}`,
      attacker: hit.attacker,
      target: otherSide(hit.attacker),
      damage: hit.damage,
      blocked: hit.blocked,
      finishing: view.outcome?.reason === 'knockout' && view.outcome.winner === hit.attacker && hit.targetHp === 0,
      delayMs: index * 360,
    }));
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
