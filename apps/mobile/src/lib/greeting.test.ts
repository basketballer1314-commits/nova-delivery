import { describe, expect, it } from 'vitest'
import { greeting, firstName } from './greeting'

describe('greeting', () => {
  it('matin entre 5h et 18h', () => {
    expect(greeting(5)).toBe('morning')
    expect(greeting(12)).toBe('morning')
    expect(greeting(17)).toBe('morning')
  })
  it('soir sinon', () => {
    expect(greeting(18)).toBe('evening')
    expect(greeting(22)).toBe('evening')
    expect(greeting(4)).toBe('evening')
  })
})

describe('firstName', () => {
  it('renvoie le premier mot', () => {
    expect(firstName('Lassana Coulibaly')).toBe('Lassana')
    expect(firstName('  Fatou  Diop ')).toBe('Fatou')
  })
  it('gère null/vide', () => {
    expect(firstName(null)).toBe('')
    expect(firstName(undefined)).toBe('')
    expect(firstName('')).toBe('')
  })
})
