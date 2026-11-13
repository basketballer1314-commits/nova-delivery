// Export CSV simple (séparateur ';' pour Excel FR, BOM UTF-8).
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    rows = [{ info: 'aucune donnée' }]
  }
  const headers = Object.keys(rows[0]!)
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(';')).join('\n')
  const csv = '﻿' + headers.join(';') + '\n' + body
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
