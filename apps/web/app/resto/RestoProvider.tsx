'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'
import { getSupabase } from '../../lib/supabase-browser'
import { getDict, type Dict, type Lang } from '../../lib/i18n'
import LoginScreen from './LoginScreen'
import AppChrome from './AppChrome'

export type RestoRow = Database['public']['Functions']['resto_my_restaurants']['Returns'][number]

interface RestoCtx {
  supabase: SupabaseClient<Database>
  session: Session
  restaurants: RestoRow[]
  current: RestoRow
  setCurrentId: (id: string) => void
  refreshRestaurants: () => Promise<void>
  lang: Lang
  setLang: (l: Lang) => void
  dict: Dict
  signOut: () => Promise<void>
}

const Ctx = createContext<RestoCtx | null>(null)

export function useResto(): RestoCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useResto hors RestoProvider')
  return v
}

export default function RestoProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [restaurants, setRestaurants] = useState<RestoRow[] | null>(null)
  const [currentId, setCurrentIdState] = useState<string | null>(null)
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('resto_lang') : null
    if (stored === 'fr' || stored === 'en') setLangState(stored)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const loadRestaurants = useCallback(async () => {
    const { data } = await supabase.rpc('resto_my_restaurants')
    const rows = (data ?? []) as RestoRow[]
    setRestaurants(rows)
    setCurrentIdState((prev) => {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('resto_current') : null
      if (prev && rows.some((r) => r.id === prev)) return prev
      if (stored && rows.some((r) => r.id === stored)) return stored
      return rows[0]?.id ?? null
    })
  }, [supabase])

  useEffect(() => {
    if (session) void loadRestaurants()
    else setRestaurants(null)
  }, [session, loadRestaurants])

  const setCurrentId = (id: string) => {
    setCurrentIdState(id)
    window.localStorage.setItem('resto_current', id)
  }
  const setLang = (l: Lang) => {
    setLangState(l)
    window.localStorage.setItem('resto_lang', l)
  }
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const dict = getDict(lang)

  if (!ready) {
    return <Splash text={dict.loading} />
  }
  if (!session) {
    return <LoginScreen supabase={supabase} dict={dict} lang={lang} setLang={setLang} />
  }
  if (restaurants === null) {
    return <Splash text={dict.loading} />
  }
  if (restaurants.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-24 p-20 text-center">
        <p className="font-body text-16 text-gray-600">{dict.notAllowed}</p>
        <button
          onClick={signOut}
          className="h-48 rounded-pill bg-orange-600 px-24 font-heading text-16 text-white"
        >
          {dict.logout}
        </button>
      </div>
    )
  }

  const current = restaurants.find((r) => r.id === currentId) ?? restaurants[0]!

  return (
    <Ctx.Provider
      value={{
        supabase,
        session,
        restaurants,
        current,
        setCurrentId,
        refreshRestaurants: loadRestaurants,
        lang,
        setLang,
        dict,
        signOut,
      }}
    >
      <AppChrome>{children}</AppChrome>
    </Ctx.Provider>
  )
}

function Splash({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="font-body text-16 text-gray-500">{text}</p>
    </div>
  )
}
