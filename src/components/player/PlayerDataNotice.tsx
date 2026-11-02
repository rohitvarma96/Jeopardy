import { usePlayerStore } from '../../store/player-store';
import { useBattleStore } from '../../features/battle/store';
import { AppText, Button, LoadingState, Panel } from '../ui';

export function PlayerDataNotice() {
  const status = usePlayerStore((state) => state.status);
  const error = usePlayerStore((state) => state.error);
  const hydrate = usePlayerStore((state) => state.hydrate);
  const matches = usePlayerStore((state) => state.matches);
  const battle = useBattleStore((state) => state.battle);
  const unsaved = battle?.outcome && !matches.some((match) => match.matchId === battle.setup.matchId);
  if (status === 'idle' || status === 'loading') return <LoadingState label="Loading local player data..." />;
  if (!error && !unsaved) return null;
  return (
    <Panel>
      <AppText accessibilityRole={error ? 'alert' : undefined}>{error ?? 'Saving your finished match before another battle...'}</AppText>
      {status === 'error' ? <Button label="Retry loading player data" onPress={() => void hydrate()} /> : null}
      {status === 'ready' && unsaved && battle ? (
        <Button label="Retry saving finished match" onPress={() => void usePlayerStore.getState().claimMatch(battle)} />
      ) : null}
    </Panel>
  );
}
