import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface CartItem {
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
}

interface CartState {
  restaurantId: string | null
  restaurantName: string | null
  items: CartItem[]
  instructionsResto: string
  instructionsLivreur: string
  /** true quand on tente d'ajouter un article d'un autre restaurant. */
  conflict: boolean
  pending: { restaurantId: string; restaurantName: string; item: CartItem } | null

  addItem: (restaurantId: string, restaurantName: string, item: CartItem) => void
  resolveConflict: (replace: boolean) => void
  removeItem: (menuItemId: string) => void
  setQuantity: (menuItemId: string, quantity: number) => void
  setInstructions: (resto: string, livreur: string) => void
  clear: () => void
}

function mergeItem(items: CartItem[], item: CartItem): CartItem[] {
  const idx = items.findIndex((i) => i.menuItemId === item.menuItemId)
  if (idx === -1) return [...items, item]
  const next = [...items]
  next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity }
  return next
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],
      instructionsResto: '',
      instructionsLivreur: '',
      conflict: false,
      pending: null,

      addItem: (restaurantId, restaurantName, item) => {
        const s = get()
        // Un seul restaurant par panier.
        if (s.restaurantId && s.restaurantId !== restaurantId && s.items.length > 0) {
          set({ conflict: true, pending: { restaurantId, restaurantName, item } })
          return
        }
        set({
          restaurantId,
          restaurantName,
          items: mergeItem(s.items, item),
        })
      },

      resolveConflict: (replace) => {
        const { pending } = get()
        if (replace && pending) {
          set({
            restaurantId: pending.restaurantId,
            restaurantName: pending.restaurantName,
            items: [pending.item],
            instructionsResto: '',
            instructionsLivreur: '',
          })
        }
        set({ conflict: false, pending: null })
      },

      removeItem: (menuItemId) => {
        const items = get().items.filter((i) => i.menuItemId !== menuItemId)
        set({ items, ...(items.length === 0 ? { restaurantId: null, restaurantName: null } : {}) })
      },

      setQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }
        set({ items: get().items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)) })
      },

      setInstructions: (resto, livreur) => set({ instructionsResto: resto, instructionsLivreur: livreur }),

      clear: () =>
        set({
          restaurantId: null,
          restaurantName: null,
          items: [],
          instructionsResto: '',
          instructionsLivreur: '',
          conflict: false,
          pending: null,
        }),
    }),
    {
      name: 'nova.cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        restaurantId: s.restaurantId,
        restaurantName: s.restaurantName,
        items: s.items,
        instructionsResto: s.instructionsResto,
        instructionsLivreur: s.instructionsLivreur,
      }),
    },
  ),
)

export const cartItemsTotal = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
