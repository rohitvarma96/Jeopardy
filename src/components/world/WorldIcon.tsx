import { Image } from 'react-native';

import { worldIcons } from '../../assets/world-icons';
import { volt } from '../../theme';

export type WorldIconName = keyof typeof worldIcons;

/** UI sigils use pre-rasterized original paths, not one WebGL context per icon. */
export function WorldIcon({ name, size = 26, color = volt.color.chalk }: {
  name: WorldIconName; size?: number; color?: string;
}) {
  return <Image source={worldIcons[name]} resizeMode="contain" accessible={false}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: size, height: size, tintColor: color }} />;
}
