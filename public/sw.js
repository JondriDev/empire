// Bump this on every meaningful change so old caches are purged on activate.
const CACHE_NAME = 'empire-v2'

self.addEventListener('install', (event) => {
  // Don't precache the HTML shell — it must always come from the network so
  // it references the latest content-hashed asset bundle.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API calls — network first, cache fallback.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // HTML / navigation — network first so the app shell is always up to date.
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request).then(c => c || caches.match('/index.html')))
    )
    return
  }

  // Content-hashed static assets — cache first (they're immutable).
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(res => {
        if (res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return res
      })
    )
  )
})
