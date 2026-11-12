import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface CurrentAddress {
  id: string
  label: string | null
  quartier: string | null
  lat: number
  lng: number
  zoneId: number | null
}

interface AddressState {
  current: CurrentAddress | null
  setCurrent: (a: CurrentAddress | null) => void
}

export const useAddress = create<AddressState>()(
  persist(
    (set) => ({
      current: null,
      setCurrent: (current) => set({ current }),
    }),
    {
      name: 'nova.address',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
