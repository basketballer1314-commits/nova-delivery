// Ouverture d'un restaurant selon ses horaires (pur, testable).
export interface Hour {
  weekday: number // 0 = dimanche
  open_time: string // 'HH:MM' ou 'HH:MM:SS'
  close_time: string
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

export interface OpenState {
  open: boolean
  opensAt: string | null // 'HH:MM' du prochain créneau du jour, si fermé
}

export function restaurantOpenState(hours: Hour[], now: Date): OpenState {
  const weekday = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const today = hours.filter((h) => h.weekday === weekday)

  for (const h of today) {
    if (minutes >= toMinutes(h.open_time) && minutes < toMinutes(h.close_time)) {
      return { open: true, opensAt: null }
    }
  }
  // Prochain créneau à venir aujourd'hui.
  const upcoming = today
    .map((h) => h.open_time.slice(0, 5))
    .filter((t) => toMinutes(t) > minutes)
    .sort()
  return { open: false, opensAt: upcoming[0] ?? today[0]?.open_time.slice(0, 5) ?? null }
}
