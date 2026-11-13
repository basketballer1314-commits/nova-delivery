'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAdmin } from '../AdminProvider'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'
import type { MapCourier, MapJob } from '../components/OpsMap'

const OpsMap = dynamic(() => import('../components/OpsMap'), { ssr: false, loading: () => <div className="h-[480px] bg-gray-100" /> })

export default function OperationsPage() {
  const { supabase, perm } = useAdmin()
  const [couriers, setCouriers] = useState<MapCourier[]>([])
  const [jobs, setJobs] = useState<MapJob[]>([])
  const [courierId, setCourierId] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_live_map')
    const d = (data ?? {}) as { couriers?: MapCourier[]; jobs?: MapJob[] }
    setCouriers(d.couriers ?? [])
    setJobs(d.jobs ?? [])
  }, [supabase])

  useEffect(() => {
    void load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load])

  async function act(fn: 'admin_impose_job' | 'admin_offer_job' | 'admin_reassign_job', jobId: string) {
    setMsg(null)
    if (!courierId.trim()) return setMsg('Indiquez un identifiant de livreur.')
    const { error } = await supabase.rpc(fn, { _job_id: jobId, _courier_id: courierId.trim() })
    setMsg(error ? error.message : 'Action effectuée.')
    void load()
  }
  async function cancel(jobId: string) {
    const reason = window.prompt('Motif d’annulation ?') ?? ''
    const { error } = await supabase.rpc('admin_cancel_job', { _job_id: jobId, _reason: reason })
    setMsg(error ? error.message : 'Mission annulée.')
    void load()
  }

  const cols: Column<MapJob>[] = [
    { key: 'id', header: 'Mission', render: (r) => <span className="font-mono text-[12px]">{r.id.slice(0, 8)}</span> },
    { key: 'type', header: 'Type', render: (r) => (r.job_type === 'food' ? 'Repas' : 'Colis') },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'act', header: 'Dispatch manuel', render: (r) =>
        perm.has('dispatch') ? (
          <div className="flex justify-end gap-4">
            <button onClick={() => act('admin_offer_job', r.id)} className="rounded-pill border border-gray-200 px-8 py-2 text-[12px]">Proposer</button>
            <button onClick={() => act('admin_impose_job', r.id)} className="rounded-pill bg-orange-600 px-8 py-2 text-[12px] text-white">Imposer</button>
            <button onClick={() => act('admin_reassign_job', r.id)} className="rounded-pill border border-gray-200 px-8 py-2 text-[12px]">Réattribuer</button>
            <button onClick={() => cancel(r.id)} className="rounded-pill border border-error px-8 py-2 text-[12px] text-error">Annuler</button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-16">
      <h1 className="font-heading text-2xl font-semibold">Opérations</h1>
      {msg && <div className="rounded-md bg-lagune-500/10 p-12 text-[13px] text-lagune-600">{msg}</div>}
      <div className="overflow-hidden rounded-md border border-gray-200">
        <OpsMap couriers={couriers} jobs={jobs} />
      </div>

      {perm.has('dispatch') && (
        <div className="flex items-center gap-8">
          <label className="text-[13px] text-gray-600">Livreur cible :</label>
          <input value={courierId} onChange={(e) => setCourierId(e.target.value)} placeholder="ID livreur" className="h-36 w-[320px] rounded-sm border border-gray-200 px-12 text-[13px] font-mono" />
          <span className="text-[12px] text-gray-500">{couriers.length} en ligne</span>
        </div>
      )}

      <Table columns={cols} rows={jobs} rowKey={(r) => r.id} empty="Aucune mission active." />
    </div>
  )
}
