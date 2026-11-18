import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FighterArt } from '../src/components/fighters/FighterArt';
import { Button, Screen } from '../src/components/ui';
import { PagedItems } from '../src/components/ui/PagedItems';
import { VoltButton, VoltOption, VoltPanel, VoltProgress, VoltTag, VoltText } from '../src/components/volt';
import { FIGHTERS } from '../src/data/fighters';
import { routes } from '../src/navigation/routes';
import { volt } from '../src/theme';

const swatches = [
  { name: 'INK / FOUNDATION', color: volt.color.ink, tone: 'chalk' },
  { name: 'CHALK / CONTRAST', color: volt.color.chalk, tone: 'ink' },
  { name: 'SIGNAL / ENERGY', color: volt.color.red, tone: 'ink' },
  { name: 'ACID / ACTION', color: volt.color.acid, tone: 'ink' },
] as const;
const answers = ['Venus', 'Mars', 'Saturn', 'Neptune'];
const actions = [
  { label: 'Enter arena', variant: 'primary', message: 'Primary action activated.' },
  { label: 'Confirm selection', variant: 'signal', message: 'Signal action activated.' },
  { label: 'Inspect loadout', variant: 'outline', message: 'Secondary action activated.' },
  { label: 'Locked', variant: 'primary', disabled: true, message: '' },
  { label: 'Searching', variant: 'outline', loading: true, message: '' },
] as const;

export default function DesignLab() {
  const router = useRouter();
  const [answer, setAnswer] = useState<string | null>(null);
  const [kit, setKit] = useState('Tempo');
  const [actionMessage, setActionMessage] = useState('Preview only. No saved data changes.');
  const { height, fontScale } = useWindowDimensions();
  return <Screen title="Design lab" description="VOLT / Original visual language and component library."
    headerAction={<Button label="Chest forge" variant="secondary" onPress={() => router.push(routes.chestForge)} />}
    backHref={routes.arena} previewLabel={null} pages={[
      { id: 'colors', label: 'Color system', content: <>
        <VoltText variant="heading" accessibilityLabel="VOLT design language">HIGH VOLTAGE. ZERO NOISE.</VoltText>
        <PagedItems items={swatches} keyExtractor={(item) => item.name} label="Colors" columns={2} itemHeight={124}
          renderItem={(item) => <View style={[styles.swatch, { backgroundColor: item.color }]}>
            <VoltText variant="micro" tone={item.tone}>{item.name}</VoltText>
            <VoltText variant="heading" tone={item.tone}>Aa</VoltText>
            <VoltText variant="label" tone={item.tone}>{item.color}</VoltText>
          </View>} />
      </> },
      { id: 'type', label: 'Typography', content: <VoltPanel style={styles.page}>
        <VoltText variant={height < 700 ? 'title' : 'display'}>PLAY BOLD.</VoltText>
        <VoltText variant="label" tone="acid">BARLOW CONDENSED / EXTRA BOLD</VoltText>
        <VoltText>Human faces. Angular silhouettes. Quiet, readable questions.</VoltText>
        <VoltText variant="micro" tone="muted">SPACE MONO / PLAYER DATA / 0123456789</VoltText>
        <VoltText variant="micro" tone="muted">DISPLAY 88 / TITLE 52 / HEADING 30 / BODY 14</VoltText>
      </VoltPanel> },
      { id: 'characters', label: 'Human roster', content: <>
        <VoltTag label="Original adult human characters" tone="acid" />
        <PagedItems items={FIGHTERS} keyExtractor={(item) => item.id} label="Character art"
          columns={2} itemHeight={fontScale >= 1.5 ? 116 : 202}
          renderItem={(fighter) => <VoltPanel style={styles.artCard}>
            {fontScale < 1.5 ? <FighterArt fighterId={fighter.id} height={138} /> : null}
            <VoltText variant="label">{fighter.name}</VoltText>
            <VoltText variant="micro" tone="muted">{fighter.role}</VoltText>
          </VoltPanel>} />
      </> },
      { id: 'actions', label: 'Actions', content: <>
        <PagedItems items={actions} keyExtractor={(item) => item.label} label="Button states" itemHeight={64}
          renderItem={(item) => <VoltButton label={item.label} variant={item.variant}
            disabled={'disabled' in item && item.disabled} loading={'loading' in item && item.loading}
            onPress={() => setActionMessage(item.message)} />} />
        <VoltText tone="muted" accessibilityLiveRegion="polite">{actionMessage}</VoltText>
      </> },
      { id: 'surfaces', label: 'Surfaces', content: <VoltPanel tone="chalk" style={styles.page}>
        <VoltTag label="Sample player card" />
        <VoltText variant="title" tone="ink">LEVEL 04</VoltText>
        <VoltText tone="ink">Chalk highlights identity. Acid points to progression.</VoltText>
        <VoltProgress label="Sample XP" value={240} max={400} showLabel={false} />
        <VoltText variant="micro" tone="ink">240 / 400 XP / SAMPLE DATA</VoltText>
        <View style={styles.tags}><VoltTag label="Equipped" tone="acid" /><VoltTag label="Locked" /></View>
      </VoltPanel> },
      { id: 'answers', label: 'Answer states', content: <VoltPanel style={styles.page}>
        <VoltText variant="micro" tone="muted">COMPONENT DEMO / NOT A LIVE BATTLE</VoltText>
        <VoltText variant="heading">Which planet is known as the Red Planet?</VoltText>
        <View style={styles.answers}>
          {answers.map((option, index) => {
            const feedback = answer === null ? undefined
              : option === 'Mars' ? 'correct' : answer === option ? 'incorrect' : undefined;
            return <VoltOption key={option} label={option} selected={answer === option}
              feedback={feedback} disabled={answer !== null} onPress={() => setAnswer(option)} style={styles.answer}>
              <VoltText variant="label">0{index + 1} / {option}</VoltText>
            </VoltOption>;
          })}
        </View>
        <VoltText accessibilityLiveRegion="polite" tone={answer === 'Mars' ? 'acid' : 'muted'}>
          {answer === null ? 'Awaiting your answer.' : answer === 'Mars' ? 'Correct. Mars.' : 'Incorrect. Answer: Mars.'}
        </VoltText>
        <VoltButton label="Reset question" variant="outline" size="compact" icon="refresh-outline"
          disabled={answer === null} onPress={() => setAnswer(null)} />
      </VoltPanel> },
      { id: 'selection', label: 'Selection + results', content: <VoltPanel style={styles.page}>
        <VoltTag label="Preview / no rewards granted" />
        {['Tempo', 'Shield'].map((option) => <VoltOption key={option} label={option}
          role="radio" selected={kit === option} onPress={() => setKit(option)} />)}
        <VoltOption label="Locked power" role="radio" disabled />
        <VoltText variant="title" tone="red">VICTORY.</VoltText>
      </VoltPanel> },
    ]} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0, padding: volt.space.sm, gap: volt.space.sm, justifyContent: 'space-evenly' },
  swatch: { padding: volt.space.md, gap: volt.space.sm, minHeight: 124, borderWidth: 1, borderColor: volt.color.border },
  artCard: { alignItems: 'center', padding: volt.space.sm, gap: volt.space.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: volt.space.sm },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: volt.space.sm },
  answer: { width: '49%', minHeight: 48 },
});
