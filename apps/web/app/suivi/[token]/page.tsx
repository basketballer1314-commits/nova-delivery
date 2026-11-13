import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

interface TrackResult {
  found: boolean
  expired?: boolean
  status?: string
  recipient_name?: string | null
  courier_first_name?: string | null
  courier_lat?: number | null
  courier_lng?: number | null
  amount_to_pay?: number
}

const STATUS_LABELS: Record<string, string> = {
  DEVIS: 'Devis',
  CONFIRMEE: 'Confirmée',
  RECHERCHE_LIVREUR: 'Recherche d’un livreur',
  LIVREUR_ASSIGNE: 'Livreur assigné',
  EN_ROUTE_RETRAIT: 'En route pour le retrait',
  ARRIVE_RETRAIT: 'Arrivé au retrait',
  RECUPERE: 'Colis récupéré',
  EN_ROUTE_LIVRAISON: 'En route pour la livraison',
  ARRIVE: 'Arrivé',
  LIVRE: 'Livré',
  TERMINE: 'Terminé',
  ECHEC_LIVRAISON: 'Échec de livraison',
  RETOUR: 'Retour',
  RETOURNE: 'Retourné',
  ANNULEE: 'Annulée',
}

function formatFcfa(amount: number): string {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}

export default async function SuiviPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data } = await supabase.rpc('track_parcel', { _token: token })
  const result = (data ?? { found: false }) as unknown as TrackResult

  if (!result.found) {
    return (
      <main className="min-h-screen bg-sand-100 flex items-center justify-center p-20">
        <p className="text-gray-600 text-center">Colis introuvable. Vérifiez votre lien.</p>
      </main>
    )
  }

  if (result.expired) {
    return (
      <main className="min-h-screen bg-sand-100 flex items-center justify-center p-20">
        <p className="text-gray-600 text-center">Ce lien de suivi a expiré.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sand-100 p-20">
      <div className="max-w-md mx-auto space-y-24">
        <header>
          <p className="text-lagune-600 font-semibold">NOVA — Suivi de colis</p>
          <h1 className="text-navy-900 text-2xl font-bold mt-4">
            {STATUS_LABELS[result.status ?? ''] ?? result.status}
          </h1>
        </header>

        <section className="bg-white rounded-2xl p-20 shadow space-y-16">
          {result.recipient_name ? (
            <Row label="Destinataire" value={result.recipient_name} />
          ) : null}
          {result.courier_first_name ? (
            <Row label="Livreur" value={result.courier_first_name} />
          ) : (
            <Row label="Livreur" value="En recherche…" />
          )}
          {result.courier_lat != null && result.courier_lng != null ? (
            <Row
              label="Position du livreur"
              value={`${result.courier_lat.toFixed(4)}, ${result.courier_lng.toFixed(4)}`}
            />
          ) : null}
          <Row
            label="Montant à payer"
            value={result.amount_to_pay ? formatFcfa(result.amount_to_pay) : 'Aucun'}
            highlight
          />
        </section>

        <p className="text-gray-500 text-sm text-center">
          Le code de remise vous a été envoyé par SMS. Communiquez-le au livreur à la réception.
        </p>
      </div>
    </main>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={highlight ? 'text-navy-900 font-bold text-lg' : 'text-navy-900 font-medium'}>
        {value}
      </span>
    </div>
  )
}
