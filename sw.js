// =====================================================
// AlignedFlow — Service Worker (sw.js)
// Handles: offline caching, background timer notifications
// =====================================================

const CACHE_NAME = 'alignedflow-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/sounds.js',
  '/manifest.json',
  '/icon.svg',
];

// ── Install: cache all assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first strategy ──
self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// ── Background Timer State ──
let scheduledTimers = {}; // key: 'next-transition', value: setTimeout id

function cancelAllTimers() {
  Object.values(scheduledTimers).forEach((id) => clearTimeout(id));
  scheduledTimers = {};
}

// Schedule a notification for when the next phase transition happens
function scheduleTransitionNotification(delay, title, body, tag) {
  cancelAllTimers();

  if (delay <= 0) {
    // Already overdue — fire immediately
    showTransitionNotification(title, body, tag);
    return;
  }

  scheduledTimers['next-transition'] = setTimeout(() => {
    showTransitionNotification(title, body, tag);
    // Notify all open clients that a phase completed
    self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) =>
        client.postMessage({ type: 'PHASE_COMPLETE' })
      );
    });
  }, delay);
}

function showTransitionNotification(title, body, tag) {
  self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: tag || 'alignedflow-transition',
    renotify: true,
    silent: false,
    requireInteraction: false,
  });
}

// ── Message Handler ──
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  if (type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body, tag } = event.data;
    scheduleTransitionNotification(delay, title, body, tag);

  } else if (type === 'CANCEL_NOTIFICATION') {
    cancelAllTimers();

  } else if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Notification click: focus app window ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow('/');
      })
  );
});
