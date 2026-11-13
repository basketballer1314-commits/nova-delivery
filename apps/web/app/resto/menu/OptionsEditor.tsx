'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Database } from '@nova/shared'
import { useResto } from '../RestoProvider'
import { formatFcfa } from '../../../lib/format'

type Group = Database['public']['Tables']['option_groups']['Row']
type Option = Database['public']['Tables']['options']['Row']

export default function OptionsEditor({ itemId }: { itemId: string }) {
  const { supabase, dict } = useResto()
  const [groups, setGroups] = useState<Group[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [newGroup, setNewGroup] = useState('')

  const load = useCallback(async () => {
    const { data: g } = await supabase.from('option_groups').select('*').eq('item_id', itemId)
    const gs = (g ?? []) as Group[]
    setGroups(gs)
    if (gs.length) {
      const { data: o } = await supabase
        .from('options')
        .select('*')
        .in('group_id', gs.map((x) => x.id))
      setOptions((o ?? []) as Option[])
    } else {
      setOptions([])
    }
  }, [supabase, itemId])

  useEffect(() => {
    void load()
  }, [load])

  async function addGroup() {
    if (!newGroup.trim()) return
    await supabase.rpc('resto_add_option_group', {
      _item_id: itemId,
      _name: newGroup.trim(),
      _min_select: 0,
      _max_select: 1,
      _required: false,
    })
    setNewGroup('')
    void load()
  }
  async function delGroup(id: string) {
    await supabase.rpc('resto_delete_option_group', { _group_id: id })
    void load()
  }
  async function addOption(groupId: string, name: string, delta: number) {
    await supabase.rpc('resto_add_option', { _group_id: groupId, _name: name, _price_delta: delta })
    void load()
  }
  async function delOption(id: string) {
    await supabase.rpc('resto_delete_option', { _option_id: id })
    void load()
  }

  return (
    <div className="mt-12 flex flex-col gap-12 border-t border-gray-100 pt-12">
      {groups.map((g) => (
        <div key={g.id} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-16 font-semibold">
              {g.name}
              {g.required ? ` · ${dict.required}` : ''}
            </span>
            <button onClick={() => delGroup(g.id)} aria-label="Supprimer" className="px-8 text-error">
              ✕
            </button>
          </div>
          {options
            .filter((o) => o.group_id === g.id)
            .map((o) => (
              <div key={o.id} className="flex items-center justify-between pl-12 font-body text-[14px]">
                <span>
                  {o.name} {o.price_delta ? `(+${formatFcfa(o.price_delta)})` : ''}
                </span>
                <button onClick={() => delOption(o.id)} aria-label="Supprimer" className="px-8 text-error">
                  ✕
                </button>
              </div>
            ))}
          <AddOption onAdd={(n, d) => addOption(g.id, n, d)} label={dict.addOption} />
        </div>
      ))}

      <div className="flex gap-8">
        <input
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          placeholder={dict.addGroup}
          className="h-40 flex-1 rounded-sm border border-gray-200 px-12 font-body text-16"
        />
        <button onClick={addGroup} className="h-40 rounded-pill bg-orange-600 px-16 font-heading text-[14px] text-white">
          +
        </button>
      </div>
    </div>
  )
}

function AddOption({ onAdd, label }: { onAdd: (name: string, delta: number) => void; label: string }) {
  const [name, setName] = useState('')
  const [delta, setDelta] = useState('')
  return (
    <div className="flex items-center gap-4 pl-12">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={label}
        className="h-40 flex-1 rounded-sm border border-gray-200 px-8 font-body text-[14px]"
      />
      <input
        type="number"
        inputMode="numeric"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        placeholder="+0"
        className="h-40 w-20 rounded-sm border border-gray-200 px-8 font-body text-[14px] tabular-nums"
      />
      <button
        onClick={() => {
          if (name.trim()) {
            onAdd(name.trim(), parseInt(delta, 10) || 0)
            setName('')
            setDelta('')
          }
        }}
        className="h-40 px-8 text-orange-700"
      >
        +
      </button>
    </div>
  )
}
