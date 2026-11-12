// Edge Function "create-order" — crée une commande repas (service_role).
// Revalide le panier, recalcule le prix, applique le promo, vérifie les
// règles espèces, exige une idempotency_key, enregistre pricing_snapshot.
import { computeFoodOrder } from '../_shared/pricing.ts'
import { serviceClient, getUserId, json } from '../_shared/supabase.ts'

const CASH_NEW_CLIENT_LIMIT = 15000
const CASH_NEW_CLIENT_MIN_ORDERS = 3

interface OrderItem {
  menuItemId: string
  quantity: number
}
interface CreateOrderRequest {
  idempotencyKey: string
  restaurantId: string
  items: OrderItem[]
  addressId: string
  paymentMethod: 'cash' | 'wave' | 'orange_money'
  promoCode?: string
  instructionsResto?: string
  instructionsLivreur?: string
}

Deno.serve(async (req) => {
  const userId = await getUserId(req)
  if (!userId) return json({ error: 'non authentifié' }, 401)

  let body: CreateOrderRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'json invalide' }, 400)
  }
  if (!body.idempotencyKey || !body.restaurantId || !body.addressId || !body.paymentMethod) {
    return json({ error: 'paramètres manquants' }, 400)
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return json({ error: 'panier vide' }, 400)
  }

  const db = serviceClient()

  // 1. Idempotence : renvoyer la commande déjà créée.
  const { data: existing } = await db
    .from('orders')
    .select('id, status, pricing_snapshot')
    .eq('idempotency_key', body.idempotencyKey)
    .maybeSingle()
  if (existing) {
    return json({ orderId: existing.id, status: existing.status, pricing: existing.pricing_snapshot, reused: true })
  }

  // 2. Compte client : signalement + adresse.
  const { data: profile } = await db.from('profiles').select('status').eq('id', userId).maybeSingle()
  if (!profile) return json({ error: 'profil introuvable' }, 404)

  const { data: address } = await db
    .from('addresses')
    .select('id, zone_id, user_id')
    .eq('id', body.addressId)
    .maybeSingle()
  if (!address || address.user_id !== userId) return json({ error: 'adresse invalide' }, 409)
  if (address.zone_id == null) return json({ error: 'adresse hors zone' }, 409)

  // 3. Restaurant ouvert + commission.
  const { data: resto } = await db
    .from('restaurants')
    .select('id, zone_id, status, commission_rate')
    .eq('id', body.restaurantId)
    .maybeSingle()
  if (!resto) return json({ error: 'restaurant introuvable' }, 404)
  if (resto.status !== 'ACTIF') return json({ error: 'restaurant fermé' }, 409)
  if (resto.zone_id == null) return json({ error: 'restaurant sans zone' }, 409)

  // 4. Articles disponibles + total recalculé serveur.
  const ids = body.items.map((i) => i.menuItemId)
  const { data: menuItems, error: menuErr } = await db
    .from('menu_items')
    .select('id, name, price, available, restaurant_id')
    .in('id', ids)
  if (menuErr) return json({ error: 'erreur menu' }, 500)

  let itemsTotal = 0
  const lineRows: { menu_item_id: string; name_snapshot: string; unit_price: number; quantity: number; line_total: number }[] = []
  for (const it of body.items) {
    const mi = menuItems?.find((m) => m.id === it.menuItemId)
    if (!mi || mi.restaurant_id !== body.restaurantId) return json({ error: `article invalide: ${it.menuItemId}` }, 409)
    if (!mi.available) return json({ error: `article indisponible: ${it.menuItemId}` }, 409)
    if (it.quantity <= 0) return json({ error: 'quantité invalide' }, 400)
    const lineTotal = mi.price * it.quantity
    itemsTotal += lineTotal
    lineRows.push({
      menu_item_id: mi.id,
      name_snapshot: mi.name,
      unit_price: mi.price,
      quantity: it.quantity,
      line_total: lineTotal,
    })
  }

  // 5. Frais de livraison (food, zone resto → zone adresse).
  const { data: zp } = await db
    .from('zone_prices')
    .select('price')
    .eq('service', 'food')
    .eq('from_zone', resto.zone_id)
    .eq('to_zone', address.zone_id)
    .is('valid_to', null)
    .maybeSingle()
  if (!zp) return json({ error: 'tarif de zone indisponible' }, 409)

  // 6. Frais de service + offre 1re commande.
  const { data: settings } = await db
    .from('settings')
    .select('key, value')
    .in('key', ['service_fee_fcfa', 'service_fee_free_first_order'])
  const serviceFeeBase = Number(settings?.find((s) => s.key === 'service_fee_fcfa')?.value ?? 100)
  const freeFirst = settings?.find((s) => s.key === 'service_fee_free_first_order')?.value === true

  const { count: totalOrders } = await db
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', userId)
  const isFirstOrder = (totalOrders ?? 0) === 0
  const serviceFee = freeFirst && isFirstOrder ? 0 : serviceFeeBase

  // 7. Promo : active, non expirée, budget global, plafond par client.
  let discount = 0
  let promoId: string | null = null
  if (body.promoCode) {
    const { data: promo } = await db
      .from('promotions')
      .select('id, discount_type, discount_value, valid_from, valid_to, max_redemptions, active')
      .eq('code', body.promoCode)
      .maybeSingle()
    const now = new Date()
    if (
      promo &&
      promo.active &&
      new Date(promo.valid_from) <= now &&
      (!promo.valid_to || new Date(promo.valid_to) >= now)
    ) {
      const { count: totalRedeems } = await db
        .from('promo_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('promo_id', promo.id)
      const { count: myRedeems } = await db
        .from('promo_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('promo_id', promo.id)
        .eq('user_id', userId)
      const budgetOk = promo.max_redemptions == null || (totalRedeems ?? 0) < promo.max_redemptions
      const perClientOk = (myRedeems ?? 0) === 0 // un usage par client
      if (budgetOk && perClientOk) {
        discount =
          promo.discount_type === 'percent'
            ? Math.round((itemsTotal * promo.discount_value) / 100)
            : promo.discount_value
        promoId = promo.id
      }
    }
  }

  const breakdown = computeFoodOrder({
    itemsTotal,
    deliveryFee: zp.price,
    commissionRatePct: Number(resto.commission_rate),
    serviceFee,
    discount,
  })

  // 8. Règles espèces.
  if (body.paymentMethod === 'cash') {
    if (profile.status !== 'active') return json({ error: 'compte signalé : espèces refusées' }, 403)
    const { count: successfulOrders } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', userId)
      .in('status', ['LIVREE', 'TERMINEE'])
    if ((successfulOrders ?? 0) < CASH_NEW_CLIENT_MIN_ORDERS && breakdown.clientTotal > CASH_NEW_CLIENT_LIMIT) {
      return json({ error: `espèces plafonnées à ${CASH_NEW_CLIENT_LIMIT} FCFA pour un nouveau client` }, 403)
    }
  }

  // 9. Statut initial selon le paiement.
  const status = body.paymentMethod === 'cash' ? 'ENVOYEE_RESTAURANT' : 'EN_ATTENTE_PAIEMENT'

  // 10. Insert commande + lignes.
  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert({
      customer_id: userId,
      restaurant_id: body.restaurantId,
      status,
      delivery_address_id: body.addressId,
      zone_from: resto.zone_id,
      zone_to: address.zone_id,
      payment_method: body.paymentMethod,
      items_total: breakdown.itemsTotal,
      delivery_fee: breakdown.deliveryFee,
      service_fee: breakdown.serviceFee,
      discount_total: breakdown.discount,
      total: breakdown.clientTotal,
      pricing_snapshot: { ...breakdown, instructionsResto: body.instructionsResto ?? null, instructionsLivreur: body.instructionsLivreur ?? null },
      idempotency_key: body.idempotencyKey,
    })
    .select('id, status')
    .single()
  if (orderErr || !order) return json({ error: 'création commande échouée', detail: orderErr?.message }, 500)

  await db.from('order_items').insert(lineRows.map((r) => ({ ...r, order_id: order.id })))
  if (promoId) {
    await db.from('promo_redemptions').insert({ promo_id: promoId, user_id: userId, order_id: order.id })
  }

  return json({ orderId: order.id, status: order.status, pricing: breakdown })
})
