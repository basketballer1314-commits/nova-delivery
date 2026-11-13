'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa } from '../../../lib/admin/format'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'

type Courier = { id: string; status: string; availability: string; vehicle_type: string | null; deposit: number; cash_in_hand: number }

export default function CouriersPage() {
  const { supabase, perm } = useAdmin()
  const [rows, setRows] = useState<Courier[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('courier_profiles').select('id,status,availability,vehicle_type,deposit,cash_in_hand').order('status')
    setRows((data ?? []) as Courier[])
  }, [supabase])
  useEffect(() => { void load() }, [load])

  async function setStatus(id: string, status: string) {
    await supabase.rpc('admin_set_courier_status', { _courier_id: id, _status: status as never })
    void load()
  }

  const cols: Column<Courier>[] = [
    { key: 'id', header: 'Livreur', render: (r) => <span className="font-mono text-[12px]">{r.id.slice(0, 8)}</span> },
    { key: 'status', header: 'Validation', render: (r) => <StatusBadge kind="courier" status={r.status} /> },
    { key: 'avail', header: 'Disponibilité', render: (r) => <StatusBadge kind="courier" status={r.availability} /> },
    { key: 'vehicle', header: 'Véhicule', render: (r) => r.vehicle_type ?? '—' },
    { key: 'deposit', header: 'Caution', numeric: true, render: (r) => formatFcfa(r.deposit) },
    { key: 'cash', header: 'Caisse', numeric: true, render: (r) => formatFcfa(r.cash_in_hand) },
    {
      key: 'act', header: '', render: (r) =>
        perm.has('couriers_validate') ? (
          <div className="flex justify-end gap-4">
            <button onClick={() => setStatus(r.id, 'APPROUVE')} className="rounded-pill bg-success px-8 py-2 text-[12px] text-white">Approuver</button>
            <button onClick={() => setStatus(r.id, 'REJETE')} className="rounded-pill border border-error px-8 py-2 text-[12px] text-error">Rejeter</button>
            <button onClick={() => setStatus(r.id, 'SUSPENDU')} className="rounded-pill border border-gray-200 px-8 py-2 text-[12px]">Suspendre</button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-16">
      <h1 className="font-heading text-2xl font-semibold">Validation des livreurs</h1>
      <p className="text-[13px] text-gray-500">Documents, entretien, caution — approbation requise avant mise en ligne.</p>
      <Table columns={cols} rows={rows} rowKey={(r) => r.id} empty="Aucun livreur." />
    </div>
  )
}
