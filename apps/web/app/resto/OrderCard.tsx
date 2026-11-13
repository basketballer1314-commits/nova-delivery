'use client'

import { useState } from 'react'
import type { Database } from '@nova/shared'
import type { Dict } from '../../lib/i18n'
import { formatFcfa, secondsAgoLabel } from '../../lib/format'

type QueueRow = Database['public']['Functions']['resto_queue']['Returns'][number]
type OrderItem = { name: string; quantity: number; options: unknown; line_total: number }

const RESPONSE_LIMIT = 180 // 3 min

function itemsOf(row: QueueRow): OrderItem[] {
  return Array.isArray(row.items) ? (row.items as unknown as OrderItem[]) : []
}

function Lines({ row }: { row: QueueRow }) {
  return (
    <ul className="flex flex-col gap-4">
      {itemsOf(row).map((it, i) => (
        <li key={i} className="flex justify-between font-body text-16">
          <span>
            {it.quantity}× {it.name}
          </span>
          <span className="tabular-nums">{formatFcfa(it.line_total)}</span>
        </li>
      ))}
    </ul>
  )
}

// Carte « nouvelle commande » (orange, texte navy — charte tuile repas).
export function NewOrderCard({
  row,
  nowMs,
  dict,
  onAccept,
  onRefuse,
}: {
  row: QueueRow
  nowMs: number
  dict: Dict
  onAccept: (id: string, prep: number) => void
  onRefuse: (id: string, reason: string) => void
}) {
  const [mode, setMode] = useState<'idle' | 'other' | 'refuse'>('idle')
  const [otherVal, setOtherVal] = useState('')
  const elapsed = Math.max(0, Math.floor((nowMs - new Date(row.created_at).getTime()) / 1000))
  const late = elapsed >= RESPONSE_LIMIT

  return (
    <article
      className={`rounded-lg border-2 p-16 text-navy-900 shadow-md ${
        late ? 'border-error bg-orange-500' : 'border-orange-600 bg-orange-500'
      }`}
    >
      <div className="mb-12 flex items-center justify-between">
        <span className="font-heading text-16 font-semibold">{dict.newOrder}</span>
        <span className="tabular-nums font-body text-16">{formatFcfa(row.total)}</span>
      </div>

      <Lines row={row} />

      <p className="mt-12 font-body text-[15px] font-semibold text-navy-900">
        {late ? '⚠ ' : ''}
        {dict.receivedAgo(secondsAgoLabel(elapsed))}
      </p>

      {mode === 'idle' && (
        <div className="mt-16 flex flex-col gap-12">
          <span className="font-body text-16">{dict.prepTime}</span>
          <div className="flex gap-8">
            {[10, 20, 30].map((m) => (
              <button
                key={m}
                onClick={() => onAccept(row.id, m)}
                className="h-48 flex-1 rounded-pill bg-orange-600 font-heading text-16 text-white"
              >
                {m} min
              </button>
            ))}
            <button
              onClick={() => setMode('other')}
              className="h-48 flex-1 rounded-pill border-2 border-orange-600 font-heading text-16 text-orange-700"
            >
              {dict.other}
            </button>
          </div>
          <button
            onClick={() => setMode('refuse')}
            className="h-48 rounded-pill border-2 border-navy-900 font-heading text-16 text-navy-900"
          >
            {dict.refuse}
          </button>
        </div>
      )}

      {mode === 'other' && (
        <div className="mt-16 flex items-center gap-8">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            value={otherVal}
            onChange={(e) => setOtherVal(e.target.value)}
            placeholder="min"
            className="h-48 w-24 flex-1 rounded-md border border-gray-200 bg-white px-16 font-body text-16 tabular-nums text-navy-900"
          />
          <button
            onClick={() => {
              const v = parseInt(otherVal, 10)
              if (v > 0) onAccept(row.id, v)
            }}
            className="h-48 rounded-pill bg-orange-600 px-24 font-heading text-16 text-white"
          >
            {dict.accept}
          </button>
          <button onClick={() => setMode('idle')} className="h-48 px-12 font-body text-16 text-navy-900">
            {dict.cancel}
          </button>
        </div>
      )}

      {mode === 'refuse' && (
        <div className="mt-16 flex flex-col gap-8">
          <span className="font-body text-16 font-semibold">{dict.refuseReason}</span>
          {([
            ['rupture', dict.reasonRupture],
            ['fermeture', dict.reasonFermeture],
            ['trop_de_commandes', dict.reasonTrop],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => onRefuse(row.id, val)}
              className="h-48 rounded-pill border-2 border-error font-heading text-16 text-error"
            >
              {label}
            </button>
          ))}
          <button onClick={() => setMode('idle')} className="h-40 font-body text-16 text-navy-900">
            {dict.cancel}
          </button>
        </div>
      )}
    </article>
  )
}

// Carte « en préparation » → bouton lagune « Commande prête ».
export function PreparingCard({
  row,
  dict,
  onReady,
}: {
  row: QueueRow
  dict: Dict
  onReady: (id: string) => void
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-16">
      <div className="mb-12 flex items-center justify-between">
        <span className="font-body text-16 text-gray-600">
          {row.prep_minutes ? `${row.prep_minutes} min` : ''}
        </span>
        <span className="tabular-nums font-body text-16">{formatFcfa(row.total)}</span>
      </div>
      <Lines row={row} />
      <button
        onClick={() => onReady(row.id)}
        className="mt-16 h-56 w-full rounded-pill bg-lagune-600 font-heading text-16 text-white"
      >
        {dict.markReady}
      </button>
    </article>
  )
}

// Carte « prête » (en attente livreur).
export function ReadyCard({ row, dict }: { row: QueueRow; dict: Dict }) {
  return (
    <article className="rounded-lg border border-lagune-500 bg-white p-16">
      <div className="mb-8 flex items-center justify-between">
        <span className="font-heading text-16 font-semibold text-lagune-600">{dict.ready}</span>
        <span className="tabular-nums font-body text-16">{formatFcfa(row.total)}</span>
      </div>
      <Lines row={row} />
    </article>
  )
}
