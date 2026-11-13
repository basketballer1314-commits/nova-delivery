'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa, formatDateTime } from '../../../lib/admin/format'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'

type Refund = { id: string; order_id: string | null; amount: number; reason: string | null; imputation: string | null; status: string; created_at: string }

export default function RefundsPage() {
  const { supabase } = useAdmin()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [orderId, setOrderId] = useState('')
  const [amount, setAmount] = useState('')
  const [imputation, setImputation] = useState<'platform' | 'restaurant' | 'courier'>('platform')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('refunds').select('id,order_id,amount,reason,imputation,status,created_at').order('created_at', { ascending: false }).limit(50)
    setRefunds((data ?? []) as Refund[])
  }, [supabase])

  useEffect(() => { void load() }, [load])

  async function submit() {
    setMsg(null)
    const amt = parseInt(amount, 10)
    if (!reason.trim()) return setMsg('Motif obligatoire.')
    if (isNaN(amt) || amt <= 0) return setMsg('Montant invalide.')
    const { data, error } = await supabase.rpc('finance_request', {
      _action: 'refund', _amount: amt,
      _payload: { amount: amt, imputation, order_id: orderId.trim() || null, reason: reason.trim() },
    })
    if (error) return setMsg(error.message)
    const res = data as unknown as { status: string }
    setMsg(res.status === 'EXECUTE' ? 'Remboursement enregistré.' : 'Montant élevé : en attente d’un second valideur.')
    setOrderId(''); setAmount(''); setReason('')
    void load()
  }

  const cols: Column<Refund>[] = [
    { key: 'order', header: 'Commande', render: (r) => <span className="font-mono text-[12px]">{r.order_id ? r.order_id.slice(0, 8) : '—'}</span> },
    { key: 'amount', header: 'Montant', numeric: true, render: (r) => formatFcfa(r.amount) },
    { key: 'imp', header: 'Imputation', render: (r) => r.imputation ?? '—' },
    { key: 'reason', header: 'Motif', render: (r) => r.reason ?? '—' },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created', header: 'Date', numeric: true, render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-2xl font-semibold">Remboursements</h1>
      {msg && <div className="rounded-md bg-lagune-500/10 p-12 text-[13px] text-lagune-600">{msg}</div>}

      <section className="rounded-md border border-gray-200 bg-white p-16">
        <h2 className="mb-12 font-heading text-lg font-semibold">Nouveau remboursement</h2>
        <div className="grid grid-cols-4 gap-12">
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="N° de commande (option.)" className="h-40 rounded-sm border border-gray-200 px-12 text-[14px]" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="Montant FCFA" className="h-40 rounded-sm border border-gray-200 px-12 text-[14px] tabular-nums" />
          <select value={imputation} onChange={(e) => setImputation(e.target.value as typeof imputation)} className="h-40 rounded-sm border border-gray-200 px-12 text-[14px]">
            <option value="platform">Imputé plateforme</option>
            <option value="restaurant">Imputé restaurant</option>
            <option value="courier">Imputé livreur</option>
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (obligatoire)" className="h-40 rounded-sm border border-gray-200 px-12 text-[14px]" />
        </div>
        <button onClick={submit} className="mt-12 h-40 rounded-pill bg-orange-600 px-20 text-[14px] text-white">Enregistrer le remboursement</button>
      </section>

      <section>
        <h2 className="mb-8 font-heading text-lg font-semibold">Historique</h2>
        <Table columns={cols} rows={refunds} rowKey={(r) => r.id} empty="Aucun remboursement." />
      </section>
    </div>
  )
}
