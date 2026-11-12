// Logique de routage par rôle — pure (aucune dépendance React Native),
// pour être testable directement avec vitest.

export type RouteGroup = '(auth)' | '(client)' | '(livreur)'
export type AppMode = 'client' | 'livreur'

// Statut de validation livreur qui débloque le mode livreur (enum courier_status).
export const COURIER_APPROVED = 'APPROUVE' as const

export interface RouteInput {
  hasSession: boolean
  hasProfileName: boolean
  mode: AppMode
  courierStatus: string | null | undefined
}

export function canBeCourier(courierStatus: string | null | undefined): boolean {
  return courierStatus === COURIER_APPROVED
}

/**
 * Détermine le groupe de routes cible.
 * - Pas de session OU profil incomplet (pas de nom) → (auth)
 * - Mode livreur ET livreur approuvé → (livreur)
 * - Sinon → (client)
 */
export function resolveRoute({ hasSession, hasProfileName, mode, courierStatus }: RouteInput): RouteGroup {
  if (!hasSession || !hasProfileName) return '(auth)'
  if (mode === 'livreur' && canBeCourier(courierStatus)) return '(livreur)'
  return '(client)'
}
