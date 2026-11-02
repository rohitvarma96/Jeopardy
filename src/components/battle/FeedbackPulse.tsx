import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

export function FeedbackPulse({
  eventKey, motionEnabled, wrong = false, interactive = false, children, style,
}: {
  eventKey: string;
  motionEnabled: boolean;
  wrong?: boolean;
  interactive?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const emphasis = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    emphasis.value = 0;
    shake.value = 0;
    if (motionEnabled) {
      emphasis.value = withSequence(withTiming(1, { duration: 110 }), withTiming(0, { duration: 220 }));
      if (wrong) {
        shake.value = withSequence(
          withTiming(-3, { duration: 50 }), withTiming(3, { duration: 70 }), withTiming(0, { duration: 80 }),
        );
      }
    }
    return () => {
      cancelAnimation(emphasis);
      cancelAnimation(shake);
    };
  }, [eventKey, motionEnabled, wrong, emphasis, shake]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: 1 + emphasis.value * 0.025 }],
  }));

  return <Animated.View pointerEvents={interactive ? 'auto' : 'none'} style={[style, animatedStyle]}>{children}</Animated.View>;
}
