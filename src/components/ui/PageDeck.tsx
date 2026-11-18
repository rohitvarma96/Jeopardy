import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export type ScreenPage = { id: string; label: string; content: ReactNode };

export function PageDeck({ pages }: { pages: readonly ScreenPage[] }) {
  const [selected, setSelected] = useState(0);
  if (pages.length === 0) throw new RangeError('A page deck requires at least one page.');
  const index = Math.min(selected, pages.length - 1);
  return <View style={styles.container}>
    <View testID={`page-${pages[index].id}`} style={styles.body}>{pages[index].content}</View>
    {pages.length > 1 ? <View style={styles.navigation}>
      <Button label="Previous section" accessibilityLabel="Previous section" variant="secondary"
        disabled={index === 0} onPress={() => setSelected(index - 1)} style={styles.control} />
      <View style={styles.label}>
        <AppText variant="caption" tone="accent" maxFontSizeMultiplier={1.3}>{index + 1} / {pages.length}</AppText>
        <AppText variant="label" maxFontSizeMultiplier={1.3} accessibilityLiveRegion="polite">{pages[index].label}</AppText>
      </View>
      <Button label="Next section" accessibilityLabel="Next section" variant="secondary"
        disabled={index === pages.length - 1} onPress={() => setSelected(index + 1)} style={styles.control} />
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: spacing.small },
  body: { flex: 1, minHeight: 0, gap: spacing.small },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingTop: spacing.small },
  control: { flex: 1, paddingHorizontal: spacing.xsmall },
  label: { flex: 1, alignItems: 'center' },
});
