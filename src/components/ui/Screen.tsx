import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exitPreview } from '../../navigation/exitPreview';
import { routes, type TabHref } from '../../navigation/routes';
import { colors, layout, spacing } from '../../theme';
import { BrandLogo } from '../brand/BrandLogo';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Button } from './Button';
import { PageDeck, type ScreenPage } from './PageDeck';

type ScreenProps = {
  title: string;
  description: string;
  children?: ReactNode;
  pages?: readonly ScreenPage[];
  footer?: ReactNode;
  scrollKey?: string;
  tabScreen?: boolean;
  backHref?: Href;
  exitHref?: TabHref;
  exitLabel?: string;
  onExit?: () => void;
  previewLabel?: string | null;
  headerAction?: ReactNode;
};

export function Screen({
  title, description, children, pages, footer, scrollKey, tabScreen = false,
  backHref, exitHref, exitLabel = 'Leave match', onExit, previewLabel = 'Phase 1 preview', headerAction,
}: ScreenProps) {
  const router = useRouter();
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 700 || fontScale >= 1.5;
  return <SafeAreaView testID="screen-safe-area"
    edges={tabScreen ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']} style={styles.screen}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.layout, compact && styles.compact]}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <BrandLogo width={compact ? 108 : 132} />
            <AppText variant="title" maxFontSizeMultiplier={1.3}>{title}</AppText>
          </View>
          {previewLabel ? <Badge label={previewLabel} tone="accent" /> : null}
          {headerAction}
        </View>
        {!compact ? <AppText tone="secondary">{description}</AppText> : null}
        <View testID="screen-content" style={styles.body}>
          {children}
          {pages ? <PageDeck key={scrollKey} pages={pages} /> : null}
        </View>
        {footer ? <View testID="screen-footer" style={styles.footer}>{footer}</View> : null}
        {!tabScreen ? <View testID="game-navigation" style={styles.navigation}>
          {backHref ? <Button label="Back" variant="secondary" style={styles.navItem}
            onPress={() => router.canGoBack() ? router.back() : router.replace(backHref)} /> : null}
          <Button label={exitHref ? exitLabel : 'Arena'} variant="secondary" style={styles.navItem}
            onPress={() => onExit ? onExit() : exitPreview(exitHref ?? routes.arena)} />
          {!exitHref ? <Button label="Career" variant="secondary" style={styles.navItem}
            onPress={() => { exitPreview(routes.career); }} /> : null}
        </View> : null}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: colors.background },
  layout: {
    flex: 1, minHeight: 0, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center',
    padding: spacing.medium, gap: spacing.small,
  },
  compact: { padding: spacing.small, gap: spacing.xsmall },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small },
  headerTitle: { flexShrink: 1 },
  body: { flex: 1, minHeight: 0, gap: spacing.small },
  footer: { flexShrink: 0, gap: spacing.small },
  navigation: { flexDirection: 'row', gap: spacing.small, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.small },
  navItem: { flex: 1, paddingHorizontal: spacing.xsmall },
});
