import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { FighterRoster } from '../../src/components/fighters/FighterRoster';
import { MatchSetupScreen } from '../../src/components/navigation/MatchSetupScreen';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { Button } from '../../src/components/ui';
import { getFighter } from '../../src/data/fighters';
import { isDraftComplete } from '../../src/features/category-draft/draft';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import type { FighterId } from '../../src/game/types/fighter';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';

export default function FighterSelect() {
  const router = useRouter();
  const draftComplete = useMatchSetupStore((state) => isDraftComplete(state.draft));
  const matchFighter = useMatchSetupStore((state) => state.fighterId);
  const confirmFighter = useMatchSetupStore((state) => state.confirmFighter);
  const playerReady = usePlayerStore((state) => state.status === 'ready');
  const savedFighter = usePlayerStore((state) => state.fighterId);
  const saveFighter = usePlayerStore((state) => state.saveFighter);
  const collectionIds = usePlayerStore((state) => state.collectionIds);
  const [saving, setSaving] = useState(false);
  const [choice, setChoice] = useState<FighterId | null>(null);
  const saveGeneration = useRef(0);
  useFocusEffect(useCallback(() => () => { saveGeneration.current += 1; }, []));
  const selected = choice ?? matchFighter ?? savedFighter;

  if (!draftComplete) {
    return <MatchSetupScreen step="fighterSelect" blocked="Complete the category draft before choosing a fighter." />;
  }

  return (
    <MatchSetupScreen step="fighterSelect" footer={playerReady ? <Button
            label={`Confirm ${getFighter(selected).name}`}
            loading={saving}
            disabled={!collectionIds.includes(`fighter:${selected}`)}
            onPress={async () => {
              const generation = saveGeneration.current;
              setSaving(true);
              try {
                if (!await saveFighter(selected)) return;
                if (generation !== saveGeneration.current) return;
                confirmFighter(selected);
                router.push(routes.loadout);
              } finally { setSaving(false); }
            }}
          /> : null}>
      <PlayerDataNotice />
      {playerReady ? <FighterRoster selected={selected} ownedIds={collectionIds} disabled={saving} onSelect={setChoice} /> : null}
    </MatchSetupScreen>
  );
}
