'use client'

import { useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from '../RestoProvider'
import { formatFcfa } from '../../../lib/format'
import { menuPhotoUrl, uploadMenuPhoto } from '../../../lib/upload'
import OptionsEditor from './OptionsEditor'

type Item = Database['public']['Tables']['menu_items']['Row']

export default function ItemCard({ item, onChange }: { item: Item; onChange: () => void }) {
  const { supabase, current, dict } = useResto()
  const [editing, setEditing] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(String(item.price))
  const [desc, setDesc] = useState(item.description ?? '')
  const [busy, setBusy] = useState(false)
  const photo = menuPhotoUrl(supabase, item.image_path)

  async function toggle() {
    await supabase.rpc('resto_toggle_item', { _item_id: item.id, _available: !item.available })
    onChange()
  }
  async function save() {
    const p = parseInt(price, 10)
    if (!name.trim() || isNaN(p) || p < 0) return
    await supabase.from('menu_items').update({ name: name.trim(), price: p, description: desc.trim() || null }).eq('id', item.id)
    setEditing(false)
    onChange()
  }
  async function remove() {
    await supabase.from('menu_items').delete().eq('id', item.id)
    onChange()
  }
  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      const path = await uploadMenuPhoto(supabase, current.id, item.id, f)
      await supabase.from('menu_items').update({ image_path: path }).eq('id', item.id)
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-12">
      <div className="flex items-start gap-12">
        <label className="relative h-56 w-56 shrink-0 cursor-pointer overflow-hidden rounded-sm bg-gray-100">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-body text-[11px] text-gray-500">
              {busy ? '…' : dict.photo}
            </span>
          )}
          <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
        </label>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-heading text-16 font-semibold">{item.name}</span>
            <span className="tabular-nums font-body text-16">{formatFcfa(item.price)}</span>
          </div>
          {item.description && <p className="font-body text-[14px] text-gray-600">{item.description}</p>}

          <div className="mt-8 flex flex-wrap gap-8">
            {/* Disponibilité en un geste */}
            <button
              onClick={toggle}
              className={`h-40 rounded-pill px-16 font-body text-[14px] ${
                item.available
                  ? 'bg-success/15 text-success'
                  : 'bg-error/15 text-error'
              }`}
            >
              {item.available ? `● ${dict.available}` : `○ ${dict.unavailable}`}
            </button>
            <button onClick={() => setEditing((v) => !v)} className="h-40 px-12 font-body text-[14px] text-orange-700">
              {dict.edit}
            </button>
            <button onClick={() => setShowOptions((v) => !v)} className="h-40 px-12 font-body text-[14px] text-orange-700">
              {dict.options}
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-12 flex flex-col gap-8">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-48 rounded-sm border border-gray-200 px-12 font-body text-16"
          />
          <input
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-48 rounded-sm border border-gray-200 px-12 font-body text-16 tabular-nums"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="rounded-sm border border-gray-200 p-12 font-body text-16"
          />
          <div className="flex gap-8">
            <button onClick={save} className="h-48 flex-1 rounded-pill bg-orange-600 font-heading text-16 text-white">
              OK
            </button>
            <button onClick={remove} className="h-48 rounded-pill border-2 border-error px-16 font-heading text-16 text-error">
              {dict.remove}
            </button>
          </div>
        </div>
      )}

      {showOptions && <OptionsEditor itemId={item.id} />}
    </div>
  )
}
