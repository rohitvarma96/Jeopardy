import { Canvas, Circle, Path } from '@shopify/react-native-skia';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '../ui';
import { worldColors } from './SceneControls';

/** Original rough-edged ink plate; never applied to questions or answer text. */
export function PrintHeadline({ label, compact = false, pink = false }: { label: string; compact?: boolean; pink?: boolean }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(compact ? 238 : 318, screenWidth - 40);
  const height = compact ? 58 : 78;
  const color = pink ? worldColors.pink : worldColors.acid;
  return <View accessible accessibilityRole="header" accessibilityLabel={label} style={{ width, height, maxWidth: '100%' }}>
    <Canvas style={StyleSheet.absoluteFill} accessible={false}>
      <Path path="M8 18L47 10L45 3L312 0L304 8L318 13L307 24L316 57L275 65L279 73L14 78L23 68L0 63L10 51L1 32Z"
        color={color} transform={[{ scaleX: width / 318 }, { scaleY: height / 78 }]} />
      {Array.from({ length: 18 }, (_, index) => <Circle key={index}
        cx={width - 7 - (index % 3) * 5} cy={8 + Math.floor(index / 3) * 5}
        r={1 + index % 2 * 0.3} color={pink ? worldColors.acid : worldColors.pink} />)}
    </Canvas>
    <AppText allowFontScaling={false} style={[styles.text, compact && styles.compact]}>{label.toUpperCase()}</AppText>
  </View>;
}
const styles = StyleSheet.create({
  text: { position: 'absolute', top: '9%', left: '6%', right: '4%', color: worldColors.ink, fontFamily: 'Bangers', fontSize: 53, lineHeight: 59, transform: [{ rotate: '-2deg' }] },
  compact: { fontSize: 38, lineHeight: 43 },
});
