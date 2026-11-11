// Ombres teintées navy pour React Native (iOS) + Android elevation
export const elevation = {
  sm: {
    shadowColor: '#0E2A47',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0E2A47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#0E2A47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
} as const

// Équivalents CSS pour le web (Tailwind)
export const boxShadows = {
  sm: '0 1px 4px 0 rgba(14,42,71,0.08)',
  md: '0 4px 12px 0 rgba(14,42,71,0.12)',
  lg: '0 8px 24px 0 rgba(14,42,71,0.16)',
} as const

export type Elevation = typeof elevation
