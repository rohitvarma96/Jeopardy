import { SIDES, otherSide, type BattleView, type Side } from '../../game/battle';
import type { FighterId } from '../../game/types/fighter';
import { actionContact, actionDuration, type ActionCommand, type CombatAction } from '../fighters/combat/actions';
import { combatCues, type CombatCue } from './combatFeedback';
import { KO_END_MS } from './signature-motion';

export type CombatPresentation = {
  key: string;
  fighters: Record<Side, FighterId>;
  commands: Record<Side, ActionCommand[]>;
  cues: CombatCue[];
  endMs: number;
  finished: boolean;
  defeats: Partial<Record<Side, number>>;
  preview?: boolean;
};

function duration(commands: Record<Side, ActionCommand[]>, cues: CombatCue[], defeats: Partial<Record<Side, number>>) {
  return Math.max(0, ...SIDES.flatMap((side) =>
    commands[side].map((command) => command.atMs + actionDuration(command.action))),
  ...cues.map((cue) => cue.contactMs + 900),
  ...Object.values(defeats).map(time => time + KO_END_MS));
}

/** Project only published combat events. No collision, damage or gameplay timers live here. */
export function battlePresentation(view: BattleView, outcomeOnly = false): CombatPresentation {
  const fighters = { player: view.player.fighterId, opponent: view.opponent.fighterId };
  const commands: Record<Side, ActionCommand[]> = { player: [], opponent: [] };
  const cues = outcomeOnly || view.outcome?.reason === 'forfeit' ? [] : combatCues(view);
  const defeats: Partial<Record<Side, number>> = {};
  for (const cue of cues) {
    commands[cue.attacker].push({ action: cue.action, atMs: cue.delayMs });
    if (cue.blocked) {
      commands[cue.target].push({
        action: 'block', atMs: cue.contactMs - actionContact(fighters[cue.target], 'block'),
      });
    } else if (cue.damage > 0) {
      if (cue.finishing) defeats[cue.target] = cue.contactMs;
      else commands[cue.target].push({ action: 'knockback', atMs: cue.contactMs });
    }
  }
  if (view.outcome?.reason === 'knockout') {
    const loser = otherSide(view.outcome.winner);
    if (defeats[loser] === undefined) defeats[loser] = outcomeOnly ? -KO_END_MS : 0;
  }
  for (const side of SIDES) commands[side].sort((a, b) => a.atMs - b.atMs);
  return {
    key: `${view.reveal?.key ?? view.question?.key ?? view.questionNumber}-${view.outcome?.atMs ?? 'active'}-${outcomeOnly}`,
    fighters, commands, cues, defeats, endMs: duration(commands, cues, defeats), finished: view.outcome !== null,
  };
}

/** Independent commands compose for every pairing; the lab never constructs or dispatches a match. */
export function actionPresentation(
  fighters: Record<Side, FighterId>, actions: Record<Side, CombatAction>, replay: number,
): CombatPresentation {
  const commands: Record<Side, ActionCommand[]> = { player: [], opponent: [] };
  const cues: CombatCue[] = [];
  const defeats: Partial<Record<Side, number>> = {};
  for (const side of SIDES) {
    const action = actions[side], target = otherSide(side);
    if (action === 'fall') defeats[side] = 0;
    else if (action !== 'idle') commands[side].push({ action, atMs: 0 });
    if (action !== 'attack' && action !== 'special') continue;
    const blocked = actions[target] === 'block';
    const contact = actionContact(fighters[side], action);
    const guard = blocked ? actionContact(fighters[target], 'block') : 0;
    const contactMs = Math.max(contact, guard);
    commands[side][0].atMs = contactMs - contact;
    cues.push({
      key: `study-${replay}-${side}`, attacker: side, target, action, damage: 0,
      blocked, finishing: false, delayMs: contactMs - contact, contactMs,
    });
  }
  for (const cue of cues) {
    if (cue.blocked) commands[cue.target] = [{
      action: 'block', atMs: cue.contactMs - actionContact(fighters[cue.target], 'block'),
    }];
  }
  return {
    key: `study-${replay}-${fighters.player}-${fighters.opponent}-${actions.player}-${actions.opponent}`,
    fighters, commands, cues, defeats, endMs: duration(commands, cues, defeats),
    finished: actions.player === 'fall' || actions.opponent === 'fall', preview: true,
  };
}
