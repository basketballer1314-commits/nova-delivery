'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa } from '../../../lib/admin/format'
import Table, { type Column } from '../components/Table'

type Resto = { id: string; name: string; seller_id: string | null; seller_commission_pct: number }
type Balance = { seller_id: string; balance_due: number }

export default function SellersPage() {
  const { supabase, perm } = useAdmin()
  const [restos, setRestos] = useState<Resto[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [sel, setSel] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [pct, setPct] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [r, b] = await Promise.all([
      supabase.from('restaurants').select('id,name,seller_id,seller_commission_pct').order('name'),
      supabase.from('v_seller_balances').select('seller_id,balance_due'),
    ])
    setRestos((r.data ?? []) as Resto[])
    setBalances((b.data ?? []) as Balance[])
  }, [supabase])
  useEffect(() => { void load() }, [load])

  async function assign() {
    setMsg(null)
    if (!sel || !sellerId.trim()) return setMsg('Restaurant et vendeur requis.')
    const { error } = await supabase.rpc('admin_set_restaurant_seller', {
      _restaurant_id: sel, _seller_id: sellerId.trim(), _pct: parseFloat(pct) || 0,
    })
    setMsg(error ? error.message : 'Vendeur assigné.')
    void load()
  }

  const rCols: Column<Resto>[] = [
    { key: 'name', header: 'Restaurant', render: (r) => r.name },
    { key: 'seller', header: 'Vendeur', render: (r) => <span className="font-mono text-[12px]">{r.seller_id ? r.seller_id.slice(0, 8) : '—'}</span> },
    { key: 'pct', header: 'Commission', numeric: true, render: (r) => `${r.seller_commission_pct} %` },
  ]
  const bCols: Column<Balance>[] = [
    { key: 'seller', header: 'Vendeur', render: (r) => <span className="font-mono text-[12px]">{r.seller_id.slice(0, 8)}</span> },
    { key: 'due', header: 'Dû', numeric: true, render: (r) => formatFcfa(r.balance_due) },
  ]

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-2xl font-semibold">Vendeurs</h1>
      {msg && <div className="rounded-md bg-lagune-500/10 p-12 text-[13px] text-lagune-600">{msg}</div>}

      {perm.has('sellers_manage') && (
        <section className="rounded-md border border-gray-200 bg-white p-16">
          <h2 className="mb-12 font-heading text-lg font-semibold">Assigner un vendeur</h2>
          <div className="grid grid-cols-3 gap-12">
            <select value={sel} onChange={(e) => setSel(e.target.value)} className="h-40 rounded-sm border border-gray-200 px-12 text-[14px]">
              <option value="">Restaurant…</option>
              {restos.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input value={sellerId} onChange={(e) => setSellerId(e.target.value)} placeholder="ID vendeur" className="h-40 rounded-sm border border-gray-200 px-12 text-[14px] font-mono" />
            <input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="decimal" placeholder="% commission" className="h-40 rounded-sm border border-gray-200 px-12 text-[14px] tabular-nums" />
          </div>
          <button onClick={assign} className="mt-12 h-40 rounded-pill bg-orange-600 px-20 text-[14px] text-white">Assigner</button>
        </section>
      )}

      <section>
        <h2 className="mb-8 font-heading text-lg font-semibold">Restaurants & vendeurs</h2>
        <Table columns={rCols} rows={restos} rowKey={(r) => r.id} empty="—" />
      </section>
      <section>
        <h2 className="mb-8 font-heading text-lg font-semibold">Soldes vendeurs</h2>
        <Table columns={bCols} rows={balances} rowKey={(r) => r.seller_id} empty="Aucun solde." />
      </section>
    </div>
  )
}
