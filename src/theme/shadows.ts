import { colors } from './colors';
import { spacing } from './spacing';

export const shadows = {
  card: {
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: spacing.xsmall },
    shadowOpacity: 0.24,
    shadowRadius: spacing.small,
    elevation: 3,
  },
} as const;
