'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useResto } from './RestoProvider'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const { current, restaurants, setCurrentId, dict, lang, setLang, signOut } = useResto()
  const pathname = usePathname()

  const tabs = [
    { href: '/resto', label: dict.navQueue, owner: false },
    { href: '/resto/menu', label: dict.navMenu, owner: false },
    { href: '/resto/historique', label: dict.navHistory, owner: false },
    { href: '/resto/releves', label: dict.navReports, owner: true },
    { href: '/resto/employes', label: dict.navStaff, owner: true },
  ].filter((t) => !t.owner || current.is_owner)

  return (
    <div className="mx-auto flex min-h-screen max-w-[640px] flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-12 border-b border-gray-200 bg-sand-100 px-20 py-12">
        {restaurants.length > 1 ? (
          <select
            value={current.id}
            onChange={(e) => setCurrentId(e.target.value)}
            className="h-40 flex-1 rounded-sm border border-gray-200 bg-white px-12 font-heading text-16 text-navy-900"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex-1 truncate font-heading text-16 font-semibold text-navy-900">{current.name}</span>
        )}
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="h-40 rounded-pill border border-gray-200 px-12 font-body text-16 text-gray-600"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
        <button
          onClick={signOut}
          aria-label={dict.logout}
          className="h-40 rounded-pill border border-gray-200 px-12 font-body text-16 text-gray-600"
        >
          ⏻
        </button>
      </header>

      <main className="flex-1 px-20 pb-[88px] pt-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[640px] border-t border-gray-200 bg-white">
        {tabs.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center py-8 font-body text-[13px] ${
                active ? 'font-semibold text-orange-700' : 'text-gray-500'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
