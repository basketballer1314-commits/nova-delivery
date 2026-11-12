import 'react-native-url-polyfill/auto'
import { AppState, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Erreur explicite en dev si l'env n'est pas renseigné (voir .env.example).
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL / ANON_KEY manquants dans .env')
}

// Adaptateur de stockage sécurisé pour la session (SecureStore, chiffré).
// Note : limite ~2 KB par clé ; les sessions Supabase tiennent en dessous.
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

const options: SupabaseClientOptions<'public'> = {
  auth: {
    // SecureStore n'existe pas sur le web : laisser le stockage par défaut.
    storage: Platform.OS === 'web' ? undefined : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '', options)

// Rafraîchissement auto uniquement quand l'app est au premier plan.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
