import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '../../src/components/ui';
import { SceneAction, SceneText, worldColors } from '../../src/components/world/SceneControls';
import { WorldIcon } from '../../src/components/world/WorldIcon';
import { WorldScene } from '../../src/components/world/WorldScene';
import { PrintHeadline } from '../../src/components/world/PrintHeadline';
import { CATEGORIES, getCategory } from '../../src/data/categories';
import { availableCategories } from '../../src/features/category-draft/draft';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import type { CategoryId } from '../../src/game/types/match';
import { exitPreview } from '../../src/navigation/exitPreview';
import { routes } from '../../src/navigation/routes';

export default function CategoryDraft() {
  const router = useRouter();
  const match = useMatchSetupStore((state) => state.match);
  const draft = useMatchSetupStore((state) => state.draft);
  const [choice, setChoice] = useState<CategoryId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 720 || fontScale >= 1.5;
  const leave = useCallback(() => {
    useMatchSetupStore.getState().reset();
    exitPreview(routes.arena);
  }, []);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { leave(); return true; });
    return () => subscription.remove();
  }, [leave]));
  const complete = draft?.stage === 'complete';
  const available = draft ? availableCategories(draft) : [];
  const proceed = () => {
    const prepared = useMatchSetupStore.getState().prepareSavedEquipment();
    if (!prepared.ok) { setError(prepared.errors.join(' ')); return; }
    router.replace(routes.versus);
  };
  const commit = () => {
    if (!choice || !draft) throw new Error('Choose an available category before committing the draft.');
    if (draft.stage === 'ban') useMatchSetupStore.getState().ban(choice);
    else useMatchSetupStore.getState().pick(choice);
    setChoice(null);
  };
  return <WorldScene title="Category draft" utilities={false} onBack={leave} backLabel="Cancel draft"
    footer={match && draft ? <SceneAction label={complete ? 'Enter arena' : draft.stage === 'ban' ? 'Ban' : 'Pick'}
      accessibilityLabel={complete ? 'Enter arena' : draft.stage === 'ban' ? 'Confirm ban' : 'Confirm pick'}
      icon={complete ? 'deploy' : draft.stage === 'ban' ? 'ban' : 'pick'}
      variant="signal" style={complete ? styles.enter : styles.commit}
      disabled={!complete && choice === null} onPress={complete ? proceed : commit} /> : undefined}>
    <Stack.Screen options={{ gestureEnabled: false }} />
    {!match || !draft ? <View style={styles.center}><SceneText>Find an opponent before drafting categories.</SceneText>
      <SceneAction label="Arena home" icon="arena" onPress={leave} /></View> : <>
      <View style={styles.heading}>
        <PrintHeadline label={complete ? 'MIX LOCKED.' : draft.stage === 'ban' ? 'BAN ONE.' : 'PICK ONE.'}
          compact={compact} pink={draft.stage === 'ban'} />
        <SceneText muted>{complete ? 'Five categories. One shared battle sequence.' : `YOU / VS / ${match.opponent.name}`}</SceneText>
      </View>
      <View style={[styles.grid, !compact && styles.spaciousGrid]}>
        {CATEGORIES.map((category) => {
          const banned = category.id === draft.playerBan || category.id === draft.opponentBan;
          const included = draft.categories.some((entry) => entry.categoryId === category.id);
          const selected = choice === category.id;
          const status = banned ? 'BANNED' : complete && included ? 'IN MIX' : selected ? 'SELECTED' : '';
          return <Pressable key={category.id} accessibilityRole="radio" accessibilityLabel={`${category.name}${status ? `. ${status}` : ''}`}
            accessibilityState={{ checked: selected || (complete && included), disabled: complete || !available.includes(category.id) }}
            disabled={complete || !available.includes(category.id)} onPress={() => setChoice(category.id)}
            style={[styles.category, selected && styles.selected, banned && styles.banned, complete && included && styles.selected]}>
            <WorldIcon name={category.id} size={compact ? 27 : 36}
              color={banned ? '#FF7FAB' : selected || included ? worldColors.acid : worldColors.paper} />
            <AppText allowFontScaling={false} style={styles.categoryName}>{category.name === 'Movies & TV' ? 'SCREEN' : category.name.toUpperCase()}</AppText>
            <AppText allowFontScaling={false} style={[styles.categoryStatus, banned && { color: '#FF7FAB' }]}>{status || ' '}</AppText>
            {banned ? <View pointerEvents="none" style={styles.banLine} /> : null}
          </Pressable>;
        })}
      </View>
      <View style={styles.inspection}>
        <AppText maxFontSizeMultiplier={1.2} style={styles.choice}>{choice ? getCategory(choice).name.toUpperCase() : complete ? 'PREPARATION READY' : 'CHOOSE A CREST'}</AppText>
        <SceneText muted>{draft.playerBan && draft.opponentBan
          ? `Bans: ${getCategory(draft.playerBan).name} / ${getCategory(draft.opponentBan).name}`
          : 'Your ban removes one category from the battle.'}</SceneText>
        {complete && !compact ? <SceneText muted>Saved Brawler and three powers carry into the duel. No repeated setup forms.</SceneText> : null}
      </View>
      {error ? <><AppText accessibilityRole="alert" style={styles.error}>{error}</AppText>
        <SceneAction label="Repair equipment" icon="armory" variant="outline" onPress={() => { leave(); router.navigate(routes.armory); }} /></> : null}
    </>}
  </WorldScene>;
}
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: 20 },
  heading: { gap: 5, paddingBottom: 8 },
  grid: { flex: 1, minHeight: 0, flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 8, alignContent: 'center' },
  spaciousGrid: { paddingVertical: 10 },
  category: { width: '23.5%', minHeight: 84, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: '#10131ADD', borderWidth: 1, borderColor: '#748398' },
  selected: { borderWidth: 2, borderColor: worldColors.acid, backgroundColor: '#EEFA3614' },
  banned: { opacity: 0.6, borderColor: worldColors.pink, backgroundColor: '#FF287B16' },
  categoryName: { color: worldColors.paper, fontSize: 8, lineHeight: 12, textAlign: 'center' },
  categoryStatus: { color: worldColors.acid, fontSize: 6, lineHeight: 9 },
  banLine: { position: 'absolute', top: '39%', left: '12%', width: '80%', height: 2, backgroundColor: worldColors.pink, transform: [{ rotate: '-32deg' }] },
  inspection: { paddingVertical: 10, gap: 5 },
  choice: { fontFamily: 'BarlowCondensed-ExtraBold', color: worldColors.acid, fontSize: 26, lineHeight: 29 },
  commit: { width: '56%', minWidth: 168, maxWidth: 240, alignSelf: 'center' },
  enter: { width: '100%', maxWidth: 280, alignSelf: 'center' },
  error: { color: '#FFB7CF', fontSize: 12, lineHeight: 17 },
});
