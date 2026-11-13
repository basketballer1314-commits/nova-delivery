'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatDateTime } from '../../../lib/admin/format'
import { downloadCsv } from '../../../lib/admin/csv'
import StatusBadge from '../components/StatusBadge'
import Table, { type Column } from '../components/Table'

type Ticket = {
  id: string; subject: string; type: string | null; priority: string; status: string
  imputation: string | null; closed_reason: string | null; created_at: string
}

export default function TicketsPage() {
  const { supabase, perm, session } = useAdmin()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [subject, setSubject] = useState('')
  const [type, setType] = useState('incident_livraison')
  const [priority, setPriority] = useState('NORMALE')

  const load = useCallback(async () => {
    const { data } = await supabase.from('tickets')
      .select('id,subject,type,priority,status,imputation,closed_reason,created_at')
      .order('created_at', { ascending: false }).limit(100)
    setTickets((data ?? []) as Ticket[])
  }, [supabase])

  useEffect(() => { void load() }, [load])

  async function create() {
    if (!subject.trim()) return
    await supabase.rpc('admin_create_ticket', { _subject: subject.trim(), _type: type, _priority: priority, _user_id: session.user.id })
    setSubject('')
    void load()
  }
  async function close(id: string) {
    const reason = window.prompt('Motif de clôture ?') ?? ''
    if (!reason) return
    const imputation = window.prompt('Imputation (plateforme/restaurant/livreur/client) ?') ?? ''
    await supabase.rpc('admin_close_ticket', { _id: id, _reason: reason, _imputation: imputation })
    void load()
  }

  const cols: Column<Ticket>[] = [
    { key: 'subject', header: 'Sujet', render: (r) => r.subject },
    { key: 'type', header: 'Type', render: (r) => r.type ?? '—' },
    { key: 'priority', header: 'Priorité', render: (r) => <StatusBadge status={r.priority === 'HAUTE' ? 'EN_ATTENTE' : 'EXECUTE'} /> },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'imp', header: 'Imputation', render: (r) => r.imputation ?? '—' },
    { key: 'created', header: 'Créé', numeric: true, render: (r) => formatDateTime(r.created_at) },
    {
      key: 'act', header: '', render: (r) =>
        r.status !== 'CLOTURE' && perm.has('tickets') ? (
          <button onClick={() => close(r.id)} className="rounded-pill border border-gray-200 px-12 py-4 text-[13px] text-orange-700">Clôturer</button>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-24">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Tickets</h1>
        <button onClick={() => downloadCsv('tickets', tickets)} className="rounded-pill border border-gray-200 px-16 py-8 text-[13px]">Export CSV</button>
      </div>

      {perm.has('tickets') && (
        <section className="rounded-md border border-gray-200 bg-white p-16">
          <div className="grid grid-cols-4 gap-12">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet" className="col-span-2 h-40 rounded-sm border border-gray-200 px-12 text-[14px]" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-40 rounded-sm border border-gray-200 px-12 text-[14px]">
              <option value="incident_livraison">Incident livraison</option>
              <option value="paiement">Paiement</option>
              <option value="restaurant">Restaurant</option>
              <option value="autre">Autre</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-40 rounded-sm border border-gray-200 px-12 text-[14px]">
              <option value="BASSE">Basse</option>
              <option value="NORMALE">Normale</option>
              <option value="HAUTE">Haute</option>
            </select>
          </div>
          <button onClick={create} className="mt-12 h-40 rounded-pill bg-orange-600 px-20 text-[14px] text-white">Créer le ticket</button>
        </section>
      )}

      <Table columns={cols} rows={tickets} rowKey={(r) => r.id} empty="Aucun ticket." />
    </div>
  )
}
