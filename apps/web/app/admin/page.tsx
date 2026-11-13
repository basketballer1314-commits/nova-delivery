'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from './AdminProvider'
import { formatFcfa, formatTime } from '../../lib/admin/format'
import StatusBadge from './components/StatusBadge'
import Table, { type Column } from './components/Table'
import HourlyChart, { type HourBar } from './components/HourlyChart'

type Metrics = { orders_today: number; app_gain_today: number; couriers_online: number; avg_delay_min: number }
type Alert = { id: string; type: string; severity: string; message: string; created_at: string }
type OrderRow = { id: string; status: string; total: number; created_at: string }

export default function Dashboard() {
  const { supabase, perm } = useAdmin()
  const [m, setM] = useState<Metrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [hours, setHours] = useState<HourBar[]>([])

  const loadAlerts = useCallback(async () => {
    const { data } = await supabase.from('admin_alerts').select('id,type,severity,message,created_at').eq('status', 'OUVERTE').order('created_at', { ascending: false }).limit(30)
    setAlerts((data ?? []) as Alert[])
  }, [supabase])

  const load = useCallback(async () => {
    const [metrics, ord, hr] = await Promise.all([
      supabase.rpc('admin_dashboard_metrics'),
      supabase.from('orders').select('id,status,total,created_at')
        .in('status', ['ENVOYEE_RESTAURANT', 'ACCEPTEE', 'RECHERCHE_LIVREUR', 'LIVREUR_ASSIGNE', 'PRETE', 'RECUPEREE', 'ARRIVEE'])
        .order('created_at', { ascending: false }).limit(20),
      supabase.rpc('admin_orders_by_hour', { _day: new Date().toISOString().slice(0, 10) }),
    ])
    if (metrics.data) setM(metrics.data as unknown as Metrics)
    setOrders((ord.data ?? []) as OrderRow[])
    setHours((hr.data ?? []) as HourBar[])
    void loadAlerts()
  }, [supabase, loadAlerts])

  useEffect(() => {
    void load()
    const ch = supabase
      .channel('admin-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts' }, () => void loadAlerts())
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [supabase, load, loadAlerts])

  async function resolve(id: string) {
    await supabase.rpc('admin_resolve_alert', { _id: id })
    void loadAlerts()
  }

  const cols: Column<OrderRow>[] = [
    { key: 'id', header: 'Commande', render: (r) => <span className="font-mono text-[12px]">{r.id.slice(0, 8)}</span> },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge kind="order" status={r.status} /> },
    { key: 'total', header: 'Montant', numeric: true, render: (r) => formatFcfa(r.total) },
    { key: 'created_at', header: 'Heure', numeric: true, render: (r) => formatTime(r.created_at) },
  ]

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-2xl font-semibold">Tableau de bord</h1>

      <div className="grid grid-cols-4 gap-16">
        <Kpi label="Commandes du jour" value={String(m?.orders_today ?? '—')} />
        <Kpi label="Gain de l’application" value={m ? formatFcfa(m.app_gain_today) : '—'} />
        <Kpi label="Livreurs en ligne" value={String(m?.couriers_online ?? '—')} />
        <Kpi label="Délai moyen" value={m ? `${m.avg_delay_min} min` : '—'} />
      </div>

      {perm.has('dashboard') && alerts.length > 0 && (
        <section>
          <h2 className="mb-12 font-heading text-lg font-semibold">Alertes à traiter</h2>
          <div className="flex flex-col gap-8">
            {alerts.map((a) => (
              <div key={a.id} className={`flex items-center gap-12 rounded-md border bg-white p-12 ${a.severity === 'critical' ? 'border-error' : 'border-gray-200'}`}>
                <StatusBadge status={a.severity === 'critical' ? 'ECHEC' : a.severity === 'warning' ? 'EN_ATTENTE' : 'EXECUTE'} />
                <span className="flex-1 text-[13px]">{a.message}</span>
                <span className="text-[12px] text-gray-500">{formatTime(a.created_at)}</span>
                <button onClick={() => resolve(a.id)} className="rounded-pill border border-gray-200 px-12 py-4 text-[13px] text-orange-700">Traiter</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-12 font-heading text-lg font-semibold">Commandes par heure</h2>
        <div className="rounded-md border border-gray-200 bg-white p-16">
          <HourlyChart data={hours} />
        </div>
      </section>

      <section>
        <h2 className="mb-12 font-heading text-lg font-semibold">Commandes en cours</h2>
        <Table columns={cols} rows={orders} rowKey={(r) => r.id} empty="Aucune commande en cours." />
      </section>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-16">
      <div className="text-[12px] text-gray-500">{label}</div>
      <div className="mt-4 font-heading text-2xl font-semibold tabular-nums text-navy-900">{value}</div>
    </div>
  )
}
