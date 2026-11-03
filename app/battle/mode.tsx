import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { battleAssets } from '../../src/assets/registry';
import { FighterArt } from '../../src/components/fighters/FighterArt';
import { AppText, Badge, Button, ProgressBar, SelectableCard } from '../../src/components/ui';
import { GAME_MODES } from '../../src/data/modes';
import { useMatchSetupStore } from '../../src/features/match-setup/store';
import type { GameModeId } from '../../src/game/types/match';
import { routes } from '../../src/navigation/routes';
import { colors, layout, spacing } from '../../src/theme';

export default function Mode() {
  const router = useRouter();
  const { width, height, fontScale } = useWindowDimensions();
  const beginSetup = useMatchSetupStore((state) => state.beginSetup);
  const [modeId, setModeId] = useState<GameModeId>('offline-duel');
  const wide = width >= 800 && fontScale < 1.6;
  const artHeight = width <= layout.compactWidth || height < 720 ? 136 : 164;

  return (
    <SafeAreaView testID="screen-safe-area" style={styles.screen}>
      <ScrollView
        testID="screen-scroll"
        contentContainerStyle={[styles.content, wide && styles.wideContent]}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.toolbar}>
          <Button
            label="Back"
            variant="ghost"
            icon={<Ionicons name="arrow-back" size={20} color={colors.text} accessible={false} />}
            onPress={() => (router.canGoBack() ? router.back() : router.replace(routes.arena))}
            style={styles.back}
          />
          <AppText variant="caption" style={styles.eyebrow}>BATTLE SETUP  /  01 OF 05</AppText>
        </View>
        <View style={styles.intro}>
          <AppText variant="title" style={styles.title}>Mode selection</AppText>
          <AppText tone="secondary" style={styles.subtitle}>Choose your challenge. Make every answer count.</AppText>
        </View>
        <ProgressBar label="Match setup" value={1} max={5} showLabel={false} />

        <View style={[styles.modes, wide && styles.wideModes]}>
          <View style={[styles.available, wide && styles.wideAvailable]}>
            {GAME_MODES.filter((mode) => mode.available).map((mode) => (
              <SelectableCard
                key={mode.id}
                label={mode.name}
                hint={mode.description}
                selected={mode.id === modeId}
                onPress={() => setModeId(mode.id)}
                style={styles.featured}
              >
                <View style={styles.availability}>
                  <Badge label="Available offline" tone="success" />
                  <AppText variant="caption" style={styles.duelLabel}>1V1 DUEL</AppText>
                </View>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.scene, { height: artHeight + 8 }]}
                >
                  <Image source={battleAssets.arena.source} resizeMode="cover" accessible={false} style={[StyleSheet.absoluteFill, styles.backdrop]} />
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scrim]} />
                  <FighterArt fighterId="ember" height={artHeight} />
                  <View style={styles.versus}>
                    <AppText variant="label" tone="accent">VS</AppText>
                  </View>
                  <View style={styles.mirror}><FighterArt fighterId="frost" height={artHeight} /></View>
                </View>
                <View style={styles.modeCopy}>
                  <AppText variant="heading" style={styles.featuredTitle}>{mode.name}</AppText>
                  <AppText tone="secondary" style={styles.modeDescription}>{mode.description}</AppText>
                </View>
              </SelectableCard>
            ))}
          </View>

          <View style={[styles.upcoming, wide && styles.wideUpcoming]}>
            <View style={styles.upcomingHeader}>
              <AppText variant="caption" style={styles.sectionLabel}>COMING SOON</AppText>
              <View style={styles.divider} />
            </View>
            {GAME_MODES.filter((mode) => !mode.available).map((mode) => (
              <SelectableCard
                key={mode.id}
                label={`${mode.name}, unavailable future mode`}
                hint={mode.description}
                selected={false}
                disabled
                onPress={() => setModeId(mode.id)}
                style={styles.future}
              >
                <View style={styles.futureRow}>
                  <View style={styles.modeIcon}>
                    <Ionicons name={mode.icon} size={22} color={colors.textSecondary} accessible={false} />
                  </View>
                  <View style={styles.futureCopy}>
                    <AppText variant="heading" style={styles.futureTitle}>{mode.name}</AppText>
                    <AppText variant="caption" tone="secondary">{mode.description}</AppText>
                  </View>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} accessible={false} />
                </View>
              </SelectableCard>
            ))}
          </View>
        </View>
      </ScrollView>

      <View testID="screen-footer" style={styles.footer}>
        <Button
          label="Find opponent"
          variant="gold"
          icon={<Ionicons name="flash" size={20} color={colors.track} accessible={false} />}
          style={styles.action}
          onPress={() => {
            beginSetup(modeId);
            router.push(routes.matchmaking);
          }}
        />
        <AppText variant="caption" tone="secondary" style={styles.footerNote}>
          Local AI opponent. No connection needed.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#12101F' },
  content: {
    flexGrow: 1, width: '100%', maxWidth: 1040, alignSelf: 'center',
    padding: spacing.medium, paddingTop: spacing.small, gap: 12,
  },
  wideContent: { padding: spacing.large },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small },
  back: { paddingHorizontal: spacing.small },
  eyebrow: { color: colors.gold, fontSize: 10, lineHeight: 16, letterSpacing: 1.5 },
  intro: { gap: spacing.xsmall },
  title: { fontSize: 30, lineHeight: 36, letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  modes: { gap: spacing.medium },
  wideModes: { flexDirection: 'row', alignItems: 'flex-start' },
  available: { gap: spacing.small },
  wideAvailable: { flex: 1.5 },
  featured: { padding: 12, gap: 12, borderRadius: 22, backgroundColor: '#211A34' },
  availability: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small },
  duelLabel: { color: colors.gold, fontSize: 10, lineHeight: 16, letterSpacing: 1.5 },
  scene: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
    overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: '#51415E', backgroundColor: colors.track,
  },
  backdrop: { opacity: 0.6 },
  mirror: { transform: [{ scaleX: -1 }] },
  scrim: { backgroundColor: 'rgba(18, 12, 32, 0.3)' },
  versus: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(18, 12, 32, 0.85)', borderWidth: 1, borderColor: colors.gold,
  },
  modeCopy: { gap: spacing.xsmall },
  featuredTitle: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  modeDescription: { fontSize: 14, lineHeight: 20 },
  upcoming: { gap: spacing.small },
  wideUpcoming: { flex: 1 },
  upcomingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: spacing.xsmall },
  sectionLabel: { color: colors.textSecondary, fontSize: 10, lineHeight: 16, letterSpacing: 1.5 },
  divider: { flex: 1, height: 1, backgroundColor: '#332D46' },
  future: { borderWidth: 1, borderColor: '#393147', borderRadius: 18, padding: 12, backgroundColor: '#1C192D' },
  futureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#30283F' },
  futureCopy: { flex: 1, gap: spacing.xsmall },
  futureTitle: { fontSize: 17, lineHeight: 24 },
  footer: {
    width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: spacing.medium,
    paddingVertical: 12, gap: spacing.small, borderTopWidth: 1, borderTopColor: '#332D46',
  },
  action: { width: '100%', maxWidth: 560, alignSelf: 'center', borderRadius: 14 },
  footerNote: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
});
