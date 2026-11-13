'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'
import { getSupabase } from '../../lib/admin/supabase-browser'
import { makePermChecker, type AdminRole, type PermChecker } from '../../lib/admin/permissions'
import AdminLogin from './AdminLogin'
import AdminShell from './AdminShell'

interface AdminCtx {
  supabase: SupabaseClient<Database>
  session: Session
  roles: AdminRole[]
  perm: PermChecker
  signOut: () => Promise<void>
}

const Ctx = createContext<AdminCtx | null>(null)
export function useAdmin(): AdminCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAdmin hors AdminProvider')
  return v
}

const ADMIN_ROLES: AdminRole[] = [
  'admin_super', 'admin_ops', 'admin_finance', 'admin_support', 'admin_sales', 'admin_auditor',
]

export default function AdminProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [roles, setRoles] = useState<AdminRole[] | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!session) {
      setRoles(null)
      return
    }
    supabase
      .from('user_roles')
      .select('role')
      .then(({ data }) => {
        const r = (data ?? [])
          .map((x) => x.role as AdminRole)
          .filter((x) => ADMIN_ROLES.includes(x))
        setRoles(r)
      })
  }, [session, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (!ready) return <Splash text="Chargement…" />
  if (!session) return <AdminLogin supabase={supabase} />
  if (roles === null) return <Splash text="Chargement…" />
  if (roles.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-24 text-center">
        <p className="text-[14px] text-gray-600">Ce compte n’a pas d’accès back-office.</p>
        <button onClick={signOut} className="rounded-pill bg-orange-600 px-24 py-12 text-[14px] text-white">
          Se déconnecter
        </button>
      </div>
    )
  }

  const perm = makePermChecker(roles)

  return (
    <Ctx.Provider value={{ supabase, session, roles, perm, signOut }}>
      <AdminShell>{children}</AdminShell>
    </Ctx.Provider>
  )
}

function Splash({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-[14px] text-gray-500">{text}</div>
  )
}
