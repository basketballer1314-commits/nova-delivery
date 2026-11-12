import { describe, expect, it } from 'vitest'
import { resolveRoute, canBeCourier } from './routing'

describe('resolveRoute', () => {
  it('sans session → (auth)', () => {
    expect(
      resolveRoute({ hasSession: false, hasProfileName: false, mode: 'client', courierStatus: null }),
    ).toBe('(auth)')
  })

  it('session mais profil sans nom → (auth)', () => {
    expect(
      resolveRoute({ hasSession: true, hasProfileName: false, mode: 'client', courierStatus: null }),
    ).toBe('(auth)')
  })

  it('client authentifié avec nom → (client)', () => {
    expect(
      resolveRoute({ hasSession: true, hasProfileName: true, mode: 'client', courierStatus: null }),
    ).toBe('(client)')
  })

  it('mode livreur + statut APPROUVE → (livreur)', () => {
    expect(
      resolveRoute({ hasSession: true, hasProfileName: true, mode: 'livreur', courierStatus: 'APPROUVE' }),
    ).toBe('(livreur)')
  })

  it('mode livreur mais statut EN_ATTENTE → (client) (le bouton ne donne pas accès)', () => {
    expect(
      resolveRoute({ hasSession: true, hasProfileName: true, mode: 'livreur', courierStatus: 'EN_ATTENTE' }),
    ).toBe('(client)')
  })

  it('mode livreur sans statut livreur → (client)', () => {
    expect(
      resolveRoute({ hasSession: true, hasProfileName: true, mode: 'livreur', courierStatus: null }),
    ).toBe('(client)')
  })
})

describe('canBeCourier', () => {
  it('vrai seulement si APPROUVE', () => {
    expect(canBeCourier('APPROUVE')).toBe(true)
    expect(canBeCourier('EN_ATTENTE')).toBe(false)
    expect(canBeCourier(null)).toBe(false)
    expect(canBeCourier(undefined)).toBe(false)
  })
})
