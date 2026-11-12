// Tests Deno — exemples EXACTS du §11.2.
// Lancer : deno test supabase/functions/_shared/
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { computeFoodOrder, computeParcel } from './pricing.ts'

Deno.test('§11.2 — repas 6000 Mbour→Mbour, commission 10 %', () => {
  const r = computeFoodOrder({ itemsTotal: 6000, deliveryFee: 700, commissionRatePct: 10, serviceFee: 100 })
  assertEquals(r.clientTotal, 6800)
  assertEquals(r.restoPayout, 5400)
  assertEquals(r.courierShare, 560)
  assertEquals(r.platformShare, 840)
})

Deno.test('§11.2 — colis Mbour→Saly', () => {
  const r = computeParcel({ baseFee: 1500 })
  assertEquals(r.clientTotal, 1500)
  assertEquals(r.courierShare, 1200)
  assertEquals(r.platformShare, 300)
})

Deno.test('§11.2 — colis COD 20000 → frais 1700', () => {
  const r = computeParcel({ baseFee: 1500, codAmount: 20000 })
  assertEquals(r.codFee, 200)
  assertEquals(r.clientTotal, 1700)
})

Deno.test('§11.2 — colis Mbour→Somone 8 kg', () => {
  const r = computeParcel({ baseFee: 2500, weightKg: 8 })
  assertEquals(r.clientTotal, 3000)
  assertEquals(r.courierShare, 2400)
  assertEquals(r.platformShare, 600)
})
