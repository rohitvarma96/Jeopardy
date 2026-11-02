import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { MatchSetupScreen } from '../../src/components/navigation/MatchSetupScreen';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Button, IconSlot, SelectableCard } from '../../src/components/ui';
import { BOOSTERS, isBattleBoosterId } from '../../src/data/boosters';
import { useBattleStore } from '../../src/features/battle/store';
import { isDraftComplete } from '../../src/features/category-draft/draft';
import { loadoutError, toggleBooster } from '../../src/features/loadout/loadout';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import { MATCH_RULES } from '../../src/game/rules';
import type { BoosterId } from '../../src/game/types/booster';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';

export default function Loadout() {
  const router = useRouter();
  const canEquip = useMatchSetupStore((state) => isDraftComplete(state.draft) && state.fighterId !== null);
  const matchLoadout = useMatchSetupStore((state) => state.boosterIds);
  const confirmLoadout = useMatchSetupStore((state) => state.confirmLoadout);
  const playerReady = usePlayerStore((state) => state.status === 'ready');
  const savedLoadout = usePlayerStore((state) => state.boosterIds);
  const saveLoadout = usePlayerStore((state) => state.saveLoadout);
  const collectionIds = usePlayerStore((state) => state.collectionIds);
  const [saving, setSaving] = useState(false);
  const startBattle = useBattleStore((state) => state.start);
  const [choice, setChoice] = useState<BoosterId[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const saveGeneration = useRef(0);
  useFocusEffect(useCallback(() => () => { saveGeneration.current += 1; }, []));
  const selection: readonly BoosterId[] = choice ?? matchLoadout ?? savedLoadout;
  const full = selection.length >= MATCH_RULES.loadoutSize;
  const problem = loadoutError(selection);

  if (!canEquip) {
    return <MatchSetupScreen step="loadout" blocked="Choose a fighter before equipping boosters." />;
  }

  const enterBattle = async () => {
    const generation = saveGeneration.current;
    const result = confirmLoadout(selection);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    try {
      if (!await saveLoadout(result.setup.boosterIds)) return;
      if (generation !== saveGeneration.current) return;
      startBattle(result.setup);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Unable to start the battle.']);
      return;
    } finally { setSaving(false); }
    setErrors([]);
    // The battle replaces the setup flow, so Back cannot return to a used draft.
    router.dismissAll();
    router.push(routes.battleArena);
  };

  return (
    <MatchSetupScreen step="loadout">
      {playerReady ? (
        <>
          <AppText variant="label" accessibilityLiveRegion="polite">
            {selection.length} / {MATCH_RULES.loadoutSize} boosters selected
          </AppText>
          {BOOSTERS.map((booster) => {
            const selected = selection.includes(booster.id);
            const available = isBattleBoosterId(booster.id);
            return (
              <SelectableCard
                key={booster.id}
                role="checkbox"
                label={booster.name}
                hint={!available ? 'Unavailable in continuous battles. Remove this booster if selected.'
                  : selected || !full ? booster.effect : 'Loadout full. Remove a booster first.'}
                selected={selected}
                disabled={saving || !collectionIds.includes(`booster:${booster.id}`) || (!selected && (full || !available))}
                onPress={() => setChoice(toggleBooster(selection, booster.id))}
              >
                <IconSlot name={booster.icon} size="small" />
                <AppText variant="label">{booster.name}</AppText>
                <AppText variant="caption" tone="secondary">{booster.effect}</AppText>
                {!collectionIds.includes(`booster:${booster.id}`) ? <AppText variant="caption">Locked - collect from a capsule</AppText> : null}
              </SelectableCard>
            );
          })}
          {problem ? <AppText tone="secondary">{problem}</AppText> : null}
          {errors.map((error) => (
            <AppText key={error} accessibilityRole="alert">{error}</AppText>
          ))}
          <PlayerDataNotice />
          <Button label="Save loadout and enter battle" loading={saving} disabled={problem !== null} onPress={() => void enterBattle()} />
        </>
      ) : (
        <PlayerDataNotice />
      )}
    </MatchSetupScreen>
  );
}
