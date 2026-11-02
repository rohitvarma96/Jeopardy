import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exitPreview } from '../../navigation/exitPreview';
import type { TabHref } from '../../navigation/routes';
import { colors, layout, spacing } from '../../theme';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Button } from './Button';

type ScreenProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  scrollKey?: string;
  tabScreen?: boolean;
  backHref?: Href;
  exitHref?: TabHref;
  exitLabel?: string;
  onExit?: () => void;
  /** Pass null to hide the preview badge on implemented screens. */
  previewLabel?: string | null;
};

export function Screen({
  title,
  description,
  children,
  footer,
  scrollKey,
  tabScreen = false,
  backHref,
  exitHref,
  exitLabel = 'Exit preview',
  onExit,
  previewLabel = 'Phase 1 preview',
}: ScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const padding = width <= layout.compactWidth ? spacing.medium : spacing.large;

  return (
    <SafeAreaView
      testID="screen-safe-area"
      edges={tabScreen ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
      style={styles.container}
    >
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {backHref || exitHref ? (
        <View style={[styles.toolbar, { paddingHorizontal: padding }]}>
          {backHref ? (
            <Button
              label="Back"
              variant="ghost"
              onPress={() => (router.canGoBack() ? router.back() : router.replace(backHref))}
            />
          ) : null}
          {exitHref ? (
            <Button
              label={exitLabel}
              variant="ghost"
              onPress={() => (onExit ? onExit() : exitPreview(exitHref))}
            />
          ) : null}
        </View>
      ) : null}
      <ScrollView key={scrollKey} testID="screen-scroll" style={styles.scroll} contentContainerStyle={[styles.content, { padding }]}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="never">
        {previewLabel ? <Badge label={previewLabel} tone="accent" /> : null}
        <AppText variant="title">{title}</AppText>
        <AppText tone="secondary">{description}</AppText>
        {children}
      </ScrollView>
      {footer ? <View testID="screen-footer" style={[styles.footer, { paddingHorizontal: padding }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  footer: {
    width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center',
    paddingVertical: spacing.small, gap: spacing.small, borderTopWidth: 1, borderTopColor: colors.border,
  },
  toolbar: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: spacing.small,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.medium,
  },
});
