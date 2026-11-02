import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { battleAssets } from '../../src/assets/registry';
import { FighterArt } from '../../src/components/fighters/FighterArt';
import { HeroPicker } from '../../src/components/fighters/HeroPicker';
import { PlayerAvatar } from '../../src/components/player/PlayerAvatar';
import { PlayerDataNotice } from '../../src/components/player/PlayerDataNotice';
import { AppText, Button, ProgressBar } from '../../src/components/ui';
import { getBooster } from '../../src/data/boosters';
import { getFighter } from '../../src/data/fighters';
import { useBattleStore } from '../../src/features/battle/store';
import { routes } from '../../src/navigation/routes';
import { usePlayerStore } from '../../src/store/player-store';
import { colors, layout, spacing } from '../../src/theme';

export default function Arena() {
  const router = useRouter();
  const [choosingHero, setChoosingHero] = useState(false);
  const { width, height, fontScale } = useWindowDimensions();
  const status = usePlayerStore((state) => state.status);
  const fighter = getFighter(usePlayerStore((state) => state.fighterId));
  const player = usePlayerStore((state) => state.profile);
  const avatarId = usePlayerStore((state) => state.avatarId);
  const boosterIds = usePlayerStore((state) => state.boosterIds);
  const matches = usePlayerStore((state) => state.matches);
  const battle = useBattleStore((state) => state.battle);
  const ready = status === 'ready';
  const unsavedMatch = battle?.outcome && !matches.some((match) => match.matchId === battle.setup.matchId);
  const playDisabled = !ready || !!unsavedMatch;
  const wide = width >= 800 && fontScale < 1.6;
  const stacked = fontScale >= 1.6;
  const artHeight = height < 720 || width <= layout.compactWidth || stacked ? 216 : 264;

  return (
    <SafeAreaView testID="screen-safe-area" edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        testID="screen-scroll"
        contentContainerStyle={[styles.content, wide && styles.wideContent]}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.topbar}>
          <View>
            <AppText variant="caption" style={styles.eyebrow}>BRAIN BRAWL</AppText>
            <AppText variant="title" style={styles.title}>Arena</AppText>
          </View>
          {ready ? (
            <View style={styles.wallet}>
              <View accessible accessibilityLabel={`Coins: ${player.coins}`} style={styles.currency}>
                <Ionicons name="ellipse" size={14} color={colors.gold} accessible={false} />
                <AppText variant="label">{player.coins.toLocaleString()}</AppText>
              </View>
              <View accessible accessibilityLabel={`Shards: ${player.shards}`} style={styles.currency}>
                <Ionicons name="diamond" size={14} color={colors.primary} accessible={false} />
                <AppText variant="label">{player.shards.toLocaleString()}</AppText>
              </View>
            </View>
          ) : null}
        </View>

        <PlayerDataNotice />

        {ready ? (
          <View style={styles.profile}>
            <View style={styles.playerRow}>
              <PlayerAvatar username={player.username} avatarId={avatarId} />
              <View style={styles.playerName}>
                <AppText variant="label" style={styles.username}>{player.username}</AppText>
                <AppText variant="caption" tone="secondary">Demo rank: {player.rank}</AppText>
              </View>
              <View style={styles.level} accessible accessibilityLabel={`Level ${player.level}`}>
                <AppText variant="caption" style={styles.levelLabel}>LVL</AppText>
                <AppText variant="heading" tone="accent">{player.level}</AppText>
              </View>
            </View>
            <View style={styles.xpLabels}>
              <AppText variant="caption" tone="secondary">XP to level {player.level + 1}</AppText>
              <AppText variant="caption" tone="secondary">{player.xp} / {player.xpForNextLevel} XP</AppText>
            </View>
            <ProgressBar label={`XP to level ${player.level + 1}`} value={player.xp} max={player.xpForNextLevel} showLabel={false} />
          </View>
        ) : null}

        <View style={[styles.workspace, wide && styles.wideWorkspace]}>
          <View style={[styles.hero, wide && styles.wideHero]}>
            <View style={styles.showcase}>
              <Image
                source={battleAssets.arena.source}
                resizeMode="cover"
                style={[StyleSheet.absoluteFill, styles.backdrop]}
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scrim]} />
              <View style={styles.showcaseHeader}>
                <AppText variant="caption" style={styles.sectionLabel}>Selected fighter</AppText>
                {ready ? (
                  <Button
                    label="Change hero"
                    variant="ghost"
                    icon={<Ionicons name="swap-horizontal-outline" size={18} color={colors.gold} accessible={false} />}
                    onPress={() => setChoosingHero(true)}
                    style={styles.changeHero}
                  />
                ) : null}
              </View>
              {ready ? (
                <View style={[styles.fighterStage, stacked && styles.stackedStage]}>
                  <View style={styles.fighterCopy}>
                    <AppText variant="heading" style={styles.fighterName}>{fighter.name}</AppText>
                    <AppText tone="secondary">{fighter.role}</AppText>
                    <View style={styles.accentRule} />
                    <AppText variant="caption" style={styles.passiveLabel}>PASSIVE</AppText>
                    <AppText variant="label">{fighter.passive.name}</AppText>
                    <AppText variant="caption" tone="secondary">{fighter.passive.description}</AppText>
                  </View>
                  <View style={styles.art}>
                    <View pointerEvents="none" style={styles.artHalo} />
                    <FighterArt fighterId={fighter.id} height={artHeight} />
                  </View>
                </View>
              ) : (
                <View style={styles.unavailable}>
                  <AppText variant="heading">Your next duel awaits.</AppText>
                  <AppText tone="secondary">
                    {status === 'error'
                      ? 'Your fighter is unavailable until player data loads.'
                      : 'Your fighter will appear once local player data loads.'}
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.playDock}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Play"
                accessibilityState={{ disabled: playDisabled }}
                disabled={playDisabled}
                onPress={() => router.push(routes.mode)}
                style={({ pressed }) => [styles.playButton, playDisabled && styles.disabled, pressed && styles.pressed]}
              >
                <Ionicons name="flash" size={20} color={colors.track} accessible={false} />
                <AppText variant="label" style={styles.playLabel}>Play</AppText>
                <Ionicons name="arrow-forward" size={20} color={colors.track} accessible={false} />
              </Pressable>
            </View>
          </View>

          {ready ? (
            <View style={[styles.loadout, wide && styles.wideLoadout]}>
              <AppText variant="caption" style={styles.sectionLabel}>BATTLE KIT</AppText>
              <AppText variant="label">Your loadout</AppText>
              <View style={[styles.boosters, (wide || stacked) && styles.stackedBoosters]}>
                {boosterIds.map((id) => {
                  const booster = getBooster(id);
                  return (
                    <View key={id} style={[styles.booster, (wide || stacked) && styles.wideBooster]}>
                      <Ionicons name={booster.icon} size={22} color={colors.primary} accessible={false} />
                      <AppText variant="caption" style={styles.boosterName}>{booster.name}</AppText>
                    </View>
                  );
                })}
              </View>
              <AppText variant="caption" tone="secondary">Choose boosters during match setup.</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="caption" tone="secondary" style={styles.localNotice}>
          Local progression - offline prototype
        </AppText>
      </ScrollView>
      {ready && choosingHero ? <HeroPicker onClose={() => setChoosingHero(false)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#12101F' },
  content: {
    flexGrow: 1, width: '100%', maxWidth: 1040, alignSelf: 'center',
    padding: spacing.medium, paddingTop: spacing.small, gap: spacing.medium,
  },
  wideContent: { padding: spacing.large },
  topbar: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    justifyContent: 'space-between', gap: spacing.small,
  },
  eyebrow: { color: colors.gold, fontSize: 10, lineHeight: 16, letterSpacing: 2 },
  title: { fontSize: 30, lineHeight: 36, letterSpacing: -1 },
  wallet: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  currency: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10,
    paddingVertical: spacing.small, backgroundColor: '#211D33', borderRadius: 12,
    borderWidth: 1, borderColor: '#393147',
  },
  profile: {
    padding: 12, gap: spacing.small, backgroundColor: '#1C192D',
    borderRadius: 18, borderWidth: 1, borderColor: '#332D46',
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerName: { flex: 1, gap: 2 },
  username: { fontSize: 16, lineHeight: 22 },
  level: { alignItems: 'center', paddingHorizontal: spacing.small },
  levelLabel: { color: colors.gold, fontSize: 10, lineHeight: 14, letterSpacing: 1 },
  xpLabels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.xsmall },
  workspace: { gap: spacing.medium },
  wideWorkspace: { flexDirection: 'row', alignItems: 'flex-start' },
  hero: { borderRadius: 22, borderWidth: 1, borderColor: '#51415E', overflow: 'hidden', backgroundColor: '#211A34' },
  wideHero: { flex: 2 },
  showcase: { overflow: 'hidden' },
  backdrop: { opacity: 0.48 },
  scrim: { backgroundColor: 'rgba(18, 12, 32, 0.48)' },
  showcaseHeader: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.small, paddingHorizontal: spacing.medium, paddingTop: 12,
  },
  sectionLabel: { color: colors.textSecondary, fontSize: 10, lineHeight: 16, letterSpacing: 1.5, textTransform: 'uppercase' },
  changeHero: { paddingHorizontal: spacing.small },
  fighterStage: { flexDirection: 'row', alignItems: 'center', gap: spacing.xsmall, paddingHorizontal: spacing.medium, paddingVertical: spacing.small },
  stackedStage: { flexDirection: 'column', alignItems: 'stretch' },
  fighterCopy: { flex: 1, gap: spacing.xsmall },
  fighterName: { fontSize: 34, lineHeight: 42, letterSpacing: -1 },
  accentRule: { width: 28, height: 2, backgroundColor: colors.gold, marginVertical: spacing.small },
  passiveLabel: { color: colors.gold, fontSize: 10, lineHeight: 16, letterSpacing: 1.5 },
  art: { alignItems: 'center', justifyContent: 'center' },
  artHalo: {
    position: 'absolute', width: 152, height: 152, borderRadius: 76,
    borderWidth: 1, borderColor: 'rgba(243, 189, 84, 0.28)', backgroundColor: 'rgba(138, 92, 246, 0.12)',
  },
  unavailable: { padding: spacing.large, gap: spacing.small },
  playDock: { padding: 12, gap: 12, borderTopWidth: 1, borderTopColor: '#51415E', backgroundColor: '#261F36' },
  playButton: {
    minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#FFD98B', backgroundColor: colors.gold,
  },
  playLabel: { color: colors.track, fontSize: 18, lineHeight: 24, letterSpacing: 0.5 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  loadout: { borderRadius: 18, borderWidth: 1, borderColor: '#332D46', padding: 12, gap: spacing.small, backgroundColor: '#1C192D' },
  wideLoadout: { flex: 1 },
  boosters: { flexDirection: 'row', gap: spacing.small },
  stackedBoosters: { flexDirection: 'column' },
  booster: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.small,
    borderRadius: 12, backgroundColor: '#262039', borderWidth: 1, borderColor: '#3A3150',
  },
  wideBooster: { flexDirection: 'row', justifyContent: 'flex-start' },
  boosterName: { textAlign: 'center', fontWeight: '600' },
  localNotice: { textAlign: 'center', fontSize: 10, lineHeight: 16 },
});
