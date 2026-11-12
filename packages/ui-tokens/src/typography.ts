export const fontFamilies = {
  heading: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  headingMedium: 'Poppins_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  price: 'Inter_600SemiBold',
  button: 'Poppins_600SemiBold',
} as const

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const

export const lineHeights = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const

// Bouton heights (dp)
export const buttonHeights = {
  lg: 56,
  md: 48,
  sm: 40,
} as const

// Taille tactile minimum
export const minTouchTarget = 48

export type FontFamilies = typeof fontFamilies
export type FontSizes = typeof fontSizes
