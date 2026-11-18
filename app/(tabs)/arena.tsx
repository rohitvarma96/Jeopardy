import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FighterArt } from '../../src/components/fighters/FighterArt';
import { HeroPicker } from '../../src/components/fighters/HeroPicker';
import { PlayerAvatar } from '../../src/components/player/PlayerAvatar';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { Screen } from '../../src/components/ui';
import { PagedItems } from '../../src/components/ui/PagedItems';
import { VoltButton, VoltMotif, VoltPanel, VoltProgress, VoltSectionLabel, VoltText } from '../../src/components/volt';
import { getBooster } from '../../src/data/boosters';
import { getFighter } from '../../src/data/fighters';
import { useBattleStore } from '../../src/features/battle/store';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';
import { volt } from '../../src/theme';

export default function Arena() {
  const router = useRouter();
  const [choosingHero, setChoosingHero] = useState(false);
  const [kitOpen, setKitOpen] = useState(false);
  const [stageHeight, setStageHeight] = useState(160);
  const { width, fontScale } = useWindowDimensions();
  const status = usePlayerStore((state) => state.status);
  const fighter = getFighter(usePlayerStore((state) => state.fighterId));
  const player = usePlayerStore((state) => state.profile);
  const avatarId = usePlayerStore((state) => state.avatarId);
  const boosterIds = usePlayerStore((state) => state.boosterIds);
  const matches = usePlayerStore((state) => state.matches);
  const battle = useBattleStore((state) => state.battle);
  const ready = status === 'ready';
  const unsavedMatch = battle?.outcome && !matches.some((match) => match.matchId === battle.setup.matchId);
  const wide = width >= volt.layout.wide && fontScale < 1.6;

  const kit = ready ? <VoltPanel style={styles.kit}>
    <VoltSectionLabel index="02" label="Battle kit" />
    <VoltText variant="heading">Your loadout</VoltText>
    <PagedItems items={boosterIds} keyExtractor={(id) => id} label="Battle kit" itemHeight={92} renderItem={(id) => {
      const booster = getBooster(id);
      return <View key={id} style={styles.booster}>
        <Ionicons name={booster.icon} size={22} color={volt.color.acid} accessible={false} />
        <View style={styles.grow}>
          <VoltText variant="label">{booster.name}</VoltText>
          <VoltText tone="muted">{booster.effect}</VoltText>
        </View>
      </View>;
    }} />
    <VoltText variant="micro" tone="muted">Choose boosters during match setup.</VoltText>
  </VoltPanel> : null;

  return <>
    <Screen title="Arena" description="Local progression - offline prototype" tabScreen previewLabel={null}
      headerAction={<VoltButton label="Design lab" accessibilityLabel="Open design lab" variant="outline"
        size="compact" iconOnly={width < 380} icon="grid-outline" onPress={() => router.push(routes.designLab)} />}
      footer={<View style={styles.actions}>
        <VoltButton label="Play" icon="flash" disabled={!ready || !!unsavedMatch}
          style={styles.grow} onPress={() => router.push(routes.mode)} />
        {!wide ? <VoltButton label={kitOpen ? 'Fighter' : 'Battle kit'} variant="outline" size="compact"
          icon={kitOpen ? 'person-outline' : 'grid-outline'} onPress={() => setKitOpen(!kitOpen)} /> : null}
      </View>}>
      <PlayerDataNotice />
      {ready ? <View style={styles.player}>
        <PlayerAvatar username={player.username} avatarId={avatarId} appearance="volt" />
        <View style={styles.grow}>
          <VoltText variant="label">{player.username}</VoltText>
          <VoltText variant="micro" tone="muted">Demo rank: {player.rank}</VoltText>
          <VoltProgress label={`XP to level ${player.level + 1}`}
            value={player.xp} max={player.xpForNextLevel} showLabel={false} />
        </View>
        <View accessible accessibilityLabel={`Level ${player.level}`}>
          <VoltText variant="micro" tone="acid">LVL {player.level}</VoltText>
          <VoltText variant="micro" accessibilityLabel={`Coins: ${player.coins}`}>{player.coins.toLocaleString()} C</VoltText>
          <VoltText variant="micro" accessibilityLabel={`Shards: ${player.shards}`}>{player.shards} S</VoltText>
        </View>
      </View> : null}
      <View style={[styles.workspace, wide && styles.wideWorkspace]}>
        {wide || !kitOpen ? <VoltPanel tone="signal" style={styles.hero}>
          <VoltMotif />
          <View style={styles.heroHeader}>
            <VoltSectionLabel index="01" label="Fighter" light />
            {ready ? <VoltButton label="Change hero" variant="outline" size="compact"
              icon="swap-horizontal-outline" onPress={() => setChoosingHero(true)} /> : null}
          </View>
          {ready ? <>
            <View style={styles.stage} onLayout={(event) => {
              if (event.nativeEvent.layout.height > 0) setStageHeight(event.nativeEvent.layout.height);
            }}>
              <View style={styles.heroCopy}>
                <VoltText variant={stageHeight < 180 ? 'heading' : 'title'} tone="ink">{fighter.name}</VoltText>
                <VoltText variant="micro" tone="ink">{fighter.role}</VoltText>
              </View>
              <FighterArt fighterId={fighter.id} height={Math.max(40, stageHeight - 8)} />
            </View>
            <View style={styles.passive}>
              <VoltText variant="micro" tone="ink">{fighter.passive.name}</VoltText>
            </View>
          </> : <View style={styles.unavailable}>
            <VoltText variant="heading" tone="ink">Your next duel awaits.</VoltText>
            <VoltText tone="ink">Your fighter will appear once local player data loads.</VoltText>
          </View>}
        </VoltPanel> : null}
        {wide || kitOpen ? kit : null}
      </View>
    </Screen>
    {ready && choosingHero ? <HeroPicker onClose={() => setChoosingHero(false)} /> : null}
  </>;
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0, gap: volt.space.xs },
  actions: { flexDirection: 'row', gap: volt.space.sm },
  player: { flexDirection: 'row', alignItems: 'center', gap: volt.space.md, padding: volt.space.sm, backgroundColor: volt.color.panel },
  workspace: { flex: 1, minHeight: 0, gap: volt.space.md },
  wideWorkspace: { flexDirection: 'row' },
  hero: { flex: 1.7, minHeight: 0, padding: volt.space.sm, gap: volt.space.xs, overflow: 'hidden' },
  heroHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: volt.space.xs },
  stage: { flex: 1, minHeight: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroCopy: { flex: 1, minWidth: 0, gap: volt.space.sm, paddingLeft: volt.space.sm },
  passive: { padding: volt.space.sm, backgroundColor: volt.color.chalk },
  kit: { flex: 1, minHeight: 0, justifyContent: 'space-evenly', padding: volt.space.md },
  booster: { flexDirection: 'row', alignItems: 'center', gap: volt.space.md },
  unavailable: { flex: 1, justifyContent: 'center', gap: volt.space.sm },
});
