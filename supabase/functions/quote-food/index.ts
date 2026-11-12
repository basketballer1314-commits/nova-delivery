// Edge Function "quote-food" — calcule le détail d'une commande repas.
// Lit les prix en base (zone_prices, taux du restaurant valides ce jour),
// renvoie le détail affiché par l'écran panier. Aucune écriture.
import { computeFoodOrder } from '../_shared/pricing.ts'
import { serviceClient, getUserId, json } from '../_shared/supabase.ts'

interface QuoteItem {
  menuItemId: string
  quantity: number
}
interface QuoteRequest {
  restaurantId: string
  items: QuoteItem[]
  toZone: number
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
  if (!body.restaurantId || !Array.isArray(body.items) || body.items.length === 0 || !body.toZone) {
    return json({ error: 'paramètres manquants' }, 400)
  }

  const db = serviceClient()

  // Restaurant + commission valide à ce jour.
  const { data: resto, error: restoErr } = await db
    .from('restaurants')
    .select('id, zone_id, status, commission_rate, commission_valid_from, commission_valid_to')
    .eq('id', body.restaurantId)
    .maybeSingle()
  if (restoErr || !resto) return json({ error: 'restaurant introuvable' }, 404)
  if (resto.zone_id == null) return json({ error: 'restaurant sans zone' }, 409)

  // Articles : prix réels + disponibilité.
  const ids = body.items.map((i) => i.menuItemId)
  const { data: menuItems, error: menuErr } = await db
    .from('menu_items')
    .select('id, price, available, restaurant_id')
    .in('id', ids)
  if (menuErr) return json({ error: 'erreur menu' }, 500)

  let itemsTotal = 0
  for (const it of body.items) {
    const mi = menuItems?.find((m) => m.id === it.menuItemId)
    if (!mi || mi.restaurant_id !== body.restaurantId) {
      return json({ error: `article invalide: ${it.menuItemId}` }, 409)
    }
    if (!mi.available) return json({ error: `article indisponible: ${it.menuItemId}` }, 409)
    if (it.quantity <= 0) return json({ error: 'quantité invalide' }, 400)
    itemsTotal += mi.price * it.quantity
  }

  // Frais de livraison : prix actif pour food, from zone resto → to zone client.
  const { data: zp, error: zpErr } = await db
    .from('zone_prices')
    .select('price')
    .eq('service', 'food')
    .eq('from_zone', resto.zone_id)
    .eq('to_zone', body.toZone)
    .is('valid_to', null)
    .maybeSingle()
  if (zpErr || !zp) return json({ error: 'tarif de zone indisponible' }, 409)

  // Frais de service + offre 1re commande.
  const { data: settings } = await db
    .from('settings')
    .select('key, value')
    .in('key', ['service_fee_fcfa', 'service_fee_free_first_order'])
  const serviceFeeBase = Number(settings?.find((s) => s.key === 'service_fee_fcfa')?.value ?? 100)
  const freeFirst = settings?.find((s) => s.key === 'service_fee_free_first_order')?.value === true

  const { count: orderCount } = await db
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', userId)
  const isFirstOrder = (orderCount ?? 0) === 0
  const serviceFee = freeFirst && isFirstOrder ? 0 : serviceFeeBase

  const breakdown = computeFoodOrder({
    itemsTotal,
    deliveryFee: zp.price,
    commissionRatePct: Number(resto.commission_rate),
    serviceFee,
  })

  return json({ breakdown, isFirstOrder })
})
