const CACHE = 'hipilates-v1'
const ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})

// Notificações push
self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  const titulo = data.titulo || 'Hipilates'
  const mensagem = data.mensagem || 'Nova notificação'
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: mensagem,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      const url = e.notification.data?.url || '/'
      const c = cs.find(w => w.url === url && 'focus' in w)
      if (c) return c.focus()
      return clients.openWindow(url)
    })
  )
})
