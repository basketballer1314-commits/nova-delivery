'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from './RestoProvider'
import { NewOrderCard, PreparingCard, ReadyCard } from './OrderCard'
import { isSoundReady, startAlert, stopAlert, unlockSound } from '../../lib/sound'

type QueueRow = Database['public']['Functions']['resto_queue']['Returns'][number]

export default function QueuePage() {
  const { supabase, current, dict, refreshRestaurants } = useResto()
  const [orders, setOrders] = useState<QueueRow[]>([])
  const [soundOn, setSoundOn] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const timedOut = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('resto_queue', { _restaurant_id: current.id })
    setOrders((data ?? []) as QueueRow[])
  }, [supabase, current.id])

  // Chargement initial + abonnement Realtime (filtré restaurant).
  useEffect(() => {
    timedOut.current = new Set()
    void load()
    const channel = supabase
      .channel(`orders:${current.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${current.id}` },
        () => void load(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, current.id, load])

  // Horloge 1 s pour les minuteurs.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const newOrders = orders.filter((o) => o.status === 'ENVOYEE_RESTAURANT')
  const preparing = orders.filter((o) => o.status === 'ACCEPTEE')
  const ready = orders.filter((o) => o.status === 'PRETE' || o.status === 'RECHERCHE_LIVREUR')

  // Alerte sonore répétée tant qu'il y a une nouvelle commande.
  useEffect(() => {
    if (soundOn && newOrders.length > 0) startAlert()
    else stopAlert()
    return () => stopAlert()
  }, [soundOn, newOrders.length])

  // RG-18 : non-réponse > 3 min → timeout serveur (vérifié côté base).
  useEffect(() => {
    for (const o of newOrders) {
      const elapsed = (nowMs - new Date(o.created_at).getTime()) / 1000
      if (elapsed >= 180 && !timedOut.current.has(o.id)) {
        timedOut.current.add(o.id)
        supabase.rpc('resto_timeout_order', { _order_id: o.id }).then(() => void load())
      }
    }
  }, [nowMs, newOrders, supabase, load])

  async function accept(id: string, prep: number) {
    await supabase.rpc('resto_accept_order', { _order_id: id, _prep_minutes: prep })
    void load()
  }
  async function refuse(id: string, reason: string) {
    await supabase.rpc('resto_refuse_order', { _order_id: id, _reason: reason })
    void load()
    void refreshRestaurants() // RG-18 peut avoir mis en pause
  }
  async function ready_(id: string) {
    await supabase.rpc('resto_order_ready', { _order_id: id })
    void load()
  }

  function enableSound() {
    if (unlockSound()) setSoundOn(isSoundReady())
  }

  const paused = current.paused_until && new Date(current.paused_until) > new Date(nowMs)

  return (
    <div className="flex flex-col gap-24">
      {paused && (
        <div className="rounded-md bg-warning/20 p-12 font-body text-16 text-navy-900">
          {dict.pausedUntil(new Date(current.paused_until as string).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }))}
        </div>
      )}

      {!soundOn && (
        <button
          onClick={enableSound}
          className="h-56 w-full rounded-pill bg-navy-900 font-heading text-16 text-white"
        >
          🔔 {dict.enableSound}
        </button>
      )}

      {newOrders.length > 0 && (
        <section className="flex flex-col gap-12">
          {newOrders.map((o) => (
            <NewOrderCard key={o.id} row={o} nowMs={nowMs} dict={dict} onAccept={accept} onRefuse={refuse} />
          ))}
        </section>
      )}

      {preparing.length > 0 && (
        <section className="flex flex-col gap-12">
          <h2 className="font-heading text-16 font-semibold text-navy-900">{dict.inPreparation}</h2>
          {preparing.map((o) => (
            <PreparingCard key={o.id} row={o} dict={dict} onReady={ready_} />
          ))}
        </section>
      )}

      {ready.length > 0 && (
        <section className="flex flex-col gap-12">
          <h2 className="font-heading text-16 font-semibold text-navy-900">{dict.ready}</h2>
          {ready.map((o) => (
            <ReadyCard key={o.id} row={o} dict={dict} />
          ))}
        </section>
      )}

      {orders.length === 0 && (
        <p className="mt-32 text-center font-body text-16 text-gray-500">{dict.noOrders}</p>
      )}
    </div>
  )
}
