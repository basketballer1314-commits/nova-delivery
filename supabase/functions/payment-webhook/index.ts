// Edge Function "payment-webhook" — réception des paiements de l'agrégateur.
// INACTIVE par défaut : activer avec PAYMENT_WEBHOOK_ENABLED=true quand on branche
// l'agrégateur (~30 commandes/jour). Signature vérifiée, idempotence, rattachement
// unique à une commande (via la référence courte A-####).
import { serviceClient, json } from '../_shared/supabase.ts'
import { HmacProvider, type PaymentProvider } from './provider.ts'

Deno.serve(async (req) => {
  if (Deno.env.get('PAYMENT_WEBHOOK_ENABLED') !== 'true') {
    return json({ error: 'webhook désactivé' }, 503)
  }

  const raw = await req.text()
  const provider: PaymentProvider = new HmacProvider(Deno.env.get('PAYMENT_WEBHOOK_SECRET') ?? '')

  if (!(await provider.verifySignature(raw, req.headers))) {
    return json({ error: 'signature invalide' }, 401)
  }

  let ev
  try {
    ev = provider.parseEvent(raw)
  } catch {
    return json({ error: 'payload invalide' }, 400)
  }
  if (ev.status !== 'paid') return json({ ignored: true, status: ev.status })

  const db = serviceClient()
  const idempotencyKey = `provider:${ev.providerEventId}`

  // Idempotence : événement déjà traité ?
  const { data: existing } = await db
    .from('payments')
    .select('id, order_id, status')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existing) return json({ reused: true, orderId: existing.order_id })

  // Rattachement unique : une commande EN_ATTENTE_PAIEMENT pour cette référence.
  const { data: order } = await db
    .from('orders')
    .select('id, total, status, payment_method')
    .eq('payment_ref', ev.reference)
    .maybeSingle()
  if (!order) return json({ error: 'référence inconnue' }, 404)
  if (order.status !== 'EN_ATTENTE_PAIEMENT') return json({ error: 'commande déjà traitée' }, 409)
  if (ev.amount !== order.total) return json({ error: 'montant incohérent' }, 409)

  // Paiement : insert idempotent (idempotency_key unique en base).
  const { error: payErr } = await db
    .from('payments')
    .insert({
      order_id: order.id,
      method: order.payment_method,
      amount: order.total,
      status: 'PAYE',
      idempotency_key: idempotencyKey,
      provider_ref: ev.reference,
    })
  if (payErr) return json({ error: 'paiement déjà enregistré', detail: payErr.message }, 409)

  // Commande envoyée au restaurant + écriture comptable (capture mobile).
  await db.from('orders').update({ status: 'ENVOYEE_RESTAURANT' }).eq('id', order.id)
  await db.rpc('post_ledger', {
    _kind: 'mobile_capture',
    _idempotency: `capture:${order.id}`,
    _payload: { order_id: order.id, amount: order.total, reference: ev.reference },
  })

  return json({ success: true, orderId: order.id })
})
