const NBSP = ' '

// "4 500 FCFA" — séparateur de milliers et espace avant FCFA en espace insécable.
export function formatFcfa(amount: number): string {
  const n = Math.round(amount)
  const grouped = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return `${n < 0 ? '-' : ''}${grouped}${NBSP}FCFA`
}

// "il y a 40 s" / "il y a 3 min"
export function secondsAgoLabel(seconds: number): string {
  if (seconds < 60) return `il y a ${seconds}${NBSP}s`
  const m = Math.floor(seconds / 60)
  return `il y a ${m}${NBSP}min`
}
