import type { MetadataRoute } from 'next'

// Manifest PWA de l'espace restaurant. Pensé smartphone d'abord (standalone, portrait).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NOVA Resto',
    short_name: 'NOVA Resto',
    description: 'Gestion des commandes restaurant — NOVA',
    start_url: '/resto',
    scope: '/resto',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F1E8',
    theme_color: '#D04318',
    lang: 'fr',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
