// Mouvement — charte v1.0. Durées 120 / 200 / 280 ms, courbe standard.
export const durations = {
  fast: 120,
  base: 200,
  slow: 280,
} as const

// Courbe standard cubic-bezier(0.2, 0, 0, 1).
export const easingBezier = [0.2, 0, 0, 1] as const
export const easingCss = 'cubic-bezier(0.2, 0, 0, 1)'

// Table des vibrations (charte p.24) — type sémantique → geste haptique.
// Les valeurs sont consommées par le helper mobile (expo-haptics).
export const hapticsMap = {
  selection: 'selection', // choix dans une liste, toggle
  success: 'success', // commande acceptée, livrée, paiement validé
  warning: 'warning', // délai qui approche, action à confirmer
  error: 'error', // refus, échec, hors zone
  light: 'light', // tap léger
  medium: 'medium', // bouton principal
  heavy: 'heavy', // nouvelle course (livreur)
} as const

export type HapticKind = keyof typeof hapticsMap
export type Durations = typeof durations
