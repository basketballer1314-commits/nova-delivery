'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '../AdminProvider'
import { formatFcfa } from '../../../lib/admin/format'
import { downloadCsv } from '../../../lib/admin/csv'
import Table, { type Column } from '../components/Table'

type Zone = { id: number; name: string; number: number; active: boolean }
type Price = { service: string; from_zone: number; to_zone: number; price: number; valid_to: string | null }

export default function ZonesPage() {
  const { supabase, perm } = useAdmin()
  const [zones, setZones] = useState<Zone[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [zoneId, setZoneId] = useState('')
  const [geojson, setGeojson] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [z, p] = await Promise.all([
      supabase.from('zones').select('id,name,number,active').order('number'),
      supabase.from('zone_prices').select('service,from_zone,to_zone,price,valid_to').is('valid_to', null).order('service'),
    ])
    setZones((z.data ?? []) as Zone[])
    setPrices((p.data ?? []) as Price[])
  }, [supabase])
  useEffect(() => { void load() }, [load])

  async function saveZone() {
    setMsg(null)
    if (!zoneId) return setMsg('Choisissez une zone.')
    let parsed: unknown
    try { parsed = JSON.parse(geojson) } catch { return setMsg('GeoJSON invalide.') }
    const { error } = await supabase.rpc('admin_update_zone', { _zone_id: parseInt(zoneId, 10), _geojson: parsed as never })
    setMsg(error ? error.message : 'Polygone enregistré.')
  }

  const zCols: Column<Zone>[] = [
    { key: 'num', header: 'N°', numeric: true, render: (r) => r.number },
    { key: 'name', header: 'Zone', render: (r) => r.name },
    { key: 'active', header: 'Active', render: (r) => (r.active ? 'Oui' : 'Non') },
  ]
  const pCols: Column<Price>[] = [
    { key: 'service', header: 'Service', render: (r) => (r.service === 'food' ? 'Repas' : 'Colis') },
    { key: 'from', header: 'De', numeric: true, render: (r) => r.from_zone },
    { key: 'to', header: 'Vers', numeric: true, render: (r) => r.to_zone },
    { key: 'price', header: 'Prix', numeric: true, render: (r) => formatFcfa(r.price) },
  ]

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-2xl font-semibold">Zones & grilles de prix</h1>

      <section>
        <h2 className="mb-8 font-heading text-lg font-semibold">Zones</h2>
        <Table columns={zCols} rows={zones} rowKey={(r) => String(r.id)} empty="—" />
      </section>

      {perm.has('zones_edit') && (
        <section className="rounded-md border border-gray-200 bg-white p-16">
          <h2 className="mb-12 font-heading text-lg font-semibold">Éditer un polygone (GeoJSON)</h2>
          {msg && <div className="mb-8 text-[13px] text-lagune-600">{msg}</div>}
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="mb-8 h-40 w-[240px] rounded-sm border border-gray-200 px-12 text-[14px]">
            <option value="">Zone…</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.number} — {z.name}</option>)}
          </select>
          <textarea value={geojson} onChange={(e) => setGeojson(e.target.value)} rows={5} placeholder='{"type":"Polygon","coordinates":[[[...]]]}' className="w-full rounded-sm border border-gray-200 p-12 font-mono text-[12px]" />
          <button onClick={saveZone} className="mt-12 h-40 rounded-pill bg-orange-600 px-20 text-[14px] text-white">Enregistrer le polygone</button>
        </section>
      )}

      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Grille de prix en vigueur</h2>
          <button onClick={() => downloadCsv('grille_prix', prices)} className="rounded-pill border border-gray-200 px-16 py-8 text-[13px]">Export CSV</button>
        </div>
        <Table columns={pCols} rows={prices} rowKey={(r, i) => `${r.service}-${r.from_zone}-${r.to_zone}-${i}`} empty="—" />
      </section>
    </div>
  )
}
