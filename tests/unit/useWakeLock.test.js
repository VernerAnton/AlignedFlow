import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useWakeLock from '../../src/useWakeLock.js'
import { installWakeLock } from './helpers/wakeLock.js'

let visibility = 'visible'
function setVisibility(v) {
  visibility = v
  document.dispatchEvent(new Event('visibilitychange'))
}

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve() })

beforeEach(() => {
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { get: () => visibility, configurable: true })
})

afterEach(() => {
  delete navigator.wakeLock
  vi.useRealTimers()
})

describe('useWakeLock', () => {
  it('does nothing, and does not throw, where the API is missing', async () => {
    const { result, rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: true } })
    await flush()
    expect(() => result.current()).not.toThrow()
    rerender({ active: false })
    await flush()
  })

  it('takes the lock while active and lets it go when not', async () => {
    const lock = installWakeLock()
    const { rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: false } })
    await flush()
    expect(lock.requests).toBe(0)

    rerender({ active: true })
    await flush()
    expect(lock.held).toHaveLength(1)

    rerender({ active: false })
    await flush()
    expect(lock.held).toHaveLength(0)
  })

  it('asks once, however often it re-renders while active', async () => {
    const lock = installWakeLock()
    const { rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: true } })
    await flush()
    rerender({ active: true }); rerender({ active: true })
    await flush()
    expect(lock.requests).toBe(1)
  })

  it('takes the lock again when the app comes back into view', async () => {
    const lock = installWakeLock()
    renderHook(() => useWakeLock(true))
    await flush()

    setVisibility('hidden')
    lock.dropAll()
    await flush()
    expect(lock.held).toHaveLength(0)

    setVisibility('visible')
    await flush()
    expect(lock.held).toHaveLength(1)
    expect(lock.requests).toBe(2)
  })

  it('does not ask while the page is hidden', async () => {
    const lock = installWakeLock()
    visibility = 'hidden'
    renderHook(() => useWakeLock(true))
    await flush()
    expect(lock.requests).toBe(0)
  })

  it('stops listening for visibility once inactive', async () => {
    const lock = installWakeLock()
    const { rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: true } })
    await flush()
    rerender({ active: false })
    await flush()
    setVisibility('hidden'); setVisibility('visible')
    await flush()
    expect(lock.requests).toBe(1)
    expect(lock.held).toHaveLength(0)
  })

  it('survives a refused request and tries again on the next chance', async () => {
    const lock = installWakeLock({ refuse: true })
    const { result } = renderHook(() => useWakeLock(true))
    await flush()
    expect(lock.requests).toBe(1)
    expect(lock.held).toHaveLength(0)

    lock.refuse = false
    act(() => { result.current() })
    await flush()
    expect(lock.held).toHaveLength(1)
  })

  // The race the e2e trace found: a tap's request resolving before the tap's
  // own state change has rendered must not be thrown away.
  it('keeps a lock taken from a gesture while the caller catches up to active', async () => {
    vi.useFakeTimers()
    const lock = installWakeLock()
    const { result, rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: false } })

    act(() => { result.current() })
    await flush()
    expect(lock.held).toHaveLength(1)

    rerender({ active: true })
    await flush()
    act(() => { vi.advanceTimersByTime(2000) })
    await flush()
    expect(lock.held).toHaveLength(1)
    expect(lock.requests).toBe(1)
  })

  it('lets a gesture lock go if the caller never becomes active', async () => {
    vi.useFakeTimers()
    const lock = installWakeLock()
    const { result } = renderHook(() => useWakeLock(false))
    act(() => { result.current() })
    await flush()
    expect(lock.held).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(1100) })
    await flush()
    expect(lock.held).toHaveLength(0)
  })

  it('releases the lock on unmount', async () => {
    const lock = installWakeLock()
    const { unmount } = renderHook(() => useWakeLock(true))
    await flush()
    expect(lock.held).toHaveLength(1)
    unmount()
    await flush()
    expect(lock.held).toHaveLength(0)
  })
})
