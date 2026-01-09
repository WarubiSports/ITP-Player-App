// Service Worker for ITP Player App
const CACHE_NAME = 'itp-player-v1'
const OFFLINE_URL = '/offline.html'

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/fc-koln-logo.png',
  '/fc-koln-logo.svg'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL)
        }
      })
    })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || '',
    icon: '/fc-koln-logo.png',
    badge: '/fc-koln-logo.png',
    tag: data.tag || 'itp-notification',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'ITP Notification', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-wellness') {
    event.waitUntil(syncWellnessData())
  } else if (event.tag === 'sync-grocery') {
    event.waitUntil(syncGroceryOrders())
  }
})

// Sync wellness data when back online
async function syncWellnessData() {
  try {
    const pendingLogs = await getPendingData('pending-wellness')
    for (const log of pendingLogs) {
      await fetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      })
    }
    await clearPendingData('pending-wellness')
  } catch (error) {
    console.error('Sync wellness failed:', error)
  }
}

// Sync grocery orders when back online
async function syncGroceryOrders() {
  try {
    const pendingOrders = await getPendingData('pending-grocery')
    for (const order of pendingOrders) {
      await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      })
    }
    await clearPendingData('pending-grocery')
  } catch (error) {
    console.error('Sync grocery failed:', error)
  }
}

// Helper to get pending data from IndexedDB
async function getPendingData(storeName) {
  // Simplified - would use IndexedDB in production
  return []
}

// Helper to clear pending data
async function clearPendingData(storeName) {
  // Simplified - would use IndexedDB in production
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkAndSendReminders())
  }
})

// Check reminders in background
async function checkAndSendReminders() {
  // This runs periodically in the background
  // Would fetch data and show notifications for:
  // - Upcoming events
  // - Overdue tasks
  // - Wellness check-in reminders
  // - Streak warnings
  console.log('Background reminder check')
}
