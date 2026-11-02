import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MatchSetupScreen } from '../../src/components/navigation/MatchSetupScreen';
import { AppText, Badge, Button, Card, IconSlot, Panel, SelectableCard } from '../../src/components/ui';
import { CATEGORIES, getCategory } from '../../src/data/categories';
import { availableCategories } from '../../src/features/category-draft/draft';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import type { CategoryId, DraftState } from '../../src/game/types/match';
import { routes } from '../../src/navigation/routes';
import { spacing } from '../../src/theme';

function categoryStatus(draft: DraftState, id: CategoryId, opponentName: string) {
  if (id === draft.playerBan) return 'Banned by you';
  if (id === draft.opponentBan) return `Banned by ${opponentName}`;
  if (id === draft.playerPick) return 'Picked by you';
  if (id === draft.opponentPick) return `Picked by ${opponentName}`;
  return null;
}

export default function CategoryDraft() {
  const router = useRouter();
  const match = useMatchSetupStore((state) => state.match);
  const draft = useMatchSetupStore((state) => state.draft);
  const ban = useMatchSetupStore((state) => state.ban);
  const pick = useMatchSetupStore((state) => state.pick);
  const [choice, setChoice] = useState<CategoryId | null>(null);

  if (!match || !draft) {
    return <MatchSetupScreen step="categoryDraft" blocked="Find an opponent before drafting categories." />;
  }

  const opponentName = match.opponent.name;
  const available = availableCategories(draft);
  const banning = draft.stage === 'ban';

  const confirm = () => {
    if (!choice) return;
    if (banning) ban(choice);
    else pick(choice);
    setChoice(null);
  };

  return (
    <MatchSetupScreen step="categoryDraft">
      {draft.playerBan && draft.opponentBan ? (
        <Panel>
          <AppText variant="label">Bans</AppText>
          <AppText tone="secondary">
            You banned {getCategory(draft.playerBan).name}. {opponentName} banned{' '}
            {getCategory(draft.opponentBan).name}.
          </AppText>
        </Panel>
      ) : null}
      {draft.stage === 'complete' ? (
        <>
          <Card title="Match categories" description="Questions from these categories are mixed throughout the battle.">
            {draft.categories.map((category) => (
              <View key={category.categoryId} style={styles.row}>
                <IconSlot name={getCategory(category.categoryId).icon} size="small" />
                <AppText variant="label" style={styles.fill}>
                  {getCategory(category.categoryId).name}
                </AppText>
                <Badge
                  label={
                    category.source === 'player'
                      ? 'Your pick'
                      : category.source === 'opponent'
                        ? `${opponentName}'s pick`
                        : 'System'
                  }
                />
              </View>
            ))}
          </Card>
          <Button label="Continue to fighter selection" onPress={() => router.push(routes.fighterSelect)} />
        </>
      ) : (
        <>
          <AppText variant="heading">{banning ? 'Ban one category' : 'Pick one category'}</AppText>
          <View style={styles.grid}>
            {CATEGORIES.map((category) => {
              const status = categoryStatus(draft, category.id, opponentName);
              return (
                <SelectableCard
                  key={category.id}
                  label={status ? `${category.name}. ${status}` : category.name}
                  selected={choice === category.id}
                  disabled={!available.includes(category.id)}
                  onPress={() => setChoice(category.id)}
                  style={styles.tile}
                >
                  <IconSlot name={category.icon} size="small" />
                  <AppText variant="label">{category.name}</AppText>
                  {status ? <Badge label={status} tone="danger" /> : null}
                </SelectableCard>
              );
            })}
          </View>
          <Button
            label={banning ? 'Confirm ban' : 'Confirm pick'}
            disabled={!choice}
            onPress={confirm}
          />
        </>
      )}
    </MatchSetupScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  fill: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  tile: { flexGrow: 1, flexBasis: '45%' },
});
