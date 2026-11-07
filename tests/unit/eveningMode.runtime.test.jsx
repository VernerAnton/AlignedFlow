// What EveningMode tells the rest of the app: whether a run is under way (sync
// holds remote edits back on it) and whether the screen should stay on.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, act } from '@testing-library/react'
import * as sounds from '../../src/sounds.js'
import {
  installClock, uninstallClock, tick, makeConfig, renderEvening, primary, underway, alpha, beta, pick,
} from './helpers/evening.jsx'
import { installWakeLock } from './helpers/wakeLock.js'

vi.mock('../../src/sounds.js', () => ({
  playPulseTone: vi.fn(), playRingTone: vi.fn(), playSide2Chime: vi.fn(), playExerciseCompleteSound: vi.fn(),
  playExerciseStartSound: vi.fn(), playDoneSound: vi.fn(), playEndingTick: vi.fn(), unlockAudio: vi.fn(),
}))
vi.mock('../../src/notifications.js', () => ({ sendNotification: vi.fn() }))

beforeEach(installClock)
afterEach(() => { uninstallClock(); delete navigator.wakeLock })

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve() })

describe('"under way" flag for sync', () => {
  it('is false before anything starts', () => {
    const { onRuntime } = renderEvening(makeConfig())
    expect(underway(onRuntime)).toBe(false)
  })

  it('is true from Play, through the start countdown and the exercise', () => {
    const { onRuntime } = renderEvening(makeConfig())
    fireEvent.click(primary())
    expect(underway(onRuntime)).toBe(true)
    tick(6)
    expect(underway(onRuntime)).toBe(true)
  })

  // The trap: the clock is stopped here, but a remount would still throw the
  // run away and send it back to card 1.
  it('stays true while a card waits for its tap', () => {
    const { onRuntime } = renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary()); tick(5); tick(4)
    expect(primary().textContent).toBe('START')
    expect(underway(onRuntime)).toBe(true)
  })

  it('stays true while a choice card waits for a pick', () => {
    const { onRuntime } = renderEvening(makeConfig({ exercises: [alpha, pick] }))
    fireEvent.click(primary()); tick(5); tick(4)
    expect(primary().textContent).toBe('CHOOSE')
    expect(underway(onRuntime)).toBe(true)
  })

  it('stays true while paused mid-exercise', () => {
    const { onRuntime } = renderEvening(makeConfig())
    fireEvent.click(primary()); tick(6)
    fireEvent.click(primary())
    expect(primary().textContent).toBe('PLAY')
    expect(underway(onRuntime)).toBe(true)
  })

  it('goes false on Reset', () => {
    const { onRuntime } = renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary()); tick(5); tick(4)
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }))
    expect(underway(onRuntime)).toBe(false)
  })

  it('goes false when the routine is done', () => {
    const { onRuntime } = renderEvening(makeConfig({ exercises: [alpha] }))
    fireEvent.click(primary()); tick(5); tick(4)
    expect(underway(onRuntime)).toBe(false)
  })

  it('goes false when the mode unmounts mid-routine, so sync is not held forever', () => {
    const { onRuntime, unmount } = renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary()); tick(5); tick(4)
    expect(underway(onRuntime)).toBe(true)
    unmount()
    expect(underway(onRuntime)).toBe(false)
  })
})

describe('screen wake lock', () => {
  it('is taken on Play and held while a card waits for its tap', async () => {
    const lock = installWakeLock()
    renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary())
    await flush()
    expect(lock.held).toHaveLength(1)
    tick(5); tick(4)
    await flush()
    expect(primary().textContent).toBe('START')
    expect(lock.held).toHaveLength(1)
  })

  it('is let go on a deliberate pause and taken again on resume', async () => {
    const lock = installWakeLock()
    renderEvening(makeConfig())
    fireEvent.click(primary())
    await flush()
    tick(6)
    fireEvent.click(primary())
    await flush()
    expect(lock.held).toHaveLength(0)
    fireEvent.click(primary())
    await flush()
    expect(lock.held).toHaveLength(1)
  })

  it('is let go after a card has waited 10 minutes, and the next tap takes it back', async () => {
    const lock = installWakeLock()
    renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary()); tick(5); tick(4)
    await flush()
    act(() => { vi.advanceTimersByTime(9 * 60 * 1000) })
    await flush()
    expect(lock.held).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(61 * 1000) })
    await flush()
    expect(lock.held).toHaveLength(0)
    fireEvent.click(primary())
    await flush()
    expect(lock.held).toHaveLength(1)
  })

  it('is let go on Reset and when the routine is done', async () => {
    const lock = installWakeLock()
    renderEvening(makeConfig({ exercises: [alpha, beta] }))
    fireEvent.click(primary())
    await flush()
    expect(lock.held).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }))
    await flush()
    expect(lock.held).toHaveLength(0)

    tick(2)
    fireEvent.click(primary())
    await flush()
    tick(5); tick(4); tick(5); tick(3)
    await flush()
    expect(screen.getByText('Evening routine done.')).toBeTruthy()
    expect(lock.held).toHaveLength(0)
  })

  it('is asked for again from the tap itself, which iOS needs after a trip to the home screen', async () => {
    const lock = installWakeLock()
    renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary()); tick(5); tick(4)
    await flush()
    lock.dropAll()                 // the browser dropped it while hidden
    lock.refuse = true             // …and refuses the visibility-time request
    document.dispatchEvent(new Event('visibilitychange'))
    await flush()
    expect(lock.held).toHaveLength(0)
    lock.refuse = false
    fireEvent.click(primary())     // the tap
    await flush()
    expect(lock.held).toHaveLength(1)
  })
})

describe('audio', () => {
  it('is woken inside the tap that starts a card, and inside Play', () => {
    renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary())
    expect(sounds.unlockAudio).toHaveBeenCalledTimes(1)
    tick(5); tick(4)
    fireEvent.click(primary())
    expect(sounds.unlockAudio).toHaveBeenCalledTimes(2)
  })
})
