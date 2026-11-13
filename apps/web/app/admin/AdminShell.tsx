'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAdmin } from './AdminProvider'
import type { Perm } from '../../lib/admin/permissions'

const NAV: { href: string; label: string; perm: Perm }[] = [
  { href: '/admin', label: 'Tableau de bord', perm: 'dashboard' },
  { href: '/admin/operations', label: 'Opérations', perm: 'operations' },
  { href: '/admin/commande', label: 'Commande assistée', perm: 'assisted_order' },
  { href: '/admin/recherche', label: 'Recherche', perm: 'search' },
  { href: '/admin/livreurs', label: 'Livreurs', perm: 'couriers_validate' },
  { href: '/admin/restaurants', label: 'Restaurants', perm: 'restaurants_manage' },
  { href: '/admin/vendeurs', label: 'Vendeurs', perm: 'sellers_manage' },
  { href: '/admin/zones', label: 'Zones & prix', perm: 'zones_edit' },
  { href: '/admin/promotions', label: 'Promotions', perm: 'promotions' },
  { href: '/admin/paiements', label: 'Paiements', perm: 'payments_validate' },
  { href: '/admin/remboursements', label: 'Remboursements', perm: 'refunds' },
  { href: '/admin/tickets', label: 'Tickets', perm: 'tickets' },
  { href: '/admin/audit', label: 'Audit', perm: 'audit' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { perm, signOut, roles } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()

  // Raccourcis : N = commande assistée, / = recherche
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (e.key === 'n' || e.key === 'N') {
        if (perm.has('assisted_order')) {
          e.preventDefault()
          router.push('/admin/commande')
        }
      } else if (e.key === '/') {
        if (perm.has('search')) {
          e.preventDefault()
          router.push('/admin/recherche')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [perm, router])

  const items = NAV.filter((n) => perm.has(n.perm))

  return (
    <div className="flex min-h-screen bg-sand-100 font-body text-[14px] text-navy-900">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-16 py-16">
          <div className="font-heading text-lg font-semibold text-navy-900">NOVA</div>
          <div className="text-[12px] text-gray-500">Back-office</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-8">
          {items.map((n) => {
            const active = pathname === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block px-16 py-8 text-[13px] ${
                  active ? 'border-l-2 border-orange-600 bg-sand-100 font-medium text-orange-700' : 'text-gray-600 hover:bg-sand-100/60'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-gray-200 px-16 py-12 text-[12px] text-gray-500">
          <div className="mb-8 truncate">{roles.join(', ')}</div>
          <button onClick={signOut} className="text-[13px] text-orange-700">Se déconnecter</button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1200px] p-24">{children}</div>
      </main>
    </div>
  )
}
