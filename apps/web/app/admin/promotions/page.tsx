'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa, formatDateTime } from '../../../lib/admin/format'
import { downloadCsv } from '../../../lib/admin/csv'
import Table, { type Column } from '../components/Table'

type Promo = { id: string; code: string; discount_type: string; discount_value: number; valid_to: string | null; max_redemptions: number | null; active: boolean }

export default function PromotionsPage() {
  const { supabase } = useAdmin()
  const [rows, setRows] = useState<Promo[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('promotions').select('id,code,discount_type,discount_value,valid_to,max_redemptions,active').order('valid_to', { ascending: false, nullsFirst: false })
    setRows((data ?? []) as Promo[])
  }, [supabase])
  useEffect(() => { void load() }, [load])

  const cols: Column<Promo>[] = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'val', header: 'Remise', numeric: true, render: (r) => (r.discount_type === 'percent' ? `${r.discount_value} %` : formatFcfa(r.discount_value)) },
    { key: 'max', header: 'Plafond', numeric: true, render: (r) => r.max_redemptions ?? '∞' },
    { key: 'end', header: 'Fin', numeric: true, render: (r) => formatDateTime(r.valid_to) },
    { key: 'active', header: 'Active', render: (r) => (r.active ? 'Oui' : 'Non') },
  ]

  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Promotions</h1>
        <button onClick={() => downloadCsv('promotions', rows)} className="rounded-pill border border-gray-200 px-16 py-8 text-[13px]">Export CSV</button>
      </div>
      <p className="text-[13px] text-gray-500">Budget, plafond et fin de validité. (Édition à venir.)</p>
      <Table columns={cols} rows={rows} rowKey={(r) => r.id} empty="Aucune promotion active." />
    </div>
  )
}
