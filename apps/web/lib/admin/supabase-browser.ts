'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

let client: SupabaseClient<Database> | undefined

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'nova-admin-auth' },
    })
  }
  return client
}
