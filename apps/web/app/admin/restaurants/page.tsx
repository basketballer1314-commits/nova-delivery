'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa } from '../../../lib/admin/format'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'

type Resto = { id: string; name: string; status: string; commission_rate: number; zone_id: number | null }

export default function RestaurantsPage() {
  const { supabase, perm } = useAdmin()
  const [rows, setRows] = useState<Resto[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('restaurants').select('id,name,status,commission_rate,zone_id').order('name')
    setRows((data ?? []) as Resto[])
  }, [supabase])
  useEffect(() => { void load() }, [load])

  async function setStatus(id: string, status: string) {
    await supabase.rpc('admin_set_restaurant_status', { _restaurant_id: id, _status: status as never })
    void load()
  }

  const cols: Column<Resto>[] = [
    { key: 'name', header: 'Restaurant', render: (r) => r.name },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge status={r.status === 'ACTIF' ? 'EXECUTE' : r.status === 'SUSPENDU' ? 'REJETE' : 'EN_ATTENTE'} /> },
    { key: 'zone', header: 'Zone', numeric: true, render: (r) => r.zone_id ?? '—' },
    { key: 'comm', header: 'Commission', numeric: true, render: (r) => `${r.commission_rate} %` },
    {
      key: 'act', header: '', render: (r) =>
        perm.has('restaurants_manage') ? (
          <div className="flex justify-end gap-4">
            <button onClick={() => setStatus(r.id, 'ACTIF')} className="rounded-pill bg-success px-8 py-2 text-[12px] text-white">Activer</button>
            <button onClick={() => setStatus(r.id, 'SUSPENDU')} className="rounded-pill border border-error px-8 py-2 text-[12px] text-error">Suspendre</button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-16">
      <h1 className="font-heading text-2xl font-semibold">Restaurants</h1>
      <Table columns={cols} rows={rows} rowKey={(r) => r.id} empty="Aucun restaurant." />
    </div>
  )
}
