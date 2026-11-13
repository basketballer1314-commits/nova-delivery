'use client'

import { useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa, formatDateTime } from '../../../lib/admin/format'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'

type OrderHit = { id: string; status: string; total: number; phone: string; created_at: string }

// Commande assistée (raccourci N) — MVP : retrouver un client WhatsApp par téléphone
// et consulter ses commandes. La création complète branchera l'Edge Function create-order.
export default function AssistedOrderPage() {
  const { supabase } = useAdmin()
  const [phone, setPhone] = useState('+221')
  const [orders, setOrders] = useState<OrderHit[]>([])
  const [searched, setSearched] = useState(false)

  async function lookup() {
    const { data } = await supabase.rpc('admin_search', { _q: phone.trim() })
    const d = (data ?? {}) as { orders?: OrderHit[] }
    setOrders(d.orders ?? [])
    setSearched(true)
  }

  const cols: Column<OrderHit>[] = [
    { key: 'id', header: 'Commande', render: (r) => <span className="font-mono text-[12px]">{r.id.slice(0, 8)}</span> },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge kind="order" status={r.status} /> },
    { key: 'total', header: 'Montant', numeric: true, render: (r) => formatFcfa(r.total) },
    { key: 'created', header: 'Date', numeric: true, render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <div className="flex flex-col gap-16">
      <h1 className="font-heading text-2xl font-semibold">Commande assistée</h1>
      <p className="text-[13px] text-gray-500">Pour les clients WhatsApp. Retrouvez le client par téléphone, puis passez la commande en son nom.</p>
      <div className="flex gap-8">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookup()} className="h-40 w-[280px] rounded-sm border border-gray-200 px-12 text-[14px] tabular-nums" />
        <button onClick={lookup} className="h-40 rounded-pill bg-orange-600 px-20 text-[14px] text-white">Rechercher le client</button>
      </div>

      {searched && (
        <section>
          <h2 className="mb-8 font-heading text-lg font-semibold">Commandes du client</h2>
          <Table columns={cols} rows={orders} rowKey={(r) => r.id} empty="Aucune commande pour ce numéro." />
          <p className="mt-12 text-[13px] text-gray-500">Création de nouvelle commande : branchement à l’Edge Function <code>create-order</code> (itération suivante).</p>
        </section>
      )}
    </div>
  )
}
