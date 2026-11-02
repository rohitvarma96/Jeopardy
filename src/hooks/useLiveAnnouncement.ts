import { useEffect } from 'react';
import { AccessibilityInfo, AppState, Platform, type ViewProps } from 'react-native';

/** Android live regions are native; iOS needs an explicit VoiceOver announcement. */
export function useLiveAnnouncement(message: string, liveRegion: ViewProps['accessibilityLiveRegion']) {
  useEffect(() => {
    if (Platform.OS !== 'ios' || !message || !liveRegion || liveRegion === 'none' ||
      AppState.currentState !== 'active') return;
    AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: liveRegion === 'polite' });
  }, [message, liveRegion]);
}
