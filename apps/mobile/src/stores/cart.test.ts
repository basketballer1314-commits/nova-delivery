import { beforeEach, describe, expect, it, vi } from 'vitest'

// AsyncStorage n'existe pas en environnement node : mock mémoire.
vi.mock('@react-native-async-storage/async-storage', () => {
  const mem = new Map<string, string>()
  return {
    default: {
      getItem: (k: string) => Promise.resolve(mem.get(k) ?? null),
      setItem: (k: string, v: string) => {
        mem.set(k, v)
        return Promise.resolve()
      },
      removeItem: (k: string) => {
        mem.delete(k)
        return Promise.resolve()
      },
    },
  }
})

const { useCart, cartItemsTotal } = await import('./cart')

const item = (id: string, price: number, qty = 1) => ({
  menuItemId: id,
  name: id,
  unitPrice: price,
  quantity: qty,
})

beforeEach(() => {
  useCart.getState().clear()
})

describe('cart store', () => {
  it('ajoute un article et calcule le total', () => {
    useCart.getState().addItem('r1', 'Resto 1', item('a', 3500))
    useCart.getState().addItem('r1', 'Resto 1', item('b', 3000))
    const s = useCart.getState()
    expect(s.restaurantId).toBe('r1')
    expect(s.items.length).toBe(2)
    expect(cartItemsTotal(s.items)).toBe(6500)
  })

  it('fusionne les quantités du même article', () => {
    useCart.getState().addItem('r1', 'Resto 1', item('a', 3500))
    useCart.getState().addItem('r1', 'Resto 1', item('a', 3500))
    expect(useCart.getState().items[0].quantity).toBe(2)
    expect(cartItemsTotal(useCart.getState().items)).toBe(7000)
  })

  it('bloque un article d’un autre restaurant (conflit mono-resto)', () => {
    useCart.getState().addItem('r1', 'Resto 1', item('a', 3500))
    useCart.getState().addItem('r2', 'Resto 2', item('c', 2000))
    const s = useCart.getState()
    expect(s.conflict).toBe(true)
    expect(s.restaurantId).toBe('r1') // inchangé tant que non résolu
    expect(s.items.length).toBe(1)
  })

  it('remplace le panier si on confirme le conflit', () => {
    useCart.getState().addItem('r1', 'Resto 1', item('a', 3500))
    useCart.getState().addItem('r2', 'Resto 2', item('c', 2000))
    useCart.getState().resolveConflict(true)
    const s = useCart.getState()
    expect(s.conflict).toBe(false)
    expect(s.restaurantId).toBe('r2')
    expect(s.items).toEqual([item('c', 2000)])
  })

  it('garde le panier si on refuse le conflit', () => {
    useCart.getState().addItem('r1', 'Resto 1', item('a', 3500))
    useCart.getState().addItem('r2', 'Resto 2', item('c', 2000))
    useCart.getState().resolveConflict(false)
    const s = useCart.getState()
    expect(s.restaurantId).toBe('r1')
    expect(s.items.length).toBe(1)
  })

  it('vide le resto quand le dernier article est retiré', () => {
    useCart.getState().addItem('r1', 'Resto 1', item('a', 3500))
    useCart.getState().removeItem('a')
    expect(useCart.getState().restaurantId).toBeNull()
  })
})
