// Généré par : supabase gen types typescript --local > packages/shared/src/database.types.ts
// Ne pas modifier manuellement.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
