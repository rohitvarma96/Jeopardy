import type { ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { volt } from '../../theme';
import { AppText } from '../ui';
import { SigilButton, worldColors } from './SceneControls';

export function WorldOverlay({ title, children, onClose, footer }: {
  title: string; children: ReactNode; onClose: () => void; footer?: ReactNode;
}) {
  return <Modal transparent animationType="none" visible onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>
      <View accessibilityViewIsModal testID="world-overlay" style={styles.sheet}>
        <View style={styles.header}>
          <AppText accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.title}>{title}</AppText>
          <SigilButton icon="close" label={`Close ${title}`} onPress={onClose} />
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', backgroundColor: '#070B13F2', padding: 14 },
  sheet: { flex: 1, minHeight: 0, width: '100%', maxWidth: 700, maxHeight: 700, alignSelf: 'center', padding: 16, gap: 12, borderWidth: 1, borderColor: worldColors.pink, backgroundColor: worldColors.ink },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: worldColors.paper, fontFamily: volt.font.display, fontSize: 30, lineHeight: 32 },
  body: { flex: 1, minHeight: 0, gap: 12 },
  footer: { gap: 8 },
});
