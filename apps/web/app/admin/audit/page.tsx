'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatDateTime } from '../../../lib/admin/format'
import { downloadCsv } from '../../../lib/admin/csv'
import Table, { type Column } from '../components/Table'

type Log = { id: string; actor_id: string | null; action: string; entity_type: string | null; entity_id: string | null; created_at: string }

export default function AuditPage() {
  const { supabase, perm } = useAdmin()
  const [logs, setLogs] = useState<Log[]>([])
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    let query = supabase.from('admin_audit_logs').select('id,actor_id,action,entity_type,entity_id,created_at').order('created_at', { ascending: false }).limit(300)
    if (q.trim()) query = query.ilike('action', `%${q.trim()}%`)
    const { data } = await query
    setLogs((data ?? []) as Log[])
  }, [supabase, q])

  useEffect(() => { void load() }, [load])

  const cols: Column<Log>[] = [
    { key: 'created', header: 'Date', render: (r) => formatDateTime(r.created_at) },
    { key: 'actor', header: 'Acteur', render: (r) => <span className="font-mono text-[12px]">{r.actor_id ? r.actor_id.slice(0, 8) : 'système'}</span> },
    { key: 'action', header: 'Action', render: (r) => r.action },
    { key: 'entity', header: 'Entité', render: (r) => r.entity_type ?? '—' },
    { key: 'entity_id', header: 'ID', render: (r) => <span className="font-mono text-[12px]">{r.entity_id ? r.entity_id.slice(0, 8) : '—'}</span> },
  ]

  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Journal d’audit</h1>
        {perm.has('exports') && (
          <button onClick={() => downloadCsv('audit', logs)} className="rounded-pill border border-gray-200 px-16 py-8 text-[13px]">Export CSV</button>
        )}
      </div>
      <p className="text-[13px] text-gray-500">Journal en lecture seule, non modifiable.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par action…" className="h-40 w-[320px] rounded-sm border border-gray-200 px-12 text-[14px]" />
      <Table columns={cols} rows={logs} rowKey={(r) => r.id} empty="Aucune entrée." />
    </div>
  )
}
