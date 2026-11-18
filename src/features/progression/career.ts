import type { RewardRecord } from '../../game/rewards';
import type { FighterId } from '../../game/types/fighter';

export function careerStats(matches: readonly RewardRecord[]) {
  const wins = matches.filter((match) => match.outcome.winner === 'player').length;
  const correct = matches.reduce((total, match) => total + match.fighters.player.stats.correct, 0);
  const questions = matches.reduce((total, match) => {
    const stats = match.fighters.player.stats;
    return total + stats.correct + stats.wrong + stats.timeouts;
  }, 0);
  return {
    matches: matches.length, wins, losses: matches.length - wins, correct,
    accuracy: questions ? Math.round(correct / questions * 100) : null,
    damage: matches.reduce((total, match) => total + match.fighters.player.stats.damageDealt, 0),
    bestCombo: matches.reduce((best, match) => Math.max(best, match.fighters.player.bestCombo), 0),
  };
}

export function brawlerRecord(matches: readonly RewardRecord[], fighterId: FighterId) {
  return careerStats(matches.filter((match) => match.fighters.player.fighterId === fighterId));
}

export function careerMilestones(matches: readonly RewardRecord[], ownedBrawlers: number) {
  const stats = careerStats(matches);
  return [
    { id: 'first-duel', label: 'First full duel', value: matches.filter((match) => match.outcome.reason !== 'forfeit').length, goal: 1 },
    { id: 'first-win', label: 'First victory', value: stats.wins, goal: 1 },
    { id: 'three-combo', label: 'Combo artist', value: stats.bestCombo, goal: 3 },
    { id: 'collector', label: 'Build your roster', value: ownedBrawlers, goal: 6 },
  ];
}
