'use client'

import { useRef, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa, formatDateTime } from '../../../lib/admin/format'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'

type OrderHit = { id: string; status: string; total: number; phone: string; created_at: string }
type ParcelHit = { id: string; status: string; price: number; recipient_phone: string; tracking_token: string; created_at: string }

export default function SearchPage() {
  const { supabase } = useAdmin()
  const [q, setQ] = useState('')
  const [orders, setOrders] = useState<OrderHit[]>([])
  const [parcels, setParcels] = useState<ParcelHit[]>([])
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function run() {
    if (q.trim().length < 2) return
    const { data } = await supabase.rpc('admin_search', { _q: q.trim() })
    const d = (data ?? {}) as { orders?: OrderHit[]; parcels?: ParcelHit[] }
    setOrders(d.orders ?? [])
    setParcels(d.parcels ?? [])
    setSearched(true)
  }

  const oCols: Column<OrderHit>[] = [
    { key: 'id', header: 'Commande', render: (r) => <span className="font-mono text-[12px]">{r.id.slice(0, 8)}</span> },
    { key: 'phone', header: 'Téléphone', render: (r) => <span className="tabular-nums">{r.phone}</span> },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge kind="order" status={r.status} /> },
    { key: 'total', header: 'Montant', numeric: true, render: (r) => formatFcfa(r.total) },
    { key: 'created_at', header: 'Date', numeric: true, render: (r) => formatDateTime(r.created_at) },
  ]
  const pCols: Column<ParcelHit>[] = [
    { key: 'id', header: 'Colis', render: (r) => <span className="font-mono text-[12px]">{r.id.slice(0, 8)}</span> },
    { key: 'recipient_phone', header: 'Destinataire', render: (r) => <span className="tabular-nums">{r.recipient_phone}</span> },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge kind="parcel" status={r.status} /> },
    { key: 'price', header: 'Prix', numeric: true, render: (r) => formatFcfa(r.price) },
    { key: 'created_at', header: 'Date', numeric: true, render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-2xl font-semibold">Recherche</h1>
      <div className="flex gap-8">
        <input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="Téléphone (+221…), n° de commande ou référence"
          className="h-40 flex-1 rounded-sm border border-gray-200 px-12 text-[14px]"
        />
        <button onClick={run} className="h-40 rounded-pill bg-orange-600 px-20 text-[14px] text-white">Chercher</button>
      </div>

      {searched && (
        <>
          <section>
            <h2 className="mb-8 font-heading text-lg font-semibold">Commandes ({orders.length})</h2>
            <Table columns={oCols} rows={orders} rowKey={(r) => r.id} empty="Aucune commande." />
          </section>
          <section>
            <h2 className="mb-8 font-heading text-lg font-semibold">Colis ({parcels.length})</h2>
            <Table columns={pCols} rows={parcels} rowKey={(r) => r.id} empty="Aucun colis." />
          </section>
        </>
      )}
    </div>
  )
}
