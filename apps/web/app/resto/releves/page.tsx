'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from '../RestoProvider'
import { formatFcfa } from '../../../lib/format'

type Report = Database['public']['Functions']['resto_reports']['Returns'][number]

type Preset = '7' | '30' | 'month'

function range(preset: Preset): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()
  if (preset === '7') {
    from.setDate(from.getDate() - 7)
  } else if (preset === '30') {
    from.setDate(from.getDate() - 30)
  } else {
    from.setDate(1)
    from.setHours(0, 0, 0, 0)
  }
  return { from, to }
}

export default function ReportsPage() {
  const { supabase, current, dict, lang } = useResto()
  const [preset, setPreset] = useState<Preset>('7')
  const [report, setReport] = useState<Report | null>(null)

  const load = useCallback(async () => {
    const { from, to } = range(preset)
    const { data } = await supabase.rpc('resto_reports', {
      _restaurant_id: current.id,
      _from: from.toISOString(),
      _to: to.toISOString(),
    })
    setReport(((data ?? [])[0] as Report) ?? null)
  }, [supabase, current.id, preset])

  useEffect(() => {
    void load()
  }, [load])

  if (!current.is_owner) {
    return <p className="mt-32 text-center font-body text-16 text-gray-500">{dict.ownerOnly}</p>
  }

  const presets: { key: Preset; label: string }[] = [
    { key: '7', label: '7 j' },
    { key: '30', label: '30 j' },
    { key: 'month', label: lang === 'en' ? 'Month' : 'Mois' },
  ]

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-4xl font-semibold text-navy-900">{dict.navReports}</h1>

      <div className="flex gap-8">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`h-40 flex-1 rounded-pill font-heading text-16 ${
              preset === p.key ? 'bg-navy-900 text-white' : 'border border-gray-200 text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-12">
        <Stat label={dict.ordersCount} value={String(report?.orders_count ?? 0)} />
        <Stat label={dict.grossSales} value={formatFcfa(report?.gross_sales ?? 0)} strong />
        <Stat label={dict.commission} value={`- ${formatFcfa(report?.commission_total ?? 0)}`} />
        <Stat label={dict.payout} value={formatFcfa(report?.resto_payout ?? 0)} strong />
      </div>
    </div>
  )
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-16">
      <span className="font-body text-16 text-gray-600">{label}</span>
      <span className={`tabular-nums ${strong ? 'font-heading text-16 font-semibold text-navy-900' : 'font-body text-16'}`}>
        {value}
      </span>
    </div>
  )
}
