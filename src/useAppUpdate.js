import { useEffect, useRef, useState } from 'react'

// Update detection, done against the browser's own service worker API rather
// than vite-plugin-pwa's registerSW helper. Under registerType 'autoUpdate'
// that helper reloads the page itself the moment a new worker activates —
// see node_modules/vite-plugin-pwa/dist/client/build/register.js — and 0.21.x
// exposes no callback to intervene. So vite.config.js sets injectRegister:
// null and we register here instead, which leaves the generated worker
// untouched (it still skipWaiting/clientsClaims, so a new build claims an
// install that has been sitting stale) and only changes what the page does
// about it: offer a reload, never take one.

/** Hourly is frequent enough for an app deployed a few times a week. */
const UPDATE_INTERVAL_MS = 60 * 60 * 1000

export function useAppUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  // Survives a dismissal, because the page does not stop being behind just
  // because the offer was waved away. Once a newer worker has taken over
  // there is nothing new left for update() to find, so without this the
  // offer would never come back and Later would quietly mean Never.
  const stale = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false
    let timer
    let onVisible
    const announce = () => { stale.current = true; if (!cancelled) setNeedRefresh(true) }

    // Whether this page was already under a worker when it loaded. A first
    // install claims the page too, and that is not a new build — it is this
    // one arriving. Only a handover from an older worker means "you are
    // behind", so every announce path below is gated on there having been a
    // controller to hand over from.
    const wasControlled = !!navigator.serviceWorker.controller

    // The new worker taking over. Under autoUpdate this fires on its own,
    // without a reload, because the worker claims the page as it activates —
    // which is exactly the case that used to reload the app underneath you.
    const onControllerChange = () => { if (wasControlled) announce() }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
      if (cancelled) return

      // A build that finished installing while the app was closed, still
      // parked, is a new build the page has yet to hear about.
      if (reg.waiting && navigator.serviceWorker.controller) announce()

      // And one that installs while the app is open. Caught here as well as
      // via controllerchange so the offer appears the moment the download
      // completes, rather than waiting on the handover.
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) announce()
        })
      })

      // The interval is the backstop. The visibility check is the one that
      // matters: an installed app is switched back to far more often than it
      // is loaded cold, and a phone left on the home screen can otherwise sit
      // on a build for days without ever asking.
      const check = () => {
        reg.update().catch(() => {})
        if (stale.current) announce()   // still behind from an earlier check
      }
      timer = window.setInterval(check, UPDATE_INTERVAL_MS)
      onVisible = () => { if (document.visibilityState === 'visible') check() }
      document.addEventListener('visibilitychange', onVisible)
    }).catch(() => {
      // No worker in dev, and a registration that fails is not worth a crash
      // over — the app runs fine, it just cannot tell you it is stale.
    })

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      if (timer !== undefined) window.clearInterval(timer)
      if (onVisible) document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return {
    needRefresh,
    // The new worker already controls the page by this point, so a plain
    // reload is all it takes to land on the new build.
    updateApp: () => window.location.reload(),
    // Keep this build for now — the offer returns on the next check, since
    // `stale` is deliberately left standing.
    dismiss: () => setNeedRefresh(false),
  }
}
