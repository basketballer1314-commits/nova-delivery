const NBSP = ' '

// "4 500 FCFA" — chiffres tabulaires, espace insécable.
export function formatFcfa(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0))
  const grouped = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return `${n < 0 ? '-' : ''}${grouped}${NBSP}FCFA`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })
}
