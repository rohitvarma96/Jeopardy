import { useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

type PagedItemsProps<T> = {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  itemHeight: number;
  columns?: 1 | 2 | 3;
  label: string;
};

/** Capacity comes from the actual panel height, not a document scroll or clipping. */
export function PagedItems<T>({ items, renderItem, keyExtractor, itemHeight, columns = 1, label }: PagedItemsProps<T>) {
  const { height, fontScale } = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const [selected, setSelected] = useState(0);
  const [observed, setObserved] = useState(0);
  const rowHeight = Math.max(observed, Math.ceil(itemHeight * Math.max(1, fontScale)));
  const available = measured ?? Math.max(120, height * 0.4);
  const rows = Math.max(1, Math.floor((available - 64) / (rowHeight + spacing.small)));
  const size = rows * columns;
  const total = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(selected, total - 1);
  const start = page * size;
  return <View style={styles.container} onLayout={(event) => {
    if (event.nativeEvent.layout.height > 0) setMeasured(event.nativeEvent.layout.height);
  }}>
    <View style={styles.items}>
      {items.slice(start, start + size).map((item, index) => <View key={keyExtractor(item)}
        onLayout={(event) => {
          const actual = event.nativeEvent.layout.height;
          if (actual > observed) setObserved(actual);
        }}
        style={{ width: columns === 1 ? '100%' : columns === 2 ? '49%' : '32%' }}>
        {renderItem(item, start + index)}
      </View>)}
    </View>
    <View style={styles.navigation}>
      <Button label="Previous" accessibilityLabel={`Previous ${label}`} variant="secondary"
        disabled={page === 0} onPress={() => setSelected(page - 1)} />
      <AppText variant="caption" maxFontSizeMultiplier={1.3} accessibilityLiveRegion="polite" style={styles.label}>
        {label} {page + 1} / {total}
      </AppText>
      <Button label="Next" accessibilityLabel={`Next ${label}`} variant="secondary"
        disabled={page === total - 1} onPress={() => setSelected(page + 1)} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: spacing.small },
  items: { flex: 1, minHeight: 0, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', columnGap: '2%', rowGap: spacing.small },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, minHeight: 48 },
  label: { flex: 1, textAlign: 'center' },
});
