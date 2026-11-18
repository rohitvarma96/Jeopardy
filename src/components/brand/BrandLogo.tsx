import { useState } from 'react';
import { Image } from 'react-native';

import { BRAND } from '../../assets/brand';

export function BrandLogo({ width = 168, variant = 'color', decorative = false }: {
  width?: number; variant?: keyof typeof BRAND.logo; decorative?: boolean;
}) {
  const [error, setError] = useState<Error | null>(null);
  if (error) throw error;
  return <Image source={BRAND.logo[variant]} resizeMode="contain" accessible={!decorative}
    accessibilityRole={decorative ? undefined : 'image'}
    accessibilityLabel={decorative ? undefined : `${BRAND.name} logo`}
    accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    onError={(event) => setError(new Error(`Unable to load Brain Brawlers logo: ${event.nativeEvent.error}`))}
    style={{ width, height: width * 350 / 1100 }} />;
}
