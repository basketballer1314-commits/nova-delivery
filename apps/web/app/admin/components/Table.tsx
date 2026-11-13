// Tableau desktop — Inter 13, en-têtes gris, montants alignés à droite (tabulaires).
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  numeric?: boolean
  width?: string
}

export default function Table<T>({
  columns,
  rows,
  empty = 'Aucune donnée.',
  rowKey,
}: {
  columns: Column<T>[]
  rows: T[]
  empty?: string
  rowKey: (row: T, i: number) => string
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-100/60">
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={`px-12 py-8 font-medium text-gray-600 ${c.numeric ? 'text-right tabular-nums' : 'text-left'}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-12 py-24 text-center text-gray-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={rowKey(row, i)} className="border-b border-gray-100 last:border-0 hover:bg-sand-100/50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-12 py-8 text-navy-900 ${c.numeric ? 'text-right tabular-nums' : 'text-left'}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
