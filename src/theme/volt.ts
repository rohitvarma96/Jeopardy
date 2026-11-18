/** VOLT is opt-in while the rest of the game retains its existing theme. */
export const volt = {
  color: {
    ink: '#15151F',
    panel: '#20212C',
    raised: '#2A2B37',
    chalk: '#F1F0E8',
    red: '#FF354F',
    acid: '#E9FF3C',
    muted: '#AAAAB7',
    border: '#444551',
    success: '#9AE6B4',
    error: '#FF9CA9',
    transparent: 'transparent',
  },
  font: {
    display: 'BarlowCondensed-ExtraBold',
    technical: 'SpaceMono-Regular',
  },
  space: { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 },
  type: {
    display: { fontSize: 88, lineHeight: 82, letterSpacing: -1 },
    title: { fontSize: 52, lineHeight: 52, letterSpacing: -0.5 },
    heading: { fontSize: 30, lineHeight: 32, letterSpacing: 0 },
    body: { fontSize: 14, lineHeight: 21, letterSpacing: 0 },
    label: { fontSize: 12, lineHeight: 18, letterSpacing: 0.5 },
    micro: { fontSize: 10, lineHeight: 16, letterSpacing: 1.2 },
  },
  layout: { maxWidth: 1240, wide: 960, touchTarget: 48, border: 1, radius: 2 },
} as const;
