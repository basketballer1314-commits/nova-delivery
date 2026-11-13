'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from '../RestoProvider'

type Staff = Database['public']['Functions']['resto_list_staff']['Returns'][number]

export default function StaffPage() {
  const { supabase, current, dict } = useResto()
  const [staff, setStaff] = useState<Staff[]>([])
  const [phone, setPhone] = useState('+221')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('resto_list_staff', { _restaurant_id: current.id })
    setStaff((data ?? []) as Staff[])
  }, [supabase, current.id])

  useEffect(() => {
    if (current.is_owner) void load()
  }, [load, current.is_owner])

  async function add() {
    setError(null)
    const p = phone.replace(/\s/g, '')
    if (!/^\+[0-9]{8,15}$/.test(p)) {
      setError('Format +221…')
      return
    }
    setBusy(true)
    const { error } = await supabase.rpc('resto_add_staff', { _restaurant_id: current.id, _phone: p })
    setBusy(false)
    if (error) setError(error.message)
    else {
      setPhone('+221')
      void load()
    }
  }
  async function remove(userId: string) {
    await supabase.rpc('resto_remove_staff', { _restaurant_id: current.id, _user_id: userId })
    void load()
  }

  if (!current.is_owner) {
    return <p className="mt-32 text-center font-body text-16 text-gray-500">{dict.ownerOnly}</p>
  }

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-heading text-4xl font-semibold text-navy-900">{dict.navStaff}</h1>

      <div className="flex flex-col gap-8">
        {staff.map((m) => {
          const isOwner = m.member_role === 'resto_owner'
          return (
            <div key={m.user_id} className="flex items-center gap-12 rounded-md border border-gray-200 bg-white p-12">
              <div className="flex flex-1 flex-col">
                <span className="font-body text-16 font-semibold text-navy-900">{m.full_name ?? m.phone}</span>
                <span className="font-body text-[13px] tabular-nums text-gray-500">{m.phone}</span>
              </div>
              <span className="font-body text-[13px] text-gray-500">{isOwner ? dict.owner : dict.staff}</span>
              {!isOwner && (
                <button onClick={() => remove(m.user_id)} className="h-40 rounded-pill border-2 border-error px-12 font-body text-[14px] text-error">
                  {dict.remove}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-8">
        <label className="font-body text-16 text-gray-600">{dict.staffPhone}</label>
        <div className="flex gap-8">
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-56 flex-1 rounded-md border border-gray-200 bg-white px-16 font-body text-16 tabular-nums"
            placeholder="+221 77 000 00 00"
          />
          <button
            onClick={add}
            disabled={busy}
            className="h-56 rounded-pill bg-orange-600 px-20 font-heading text-16 text-white disabled:opacity-50"
          >
            {dict.addStaff}
          </button>
        </div>
        {error && <p className="font-body text-16 text-error">{error}</p>}
      </div>
    </div>
  )
}
