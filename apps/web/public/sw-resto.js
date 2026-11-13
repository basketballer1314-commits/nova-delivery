// Service worker basique de l'espace restaurant NOVA.
// Stratégie : app-shell en cache, network-first pour la navigation (les
// commandes doivent rester fraîches), fallback cache hors-ligne.
const CACHE = 'nova-resto-v1'
const SHELL = ['/resto', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Ne jamais mettre en cache les appels Supabase (données live).
  if (url.pathname.startsWith('/rest/') || url.hostname.includes('supabase')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/resto'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  )
})
