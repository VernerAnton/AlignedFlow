// A stand-in for navigator.wakeLock that records what the code asks for and
// lets a test drop the lock the way the browser does when the app is hidden.
import { vi } from 'vitest'

export function installWakeLock({ refuse = false } = {}) {
  const lock = {
    requests: 0,
    held: [],
    refuse,
    request: vi.fn(async () => {
      lock.requests++
      if (lock.refuse) throw Object.assign(new Error('denied'), { name: 'NotAllowedError' })
      const listeners = []
      const sentinel = {
        released: false,
        addEventListener: (_, fn) => listeners.push(fn),
        release: vi.fn(async () => {
          if (sentinel.released) return
          sentinel.released = true
          lock.held = lock.held.filter(s => s !== sentinel)
          listeners.forEach(fn => fn())
        }),
      }
      lock.held.push(sentinel)
      return sentinel
    }),
    // What the browser does on hiding the page.
    dropAll() { [...lock.held].forEach(s => s.release()) },
  }
  Object.defineProperty(navigator, 'wakeLock', { value: lock, configurable: true })
  return lock
}
