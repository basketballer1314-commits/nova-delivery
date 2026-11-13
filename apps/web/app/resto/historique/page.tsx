'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from '../RestoProvider'
import { formatFcfa } from '../../../lib/format'

type Row = Database['public']['Functions']['resto_history']['Returns'][number]

const STATUS_FR: Record<string, string> = {
  LIVREE: 'Livrée',
  TERMINEE: 'Terminée',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
  ECHEC: 'Échec',
}
const REASON_FR: Record<string, string> = {
  rupture: 'Rupture',
  fermeture: 'Fermeture',
  trop_de_commandes: 'Trop de commandes',
  non_reponse: 'Non-réponse',
}

export default function HistoryPage() {
  const { supabase, current, dict } = useResto()
  const [rows, setRows] = useState<Row[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('resto_history', { _restaurant_id: current.id, _limit: 100 })
    setRows((data ?? []) as Row[])
  }, [supabase, current.id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex flex-col gap-8">
      <h1 className="mb-8 font-heading text-4xl font-semibold text-navy-900">{dict.navHistory}</h1>
      {rows.length === 0 && <p className="font-body text-16 text-gray-500">{dict.noOrders}</p>}
      {rows.map((r) => {
        const refused = r.status === 'REFUSEE'
        return (
          <div key={r.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-12">
            <div className="flex flex-col">
              <span className={`font-body text-16 font-semibold ${refused ? 'text-error' : 'text-navy-900'}`}>
                {STATUS_FR[r.status] ?? r.status}
                {r.refusal_reason ? ` · ${REASON_FR[r.refusal_reason] ?? r.refusal_reason}` : ''}
              </span>
              <span className="font-body text-[13px] text-gray-500">
                {new Date(r.created_at).toLocaleString('fr', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <span className="tabular-nums font-body text-16">{formatFcfa(r.total)}</span>
          </div>
        )
      })}
    </div>
  )
}
