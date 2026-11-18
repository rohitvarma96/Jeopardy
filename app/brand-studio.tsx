import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { BrandLogo } from '../src/components/brand/BrandLogo';
import { KeyVisual } from '../src/components/brand/KeyVisual';
import { TypeUnit } from '../src/components/brand/TypeUnit';
import { Button, Screen } from '../src/components/ui';
import { PagedItems } from '../src/components/ui/PagedItems';
import { VoltText } from '../src/components/volt';
import { routes } from '../src/navigation/routes';
import { volt } from '../src/theme';

const units = [
  { lead: 'Think fast.', punch: 'Hit harder.', variant: 'signal' },
  { lead: 'The fight is on.', punch: 'Brawl ready.', variant: 'acid' },
  { lead: 'Well played.', punch: 'Victory.', variant: 'chalk' },
] as const;

export default function BrandStudio() {
  const [variant, setVariant] = useState<'color' | 'chalk'>('color');
  const { width, height, fontScale } = useWindowDimensions();
  const logoWidth = Math.min(420, width - 48);
  return <Screen title="Brand studio" description="Brain Brawlers / original identity, type and painterly action art."
    backHref={routes.designLab} previewLabel={null}
    pages={[
      { id: 'identity', label: 'Identity', content: <View style={styles.identity}>
        <BrandLogo width={logoWidth} variant={variant} />
        <VoltText variant="label" tone="acid">BRAIN BRAWLERS / ORIGINAL SPLIT-BB</VoltText>
        <VoltText tone="muted">A forward-leaning wordmark with a split-BB emblem. Color and one-ink versions share the same silhouette.</VoltText>
        <Button label={variant === 'color' ? 'Show monochrome logo' : 'Show color logo'} variant="secondary"
          onPress={() => setVariant(variant === 'color' ? 'chalk' : 'color')} />
      </View> },
      { id: 'artwork', label: 'Key artwork', content: <>
        <KeyVisual compact={height < 720 || fontScale >= 1.5} style={styles.artwork} />
        <VoltText tone="muted">Original Brawlers, painted shadow planes, foreshortened action and diagonal ink texture. Not a scene or character copied from another franchise.</VoltText>
      </> },
      { id: 'typography', label: 'Type units', content: <PagedItems
        items={units} keyExtractor={(unit) => unit.punch} label="Type units" itemHeight={124}
        renderItem={(unit) => <View style={styles.typeSample}>
          <TypeUnit {...unit} size={width < 380 ? 'compact' : 'regular'} />
        </View>} /> },
    ]} />;
}

const styles = StyleSheet.create({
  identity: { flex: 1, minHeight: 0, justifyContent: 'space-evenly', gap: volt.space.md },
  artwork: { flex: 1, minHeight: 100 },
  typeSample: { padding: volt.space.md, backgroundColor: volt.color.panel, minHeight: 110 },
});
