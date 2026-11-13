'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from '../RestoProvider'

type Hour = Database['public']['Tables']['restaurant_hours']['Row']

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HoursEditor() {
  const { supabase, current, lang } = useResto()
  const days = lang === 'fr' ? DAYS_FR : DAYS_EN
  const [hours, setHours] = useState<Hour[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('restaurant_hours')
      .select('*')
      .eq('restaurant_id', current.id)
      .order('weekday')
    setHours((data ?? []) as Hour[])
  }, [supabase, current.id])

  useEffect(() => {
    void load()
  }, [load])

  async function addSlot(weekday: number) {
    await supabase
      .from('restaurant_hours')
      .insert({ restaurant_id: current.id, weekday, open_time: '08:00', close_time: '22:00' })
    void load()
  }
  async function update(id: string, patch: Partial<Hour>) {
    await supabase.from('restaurant_hours').update(patch).eq('id', id)
    void load()
  }
  async function remove(id: string) {
    await supabase.from('restaurant_hours').delete().eq('id', id)
    void load()
  }

  return (
    <div className="flex flex-col gap-8">
      {days.map((label, wd) => {
        const slots = hours.filter((h) => h.weekday === wd)
        return (
          <div key={wd} className="flex items-start gap-8 border-b border-gray-100 py-8">
            <span className="w-40 pt-8 font-body text-16 text-gray-600">{label}</span>
            <div className="flex flex-1 flex-col gap-4">
              {slots.map((s) => (
                <div key={s.id} className="flex items-center gap-4">
                  <input
                    type="time"
                    value={s.open_time.slice(0, 5)}
                    onChange={(e) => update(s.id, { open_time: e.target.value })}
                    className="h-40 rounded-sm border border-gray-200 bg-white px-8 font-body text-16 tabular-nums"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={s.close_time.slice(0, 5)}
                    onChange={(e) => update(s.id, { close_time: e.target.value })}
                    className="h-40 rounded-sm border border-gray-200 bg-white px-8 font-body text-16 tabular-nums"
                  />
                  <button onClick={() => remove(s.id)} aria-label="Supprimer" className="h-40 px-8 text-error">
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={() => addSlot(wd)} className="h-40 self-start font-body text-16 text-orange-700">
                + créneau
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
