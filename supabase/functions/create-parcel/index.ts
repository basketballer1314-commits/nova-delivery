// Edge Function "create-parcel" — crée un envoi de colis (service_role).
// Valide, recalcule le prix, applique le contre-remboursement (comptes vérifiés),
// génère un code de remise 4 chiffres (stocké haché), envoie un SMS au destinataire.
import { computeParcel } from '../_shared/pricing.ts'
import { serviceClient, getUserId, json } from '../_shared/supabase.ts'
import { getSmsProvider } from '../send-sms/sms-provider.ts'

const COD_MAX = 100000

interface CreateParcelRequest {
  idempotencyKey: string
  pickupAddressId: string
  dropoffAddressId: string
  recipientName: string
  recipientPhone: string
  category?: string
  size?: 'S' | 'M' | 'L'
  weightKg?: number
  declaredValue: number
  codAmount?: number
  paymentMethod: 'cash' | 'wave' | 'orange_money'
  prohibitedAck: boolean
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function random4(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000
  return n.toString().padStart(4, '0')
}

Deno.serve(async (req) => {
  const userId = await getUserId(req)
  if (!userId) return json({ error: 'non authentifié' }, 401)

  let body: CreateParcelRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'json invalide' }, 400)
  }

  if (!body.idempotencyKey || !body.pickupAddressId || !body.dropoffAddressId || !body.paymentMethod) {
    return json({ error: 'paramètres manquants' }, 400)
  }
  if (!body.recipientName || !body.recipientPhone) return json({ error: 'destinataire incomplet' }, 400)
  if (body.prohibitedAck !== true) return json({ error: 'déclaration objets interdits requise' }, 422)
  if (!body.declaredValue || body.declaredValue <= 0) return json({ error: 'valeur déclarée obligatoire' }, 422)

  const db = serviceClient()

  // Idempotence.
  const { data: existing } = await db
    .from('parcels')
    .select('id, tracking_token, status, pricing_snapshot')
    .eq('idempotency_key', body.idempotencyKey)
    .maybeSingle()
  if (existing) {
    return json({
      parcelId: existing.id,
      trackingToken: existing.tracking_token,
      status: existing.status,
      pricing: existing.pricing_snapshot,
      reused: true,
    })
  }

  // Adresses du sender + zones.
  const { data: addrs } = await db
    .from('addresses')
    .select('id, zone_id, user_id')
    .in('id', [body.pickupAddressId, body.dropoffAddressId])
  const pickup = addrs?.find((a) => a.id === body.pickupAddressId)
  const dropoff = addrs?.find((a) => a.id === body.dropoffAddressId)
  if (!pickup || !dropoff || pickup.user_id !== userId || dropoff.user_id !== userId) {
    return json({ error: 'adresse invalide' }, 409)
  }
  if (pickup.zone_id == null || dropoff.zone_id == null) return json({ error: 'adresse hors zone' }, 409)

  // Contre-remboursement : comptes vérifiés, plafond 100 000.
  const codAmount = body.codAmount ?? 0
  if (codAmount > 0) {
    const { data: profile } = await db.from('profiles').select('verified').eq('id', userId).maybeSingle()
    if (!profile?.verified) return json({ error: 'contre-remboursement réservé aux comptes vérifiés' }, 403)
    if (codAmount > COD_MAX) return json({ error: `contre-remboursement plafonné à ${COD_MAX} FCFA` }, 422)
  }

  // Tarif + calcul.
  const { data: zp } = await db
    .from('zone_prices')
    .select('price')
    .eq('service', 'parcel')
    .eq('from_zone', pickup.zone_id)
    .eq('to_zone', dropoff.zone_id)
    .is('valid_to', null)
    .maybeSingle()
  if (!zp) return json({ error: 'tarif de zone indisponible' }, 409)

  const breakdown = computeParcel({ baseFee: zp.price, weightKg: body.weightKg ?? 0, codAmount })

  // Code de remise 4 chiffres : stocké haché, renvoyé en clair une fois.
  const deliveryCode = random4()
  const otpHash = await sha256Hex(deliveryCode)

  const { data: parcel, error: insErr } = await db
    .from('parcels')
    .insert({
      sender_id: userId,
      status: 'CONFIRMEE',
      pickup_address_id: body.pickupAddressId,
      dropoff_address_id: body.dropoffAddressId,
      zone_from: pickup.zone_id,
      zone_to: dropoff.zone_id,
      weight_kg: body.weightKg ?? null,
      declared_value: body.declaredValue,
      cod_amount: codAmount,
      recipient_name: body.recipientName,
      recipient_phone: body.recipientPhone,
      payment_method: body.paymentMethod,
      price: breakdown.clientTotal,
      category: body.category ?? null,
      size: body.size ?? null,
      prohibited_ack: true,
      otp_hash: otpHash,
      pricing_snapshot: breakdown,
      idempotency_key: body.idempotencyKey,
    })
    .select('id, tracking_token')
    .single()
  if (insErr || !parcel) return json({ error: 'création colis échouée', detail: insErr?.message }, 500)

  // SMS au destinataire : code de remise + lien de suivi.
  const webDomain = Deno.env.get('WEB_DOMAIN') ?? 'https://nova-delivery.app'
  const trackUrl = `${webDomain}/suivi/${parcel.tracking_token}`
  try {
    const sms = getSmsProvider()
    await sms.send(
      body.recipientPhone,
      `NOVA : un colis arrive pour vous. Code de remise : ${deliveryCode}. Suivi : ${trackUrl}`,
    )
  } catch (_e) {
    // L'échec SMS ne bloque pas la création ; à reprendre via file de retry plus tard.
  }

  return json({
    parcelId: parcel.id,
    trackingToken: parcel.tracking_token,
    deliveryCode,
    trackUrl,
    pricing: breakdown,
  })
})
