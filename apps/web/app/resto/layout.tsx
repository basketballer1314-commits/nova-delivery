import type { Metadata, Viewport } from 'next'
import '../globals.css'
import ServiceWorkerRegister from './ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'NOVA Resto',
  description: 'Gestion des commandes restaurant — NOVA',
  manifest: '/resto/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'NOVA Resto' },
}

export const viewport: Viewport = {
  themeColor: '#D04318',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RestoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand-100 text-navy-900">
      <ServiceWorkerRegister />
      {children}
    </div>
  )
}
