// Badges de statut — mêmes couleurs + mot que l'app mobile (état = couleur + mot).
type Tone = 'neutral' | 'info' | 'active' | 'warn' | 'ok' | 'bad'

const TONE: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  info: 'bg-lagune-500/15 text-lagune-600',
  active: 'bg-orange-500/20 text-orange-700',
  warn: 'bg-warning/20 text-navy-900',
  ok: 'bg-success/15 text-success',
  bad: 'bg-error/15 text-error',
}

const ORDER: Record<string, { label: string; tone: Tone }> = {
  EN_ATTENTE_PAIEMENT: { label: 'Attente paiement', tone: 'warn' },
  ENVOYEE_RESTAURANT: { label: 'Au restaurant', tone: 'active' },
  ACCEPTEE: { label: 'Acceptée', tone: 'info' },
  RECHERCHE_LIVREUR: { label: 'Recherche livreur', tone: 'active' },
  LIVREUR_ASSIGNE: { label: 'Livreur assigné', tone: 'info' },
  PRETE: { label: 'Prête', tone: 'info' },
  RECUPEREE: { label: 'Récupérée', tone: 'info' },
  ARRIVEE: { label: 'Arrivée', tone: 'info' },
  LIVREE: { label: 'Livrée', tone: 'ok' },
  TERMINEE: { label: 'Terminée', tone: 'ok' },
  REFUSEE: { label: 'Refusée', tone: 'bad' },
  ANNULEE: { label: 'Annulée', tone: 'bad' },
  ECHEC: { label: 'Échec', tone: 'bad' },
}

const PARCEL: Record<string, { label: string; tone: Tone }> = {
  DEVIS: { label: 'Devis', tone: 'neutral' },
  CONFIRMEE: { label: 'Confirmée', tone: 'active' },
  RECHERCHE_LIVREUR: { label: 'Recherche livreur', tone: 'active' },
  LIVREUR_ASSIGNE: { label: 'Livreur assigné', tone: 'info' },
  EN_ROUTE_RETRAIT: { label: 'Vers retrait', tone: 'info' },
  ARRIVE_RETRAIT: { label: 'Au retrait', tone: 'info' },
  RECUPERE: { label: 'Récupéré', tone: 'info' },
  EN_ROUTE_LIVRAISON: { label: 'En livraison', tone: 'info' },
  ARRIVE: { label: 'Arrivé', tone: 'info' },
  LIVRE: { label: 'Livré', tone: 'ok' },
  TERMINE: { label: 'Terminé', tone: 'ok' },
  ECHEC_LIVRAISON: { label: 'Échec', tone: 'bad' },
  RETOUR: { label: 'Retour', tone: 'warn' },
  RETOURNE: { label: 'Retourné', tone: 'neutral' },
  ANNULEE: { label: 'Annulée', tone: 'bad' },
}

const COURIER: Record<string, { label: string; tone: Tone }> = {
  HORS_LIGNE: { label: 'Hors ligne', tone: 'neutral' },
  EN_LIGNE_LIBRE: { label: 'En ligne', tone: 'ok' },
  EN_MISSION: { label: 'En mission', tone: 'active' },
  BLOQUE_CAISSE: { label: 'Bloqué caisse', tone: 'bad' },
  EN_ATTENTE: { label: 'En attente', tone: 'warn' },
  EN_REVUE: { label: 'En revue', tone: 'info' },
  APPROUVE: { label: 'Approuvé', tone: 'ok' },
  REJETE: { label: 'Rejeté', tone: 'bad' },
  SUSPENDU: { label: 'Suspendu', tone: 'bad' },
}

const GENERIC: Record<string, { label: string; tone: Tone }> = {
  EN_ATTENTE: { label: 'En attente', tone: 'warn' },
  APPROUVE: { label: 'Approuvé', tone: 'ok' },
  EXECUTE: { label: 'Exécuté', tone: 'ok' },
  REJETE: { label: 'Rejeté', tone: 'bad' },
  OUVERTE: { label: 'Ouverte', tone: 'warn' },
  OUVERT: { label: 'Ouvert', tone: 'warn' },
  TRAITEE: { label: 'Traitée', tone: 'ok' },
  PAYE: { label: 'Payé', tone: 'ok' },
  VALIDE: { label: 'Validé', tone: 'ok' },
}

const MAPS = { order: ORDER, parcel: PARCEL, courier: COURIER, generic: GENERIC } as const

export default function StatusBadge({
  status,
  kind = 'generic',
}: {
  status: string
  kind?: keyof typeof MAPS
}) {
  const entry = MAPS[kind][status] ?? { label: status, tone: 'neutral' as Tone }
  return (
    <span className={`inline-block whitespace-nowrap rounded-pill px-8 py-[2px] text-[12px] font-medium ${TONE[entry.tone]}`}>
      {entry.label}
    </span>
  )
}
