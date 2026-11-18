import { StyleSheet, View } from 'react-native';

import { volt } from '../../theme';
import { AppText } from '../ui/AppText';

/** Display-only graphic unit; question/body text never uses slants or motion. */
export function TypeUnit({ lead, punch, variant = 'signal', size = 'regular', decorative = false }: {
  lead: string; punch: string; variant?: 'signal' | 'acid' | 'chalk'; size?: 'compact' | 'regular' | 'poster';
  decorative?: boolean;
}) {
  const dark = variant !== 'signal';
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'header'}
    accessibilityLabel={decorative ? undefined : `${lead} ${punch}`}
    accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    style={styles.container}>
    <View style={[styles.edge, { backgroundColor: dark ? volt.color.red : volt.color.acid }]} />
    <View style={styles.copy}>
      <AppText allowFontScaling={false} style={[styles.lead, sizes[size].lead]}>{lead.toUpperCase()}</AppText>
      <View style={[styles.band, { backgroundColor: volt.color[variant === 'signal' ? 'red' : variant] }]}>
        <AppText allowFontScaling={false} style={[styles.punch, sizes[size].punch,
          { color: volt.color.ink }]}>{punch.toUpperCase()}</AppText>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 7, alignSelf: 'flex-start', maxWidth: '100%' },
  edge: { width: 4, transform: [{ skewX: '-8deg' }] },
  copy: { minWidth: 0, flexShrink: 1, alignItems: 'flex-start' },
  lead: { color: volt.color.chalk, fontFamily: volt.font.display, letterSpacing: 0.6 },
  band: { paddingHorizontal: 9, paddingVertical: 1, transform: [{ skewX: '-8deg' }], alignSelf: 'flex-start', maxWidth: '100%' },
  punch: { fontFamily: 'Bangers', letterSpacing: 1 },
});
const sizes = {
  compact: { lead: { fontSize: 14, lineHeight: 16 }, punch: { fontSize: 25, lineHeight: 28 } },
  regular: { lead: { fontSize: 24, lineHeight: 26 }, punch: { fontSize: 42, lineHeight: 45 } },
  poster: { lead: { fontSize: 34, lineHeight: 37 }, punch: { fontSize: 64, lineHeight: 68 } },
} as const;
