import { useState } from 'react';
import { Image, StyleSheet, View, type ViewProps } from 'react-native';

import { BRAND } from '../../assets/brand';
import { BrandLogo } from './BrandLogo';
import { TypeUnit } from './TypeUnit';

export function KeyVisual({ compact = false, style, onLayout, ...props }: ViewProps & { compact?: boolean }) {
  const [error, setError] = useState<Error | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const small = compact || bounds.width < 500 || bounds.height < 240;
  if (error) throw error;
  return <View {...props} style={[styles.container, style]} onLayout={(event) => {
    const { width, height } = event.nativeEvent.layout;
    setBounds((current) => current.width === width && current.height === height ? current : { width, height });
    onLayout?.(event);
  }}>
    <Image source={BRAND.keyVisual} resizeMode="cover" accessible accessibilityRole="image"
      accessibilityLabel="Original Brain Brawlers artwork: Nightblade punching, Astral Sage channeling energy, Ember Sentinel kicking"
      onError={(event) => setError(new Error(`Unable to load Brawlers artwork: ${event.nativeEvent.error}`))}
      style={[StyleSheet.absoluteFill, styles.image]} />
    <View pointerEvents="none" style={styles.copy}>
      <BrandLogo width={small ? 110 : 180} decorative />
      {bounds.height >= 115 ? <TypeUnit lead="Think fast." punch="Hit harder."
        size={small ? 'compact' : 'regular'} decorative /> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { minHeight: 110, backgroundColor: '#11141D', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  copy: { padding: 12, gap: 12, flex: 1, justifyContent: 'space-between', alignItems: 'flex-start', width: '53%' },
});
