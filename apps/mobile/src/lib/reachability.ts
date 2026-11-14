import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

// Connectivité sans dépendance native : ping périodique d'un point léger.
// (Suffisant pour le bandeau « Pas de connexion » ; NetInfo pourra l'affiner.)
const PING_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '') + '/auth/v1/health'
const INTERVAL_MS = 15000

async function ping(): Promise<boolean> {
  if (!PING_URL.startsWith('http')) return true
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(PING_URL, { method: 'GET', signal: ctrl.signal })
    clearTimeout(t)
    return res.ok || res.status === 401 // 401 = joignable mais non authentifié
  } catch {
    return false
  }
}

export function useReachability(): boolean {
  const [online, setOnline] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      const ok = await ping()
      if (mounted) setOnline(ok)
    }
    void check()
    timer.current = setInterval(check, INTERVAL_MS)
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void check()
    })
    return () => {
      mounted = false
      if (timer.current) clearInterval(timer.current)
      sub.remove()
    }
  }, [])

  return online
}
