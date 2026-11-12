import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { canBeCourier, type AppMode } from '../lib/routing'

const MODE_KEY = 'nova.mode'

interface Profile {
  id: string
  full_name: string | null
  language: string | null
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  courierStatus: string | null
  mode: AppMode
  initialized: boolean
  init: () => Promise<void>
  loadProfile: () => Promise<void>
  setMode: (mode: AppMode) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  courierStatus: null,
  mode: 'client',
  initialized: false,

  init: async () => {
    const storedMode = (await AsyncStorage.getItem(MODE_KEY)) as AppMode | null
    if (storedMode === 'livreur' || storedMode === 'client') {
      set({ mode: storedMode })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    set({ session })
    if (session) await get().loadProfile()

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      set({ session: nextSession })
      if (nextSession) {
        get().loadProfile()
      } else {
        set({ profile: null, courierStatus: null })
      }
    })

    set({ initialized: true })
  },

  loadProfile: async () => {
    const userId = get().session?.user.id
    if (!userId) return

    const [{ data: profile }, { data: courier }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, language').eq('id', userId).single(),
      supabase.from('courier_profiles').select('status').eq('id', userId).maybeSingle(),
    ])

    set({
      profile: profile ?? null,
      courierStatus: courier?.status ?? null,
    })
  },

  setMode: async (mode) => {
    // On n'autorise le mode livreur que si le statut le permet.
    if (mode === 'livreur' && !canBeCourier(get().courierStatus)) return
    await AsyncStorage.setItem(MODE_KEY, mode)
    set({ mode })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    await AsyncStorage.setItem(MODE_KEY, 'client')
    set({ session: null, profile: null, courierStatus: null, mode: 'client' })
  },
}))

export const selectCanBeCourier = (s: AuthState) => canBeCourier(s.courierStatus)
