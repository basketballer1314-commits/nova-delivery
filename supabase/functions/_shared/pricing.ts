// ============================================================
// Nova Delivery — Calculs de prix (PURS, aucun accès base)
// Tout en entiers FCFA. Partagé par les Edge Functions.
// Référence : §11.2 du dossier.
// ============================================================

export const SERVICE_FEE_DEFAULT = 100
export const COURIER_SHARE = 0.8 // livreur 80 % / plateforme 20 %
export const COD_MIN = 200
export const COD_RATE = 0.01
export const HEAVY_PARCEL_SUPPLEMENT = 500
export const HEAVY_MIN_KG = 5
export const HEAVY_MAX_KG = 15

/** Commission restaurant (entier) sur le total des articles. */
export function commissionAmount(itemsTotal: number, ratePct: number): number {
  return Math.round((itemsTotal * ratePct) / 100)
}

/** Répartition 80 % livreur / 20 % plateforme d'une base (entiers, somme conservée). */
export function split8020(base: number): { courier: number; platform: number } {
  const courier = Math.round(base * COURIER_SHARE)
  return { courier, platform: base - courier }
}

/** Frais de contre-remboursement : max(200 ; 1 %). 0 si pas de COD. */
export function codFee(amount: number): number {
  if (amount <= 0) return 0
  return Math.max(COD_MIN, Math.round(amount * COD_RATE))
}

/** Supplément colis lourd : +500 pour 5 < kg <= 15, sinon 0. */
export function heavyParcelSupplement(weightKg: number): number {
  return weightKg > HEAVY_MIN_KG && weightKg <= HEAVY_MAX_KG ? HEAVY_PARCEL_SUPPLEMENT : 0
}

export interface FoodOrderInput {
  itemsTotal: number
  deliveryFee: number
  commissionRatePct: number
  serviceFee?: number
  discount?: number
  /** Suppléments nuit/pluie/attente — 100 % livreur. */
  courierSupplements?: number
}

export interface FoodOrderBreakdown {
  itemsTotal: number
  deliveryFee: number
  serviceFee: number
  discount: number
  commission: number
  clientTotal: number
  restoPayout: number
  courierShare: number
  platformShare: number
}

export function computeFoodOrder(input: FoodOrderInput): FoodOrderBreakdown {
  const serviceFee = input.serviceFee ?? SERVICE_FEE_DEFAULT
  const discount = input.discount ?? 0
  const supplements = input.courierSupplements ?? 0

  const commission = commissionAmount(input.itemsTotal, input.commissionRatePct)
  const { courier, platform } = split8020(input.deliveryFee)

  const clientTotal = input.itemsTotal + input.deliveryFee + serviceFee - discount
  const restoPayout = input.itemsTotal - commission
  const courierShare = courier + supplements
  const platformShare = commission + platform + serviceFee

  return {
    itemsTotal: input.itemsTotal,
    deliveryFee: input.deliveryFee,
    serviceFee,
    discount,
    commission,
    clientTotal,
    restoPayout,
    courierShare,
    platformShare,
  }
}

export interface ParcelInput {
  baseFee: number
  weightKg?: number
  codAmount?: number
  /** Suppléments nuit/pluie/attente — 100 % livreur. */
  courierSupplements?: number
}

export interface ParcelBreakdown {
  baseFee: number
  heavy: number
  codFee: number
  clientTotal: number
  courierShare: number
  platformShare: number
}

export function computeParcel(input: ParcelInput): ParcelBreakdown {
  const heavy = heavyParcelSupplement(input.weightKg ?? 0)
  const cod = codFee(input.codAmount ?? 0)
  const supplements = input.courierSupplements ?? 0

  const splitBase = input.baseFee + heavy
  const { courier, platform } = split8020(splitBase)

  return {
    baseFee: input.baseFee,
    heavy,
    codFee: cod,
    clientTotal: input.baseFee + heavy + cod,
    courierShare: courier + supplements,
    platformShare: platform,
  }
}
