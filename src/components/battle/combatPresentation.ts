import { SIDES, otherSide, type BattleView, type Side } from '../../game/battle';
import type { FighterId } from '../../game/types/fighter';
import { actionContact, actionDuration, type ActionCommand, type CombatAction } from '../fighters/combat/actions';
import { combatCues, type CombatCue } from './combatFeedback';

export type CombatPresentation = {
  key: string;
  fighters: Record<Side, FighterId>;
  commands: Record<Side, ActionCommand[]>;
  cues: CombatCue[];
  endMs: number;
  finished: boolean;
};

function duration(commands: Record<Side, ActionCommand[]>, cues: CombatCue[]) {
  return Math.max(0, ...SIDES.flatMap((side) =>
    commands[side].map((command) => command.atMs + actionDuration(command.action))),
  ...cues.map((cue) => cue.contactMs + 900));
}

/** Project only published combat events. No collision, damage or gameplay timers live here. */
export function battlePresentation(view: BattleView, outcomeOnly = false): CombatPresentation {
  const fighters = { player: view.player.fighterId, opponent: view.opponent.fighterId };
  const commands: Record<Side, ActionCommand[]> = { player: [], opponent: [] };
  const cues = outcomeOnly ? [] : combatCues(view);
  for (const cue of cues) {
    commands[cue.attacker].push({ action: cue.action, atMs: cue.delayMs });
    if (cue.blocked) {
      commands[cue.target].push({
        action: 'block', atMs: cue.contactMs - actionContact(fighters[cue.target], 'block'),
      });
    } else if (cue.damage > 0) {
      commands[cue.target].push({ action: cue.finishing ? 'fall' : 'knockback', atMs: cue.contactMs });
    }
  }
  if (view.outcome?.reason === 'knockout') {
    const loser = otherSide(view.outcome.winner);
    if (!commands[loser].some((command) => command.action === 'fall')) {
      commands[loser].push({ action: 'fall', atMs: outcomeOnly ? -actionDuration('fall') : 0 });
    }
  }
  for (const side of SIDES) commands[side].sort((a, b) => a.atMs - b.atMs);
  return {
    key: `${view.reveal?.key ?? view.question?.key ?? view.questionNumber}-${view.outcome?.atMs ?? 'active'}-${outcomeOnly}`,
    fighters, commands, cues, endMs: duration(commands, cues), finished: view.outcome !== null,
  };
}

/** Independent commands compose for every pairing; the lab never constructs or dispatches a match. */
export function actionPresentation(
  fighters: Record<Side, FighterId>, actions: Record<Side, CombatAction>, replay: number,
): CombatPresentation {
  const commands: Record<Side, ActionCommand[]> = { player: [], opponent: [] };
  const cues: CombatCue[] = [];
  for (const side of SIDES) {
    const action = actions[side], target = otherSide(side);
    if (action !== 'idle') commands[side].push({ action, atMs: 0 });
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
    fighters, commands, cues, endMs: duration(commands, cues),
    finished: actions.player === 'fall' || actions.opponent === 'fall',
  };
}
