// Edge Function "quote-parcel" — calcule le détail d'un envoi de colis.
// Lit zone_prices (parcel), applique computeParcel. Aucune écriture.
import { computeParcel } from '../_shared/pricing.ts'
import { serviceClient, getUserId, json } from '../_shared/supabase.ts'

interface QuoteRequest {
  fromZone: number
  toZone: number
  weightKg?: number
  codAmount?: number
}

Deno.serve(async (req) => {
  const userId = await getUserId(req)
  if (!userId) return json({ error: 'non authentifié' }, 401)

  let body: QuoteRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'json invalide' }, 400)
  }
  if (!body.fromZone || !body.toZone) return json({ error: 'zones manquantes' }, 400)

  const db = serviceClient()
  const { data: zp, error } = await db
    .from('zone_prices')
    .select('price')
    .eq('service', 'parcel')
    .eq('from_zone', body.fromZone)
    .eq('to_zone', body.toZone)
    .is('valid_to', null)
    .maybeSingle()
  if (error || !zp) return json({ error: 'tarif de zone indisponible' }, 409)

  const breakdown = computeParcel({
    baseFee: zp.price,
    weightKg: body.weightKg ?? 0,
    codAmount: body.codAmount ?? 0,
  })

  return json({ breakdown })
})
