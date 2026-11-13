// Interface PaymentProvider — à implémenter par l'agrégateur branché à ~30 cmd/jour.
// Tant que PAYMENT_WEBHOOK_ENABLED != 'true', le webhook reste inactif.

export interface PaymentEvent {
  /** Identifiant unique de l'événement chez l'agrégateur (idempotence). */
  providerEventId: string
  /** Référence courte affichée au client (motif), ex. "A-2318". */
  reference: string
  /** Montant payé en FCFA (entier). */
  amount: number
  /** 'paid' = capturé ; autres = ignoré pour l'instant. */
  status: 'paid' | 'failed' | 'pending'
  method: 'wave' | 'orange_money'
}

export interface PaymentProvider {
  /** Vérifie la signature du webhook (HMAC). Rejette si invalide. */
  verifySignature(rawBody: string, headers: Headers): Promise<boolean>
  /** Transforme le corps brut en événement normalisé. */
  parseEvent(rawBody: string): PaymentEvent
}

/** Implémentation générique HMAC-SHA256 (header "x-signature"). */
export class HmacProvider implements PaymentProvider {
  constructor(private secret: string) {}

  async verifySignature(rawBody: string, headers: Headers): Promise<boolean> {
    const sig = headers.get('x-signature')
    if (!sig || !this.secret) return false
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
    // Comparaison à temps constant
    if (hex.length !== sig.length) return false
    let diff = 0
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i)
    return diff === 0
  }

  parseEvent(rawBody: string): PaymentEvent {
    const b = JSON.parse(rawBody)
    return {
      providerEventId: String(b.id ?? b.event_id),
      reference: String(b.reference ?? b.merchant_reference),
      amount: Number(b.amount),
      status: b.status === 'paid' || b.status === 'success' ? 'paid' : b.status === 'failed' ? 'failed' : 'pending',
      method: b.method === 'orange_money' ? 'orange_money' : 'wave',
    }
  }
}
