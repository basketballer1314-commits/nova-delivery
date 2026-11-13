'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa, formatDateTime } from '../../../lib/admin/format'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'

type PendingOrder = { id: string; total: number; payment_method: string; payment_ref: string | null; created_at: string }
type Approval = { id: string; action: string; amount: number; status: string; requested_by: string | null; created_at: string }

export default function PaymentsPage() {
  const { supabase, perm, session } = useAdmin()
  const [orders, setOrders] = useState<PendingOrder[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [o, a] = await Promise.all([
      supabase.from('orders').select('id,total,payment_method,payment_ref,created_at')
        .eq('status', 'EN_ATTENTE_PAIEMENT').in('payment_method', ['wave', 'orange_money'])
        .order('created_at', { ascending: true }),
      supabase.from('approval_requests').select('id,action,amount,status,requested_by,created_at')
        .eq('status', 'EN_ATTENTE').order('created_at', { ascending: true }),
    ])
    setOrders((o.data ?? []) as PendingOrder[])
    setApprovals((a.data ?? []) as Approval[])
  }, [supabase])

  useEffect(() => {
    void load()
    const ch = supabase.channel('admin-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests' }, () => void load())
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [supabase, load])

  async function validate(o: PendingOrder) {
    setMsg(null)
    const { data, error } = await supabase.rpc('finance_request', {
      _action: 'payment_validate', _amount: o.total, _payload: { order_id: o.id },
    })
    if (error) return setMsg(error.message)
    const res = data as unknown as { status: string }
    setMsg(res.status === 'EXECUTE' ? 'Paiement validé, commande envoyée au restaurant.' : 'Montant élevé : en attente d’un second valideur.')
    void load()
  }
  async function approve(id: string) {
    setMsg(null)
    const { error } = await supabase.rpc('finance_approve', { _request_id: id })
    if (error) return setMsg(error.message)
    void load()
  }
  async function reject(id: string) {
    const reason = window.prompt('Motif du rejet ?') ?? ''
    const { error } = await supabase.rpc('finance_reject', { _request_id: id, _reason: reason })
    if (error) return setMsg(error.message)
    void load()
  }

  const oCols: Column<PendingOrder>[] = [
    { key: 'ref', header: 'Référence', render: (r) => <span className="font-mono">{r.payment_ref ?? '—'}</span> },
    { key: 'method', header: 'Moyen', render: (r) => (r.payment_method === 'wave' ? 'Wave' : 'Orange Money') },
    { key: 'total', header: 'Montant', numeric: true, render: (r) => formatFcfa(r.total) },
    { key: 'created', header: 'Reçue', numeric: true, render: (r) => formatDateTime(r.created_at) },
    {
      key: 'act', header: '', render: (r) =>
        perm.has('payments_validate') ? (
          <button onClick={() => validate(r)} className="rounded-pill bg-orange-600 px-12 py-4 text-[13px] text-white">Valider</button>
        ) : null,
    },
  ]

  const aCols: Column<Approval>[] = [
    { key: 'action', header: 'Action', render: (r) => r.action },
    { key: 'amount', header: 'Montant', numeric: true, render: (r) => formatFcfa(r.amount) },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created', header: 'Demandée', numeric: true, render: (r) => formatDateTime(r.created_at) },
    {
      key: 'act', header: '', render: (r) => {
        const mine = r.requested_by === session.user.id
        return (
          <div className="flex justify-end gap-8">
            <button
              onClick={() => approve(r.id)}
              disabled={mine}
              title={mine ? 'Le demandeur ne peut pas valider' : ''}
              className="rounded-pill bg-success px-12 py-4 text-[13px] text-white disabled:opacity-40"
            >
              Approuver
            </button>
            <button onClick={() => reject(r.id)} className="rounded-pill border border-error px-12 py-4 text-[13px] text-error">Rejeter</button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-2xl font-semibold">Paiements à valider</h1>
      {msg && <div className="rounded-md bg-lagune-500/10 p-12 text-[13px] text-lagune-600">{msg}</div>}

      <section>
        <h2 className="mb-8 font-heading text-lg font-semibold">Paiements manuels en attente</h2>
        <Table columns={oCols} rows={orders} rowKey={(r) => r.id} empty="Aucun paiement en attente." />
      </section>

      <section>
        <h2 className="mb-8 font-heading text-lg font-semibold">Double validation requise</h2>
        <p className="mb-8 text-[13px] text-gray-500">Au-delà du seuil, un second administrateur (≠ demandeur) doit approuver.</p>
        <Table columns={aCols} rows={approvals} rowKey={(r) => r.id} empty="Aucune demande en attente." />
      </section>
    </div>
  )
}
