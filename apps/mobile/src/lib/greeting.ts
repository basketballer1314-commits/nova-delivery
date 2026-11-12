// Salutation selon l'heure (pure, testable).
export function greeting(hour: number): 'morning' | 'evening' {
  return hour >= 5 && hour < 18 ? 'morning' : 'evening'
}

// Premier mot d'un nom complet.
export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? ''
}
