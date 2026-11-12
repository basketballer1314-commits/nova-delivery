// Vérifie les 4 exemples EXACTS du §11.2 (exécuté par vitest, Deno non requis).
import { describe, expect, it } from 'vitest'
import { computeFoodOrder, computeParcel } from '../../../../supabase/functions/_shared/pricing'

describe('§11.2 pricing', () => {
  it('repas 6000 Mbour→Mbour, commission 10 %', () => {
    const r = computeFoodOrder({ itemsTotal: 6000, deliveryFee: 700, commissionRatePct: 10, serviceFee: 100 })
    expect(r.clientTotal).toBe(6800)
    expect(r.restoPayout).toBe(5400)
    expect(r.courierShare).toBe(560)
    expect(r.platformShare).toBe(840)
  })

  it('colis Mbour→Saly', () => {
    const r = computeParcel({ baseFee: 1500 })
    expect(r.clientTotal).toBe(1500)
    expect(r.courierShare).toBe(1200)
    expect(r.platformShare).toBe(300)
  })

  it('colis COD 20000 → frais 1700', () => {
    const r = computeParcel({ baseFee: 1500, codAmount: 20000 })
    expect(r.codFee).toBe(200)
    expect(r.clientTotal).toBe(1700)
  })

  it('colis Mbour→Somone 8 kg', () => {
    const r = computeParcel({ baseFee: 2500, weightKg: 8 })
    expect(r.clientTotal).toBe(3000)
    expect(r.courierShare).toBe(2400)
    expect(r.platformShare).toBe(600)
  })
})
