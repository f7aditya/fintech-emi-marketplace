/**
 * 1Fi Marketplace design tokens — tuned to match the existing 1Fi app:
 * a violet primary on a near-white surface, big rounded cards, soft shadows,
 * Poppins typography, a violet→deep-violet gradient on hero surfaces.
 */
export const colors = {
  primary: '#6C2BD9',
  primaryDark: '#571FB0',
  primarySoft: '#F1EAFC',
  primaryTint: '#EEE6FB',
  gradientFrom: '#1A064B',
  gradientTo: '#330099',

  ink: '#191627',
  bodyText: '#4A4A5F',
  mutedText: '#8A8A9E',

  surface: '#F6F5FA',
  card: '#FFFFFF',
  line: '#ECEBF3',

  success: '#12A150',
  successSoft: '#E6F6ED',
  danger: '#E02424',
  star: '#F5A623',

  // kept for backwards-compat with earlier code paths
  mint: '#12A150',
  mintSoft: '#E6F6ED',
};

export const gradients = {
  hero: [colors.gradientFrom, colors.gradientTo] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#2A1A54',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
};

/**
 * `font.*` values are React Native `fontWeight` strings. `<AppText>` reads the
 * resolved fontWeight from a style and swaps in the matching Poppins family, so
 * components keep using `fontWeight: font.bold` and still render in Poppins.
 */
export const font = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const POPPINS = {
  '400': 'Poppins_400Regular',
  '500': 'Poppins_500Medium',
  '600': 'Poppins_600SemiBold',
  '700': 'Poppins_700Bold',
  '800': 'Poppins_800ExtraBold',
} as const;

export function fontFamilyForWeight(weight?: string | number): string {
  if (weight == null) return POPPINS['400'];
  if (weight === 'bold') return POPPINS['700'];
  if (weight === 'normal') return POPPINS['400'];
  const key = String(weight) as keyof typeof POPPINS;
  return POPPINS[key] ?? POPPINS['400'];
}
