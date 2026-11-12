import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NOVA — Back-office',
  description: 'Plateforme de livraison NOVA — Petite-Côte, Sénégal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
