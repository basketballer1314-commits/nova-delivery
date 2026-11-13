'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from '../RestoProvider'
import ItemCard from './ItemCard'
import HoursEditor from './HoursEditor'

type Category = Database['public']['Tables']['menu_categories']['Row']
type Item = Database['public']['Tables']['menu_items']['Row']

export default function MenuPage() {
  const { supabase, current, dict, refreshRestaurants } = useResto()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [newCat, setNewCat] = useState('')
  const [addingItemCat, setAddingItemCat] = useState<string | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')

  const load = useCallback(async () => {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('restaurant_id', current.id).order('position'),
      supabase.from('menu_items').select('*').eq('restaurant_id', current.id).order('name'),
    ])
    setCategories((c ?? []) as Category[])
    setItems((i ?? []) as Item[])
  }, [supabase, current.id])

  useEffect(() => {
    void load()
  }, [load])

  async function addCategory() {
    if (!newCat.trim()) return
    await supabase
      .from('menu_categories')
      .insert({ restaurant_id: current.id, name: newCat.trim(), position: categories.length })
    setNewCat('')
    void load()
  }
  async function addItem(categoryId: string) {
    const p = parseInt(itemPrice, 10)
    if (!itemName.trim() || isNaN(p) || p < 0) return
    await supabase
      .from('menu_items')
      .insert({ restaurant_id: current.id, category_id: categoryId, name: itemName.trim(), price: p })
    setItemName('')
    setItemPrice('')
    setAddingItemCat(null)
    void load()
  }

  // Pause temporaire / réouverture (« Fermé 1 h »).
  const paused = current.paused_until && new Date(current.paused_until) > new Date()
  async function setPause(minutes: number | null) {
    await supabase.rpc('resto_set_pause', { _restaurant_id: current.id, _minutes: minutes })
    await refreshRestaurants()
  }

  const uncategorized = items.filter((it) => !it.category_id)

  return (
    <div className="flex flex-col gap-24">
      {/* Pause temporaire */}
      <div className="flex items-center gap-8 rounded-md border border-gray-200 bg-white p-12">
        {paused ? (
          <>
            <span className="flex-1 font-body text-16 text-navy-900">
              {dict.pausedUntil(
                new Date(current.paused_until as string).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }),
              )}
            </span>
            <button onClick={() => setPause(null)} className="h-48 rounded-pill bg-lagune-600 px-16 font-heading text-16 text-white">
              {dict.reopen}
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 font-body text-16 text-gray-600">{dict.availability}</span>
            <button onClick={() => setPause(60)} className="h-48 rounded-pill border-2 border-orange-600 px-16 font-heading text-16 text-orange-700">
              {dict.pause1h}
            </button>
          </>
        )}
      </div>

      {/* Catégories + plats */}
      {categories.map((cat) => {
        const list = items.filter((it) => it.category_id === cat.id)
        return (
          <section key={cat.id} className="flex flex-col gap-12">
            <h2 className="font-heading text-16 font-semibold text-navy-900">{cat.name}</h2>
            {list.map((it) => (
              <ItemCard key={it.id} item={it} onChange={load} />
            ))}
            {addingItemCat === cat.id ? (
              <AddItemForm
                name={itemName}
                price={itemPrice}
                setName={setItemName}
                setPrice={setItemPrice}
                onAdd={() => addItem(cat.id)}
                onCancel={() => setAddingItemCat(null)}
                dict={dict}
              />
            ) : (
              <button
                onClick={() => setAddingItemCat(cat.id)}
                className="h-48 self-start rounded-pill border-2 border-orange-600 px-16 font-heading text-16 text-orange-700"
              >
                {dict.addItem}
              </button>
            )}
          </section>
        )
      })}

      {uncategorized.length > 0 && (
        <section className="flex flex-col gap-12">
          <h2 className="font-heading text-16 font-semibold text-gray-500">—</h2>
          {uncategorized.map((it) => (
            <ItemCard key={it.id} item={it} onChange={load} />
          ))}
        </section>
      )}

      {/* Ajout catégorie */}
      <div className="flex gap-8">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder={dict.addCategory}
          className="h-48 flex-1 rounded-sm border border-gray-200 px-12 font-body text-16"
        />
        <button onClick={addCategory} className="h-48 rounded-pill bg-orange-600 px-20 font-heading text-16 text-white">
          +
        </button>
      </div>

      {/* Horaires */}
      <section className="flex flex-col gap-12">
        <h2 className="font-heading text-16 font-semibold text-navy-900">{dict.hours}</h2>
        <HoursEditor />
      </section>
    </div>
  )
}

function AddItemForm({
  name,
  price,
  setName,
  setPrice,
  onAdd,
  onCancel,
  dict,
}: {
  name: string
  price: string
  setName: (v: string) => void
  setPrice: (v: string) => void
  onAdd: () => void
  onCancel: () => void
  dict: ReturnType<typeof useResto>['dict']
}) {
  return (
    <div className="flex flex-col gap-8 rounded-md border border-gray-200 bg-white p-12">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={dict.nameLabel}
        className="h-48 rounded-sm border border-gray-200 px-12 font-body text-16"
      />
      <input
        type="number"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder={dict.priceLabel}
        className="h-48 rounded-sm border border-gray-200 px-12 font-body text-16 tabular-nums"
      />
      <div className="flex gap-8">
        <button onClick={onAdd} className="h-48 flex-1 rounded-pill bg-orange-600 font-heading text-16 text-white">
          {dict.save}
        </button>
        <button onClick={onCancel} className="h-48 px-16 font-body text-16 text-gray-600">
          {dict.cancel}
        </button>
      </div>
    </div>
  )
}
