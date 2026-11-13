import { createClient } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'

// Client Supabase web (clé anon, lecture publique via RPC SECURITY DEFINER).
// Fallback valide pour que le build Next ne plante pas quand l'env est absente.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient<Database>(url, anonKey, { auth: { persistSession: false } })
