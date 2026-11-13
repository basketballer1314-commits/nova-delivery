// Matrice de permissions §6 (définie d'après les rôles — à ajuster si le dossier
// fournit la matrice exacte). Enforcement serveur = is_admin()/is_finance_admin()
// sur les RPC ; ce module pilote la navigation et l'affichage côté client.

export type AdminRole =
  | 'admin_super'
  | 'admin_ops'
  | 'admin_finance'
  | 'admin_support'
  | 'admin_sales'
  | 'admin_auditor'

export type Perm =
  | 'dashboard'
  | 'operations'
  | 'dispatch'
  | 'assisted_order'
  | 'search'
  | 'couriers_validate'
  | 'restaurants_manage'
  | 'sellers_manage'
  | 'zones_edit'
  | 'pricing_edit'
  | 'promotions'
  | 'payments_validate'
  | 'cash'
  | 'reversements'
  | 'refunds'
  | 'tickets'
  | 'audit'
  | 'exports'

const MATRIX: Record<Perm, AdminRole[]> = {
  dashboard: ['admin_super', 'admin_ops', 'admin_finance', 'admin_support', 'admin_sales', 'admin_auditor'],
  operations: ['admin_super', 'admin_ops'],
  dispatch: ['admin_super', 'admin_ops'],
  assisted_order: ['admin_super', 'admin_ops', 'admin_support'],
  search: ['admin_super', 'admin_ops', 'admin_finance', 'admin_support', 'admin_sales', 'admin_auditor'],
  couriers_validate: ['admin_super', 'admin_ops'],
  restaurants_manage: ['admin_super', 'admin_ops', 'admin_sales'],
  sellers_manage: ['admin_super', 'admin_sales'],
  zones_edit: ['admin_super', 'admin_ops'],
  pricing_edit: ['admin_super', 'admin_ops', 'admin_finance'],
  promotions: ['admin_super', 'admin_sales'],
  payments_validate: ['admin_super', 'admin_finance'],
  cash: ['admin_super', 'admin_finance'],
  reversements: ['admin_super', 'admin_finance'],
  refunds: ['admin_super', 'admin_finance'],
  tickets: ['admin_super', 'admin_ops', 'admin_support'],
  audit: ['admin_super', 'admin_auditor', 'admin_finance'],
  exports: ['admin_super', 'admin_finance', 'admin_auditor'],
}

// L'auditeur est en lecture seule partout (aucune action mutante).
const READ_ONLY_ROLES: AdminRole[] = ['admin_auditor']

export function makePermChecker(roles: AdminRole[]) {
  const set = new Set(roles)
  const isSuper = set.has('admin_super')
  return {
    roles,
    has(p: Perm): boolean {
      if (isSuper) return true
      return MATRIX[p].some((r) => set.has(r))
    },
    isReadOnly(): boolean {
      // lecture seule si TOUS les rôles sont en lecture seule
      return roles.length > 0 && roles.every((r) => READ_ONLY_ROLES.includes(r))
    },
  }
}

export type PermChecker = ReturnType<typeof makePermChecker>
