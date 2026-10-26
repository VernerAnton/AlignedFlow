// Harness for driving EveningMode one second at a time.
//
// The real timer is a Web Worker posting 'tick' every second, and the mode
// counts whole seconds since the last tick by Date.now(). Here the worker is a
// stand-in the test fires by hand after moving the fake clock on, so a run
// that would take minutes in a browser takes milliseconds and lands on exactly
// the same second every time.
import { vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import EveningMode from '../../../src/EveningMode.jsx'

const workers = []

class FakeWorker {
  constructor() { this.running = false; this.onmessage = null; workers.push(this) }
  postMessage(msg) {
    if (msg === 'start') this.running = true
    if (msg === 'stop') this.running = false
  }
  terminate() { this.running = false }
}

export function installClock() {
  workers.length = 0
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  vi.stubGlobal('Worker', FakeWorker)
  // The animation loop only moves the waterline; leaving it unscheduled keeps
  // each simulated second to a handful of renders.
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
}

export function uninstallClock() {
  vi.useRealTimers()
  vi.unstubAllGlobals()
}

// One second: the start countdown's interval fires off the fake clock, and a
// running worker delivers its tick.
export function tick(seconds = 1) {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      vi.advanceTimersByTime(1000)
      workers.filter(w => w.running).forEach(w => w.onmessage?.({ data: 'tick' }))
    })
  }
}

// ── Presets ──

export const sections = [
  { name: 'Standing', color: '#c4956a' },
  { name: 'Floor', color: '#b8785a' },
]

export const alpha = { id: 1, section: 'Standing', title: 'Alpha', timing: '4s', duration: 4, steps: ['alpha step'] }
export const beta = { id: 2, section: 'Floor', title: 'Beta', timing: '3s', duration: 3, steps: ['beta step'] }
export const gamma = { id: 3, section: 'Floor', title: 'Gamma', timing: '3s', duration: 3, steps: ['gamma step'] }
// Option 2 is bilateral with its own duration: 12s + the 4s switch buffer.
export const pick = {
  id: 2, section: 'Floor', title: 'Pick one', timing: '', duration: 4, steps: [],
  options: [
    { title: 'Short opt', duration: 4, timing: '4 sec', steps: ['short step'] },
    { title: 'Long bilateral', duration: 12, bilateral: true, timing: '6s per side', steps: ['long step'] },
  ],
}

export function makeConfig(overrides = {}) {
  return {
    id: 't1', name: 'Test', sections, switchBuffer: 4, transitionTime: 5, tapToStart: false, muted: true,
    exercises: [alpha, beta, gamma],
    ...overrides,
  }
}

export function renderEvening(config) {
  const onRuntime = vi.fn()
  const patchPreset = vi.fn()
  const utils = render(<EveningMode config={config} patchPreset={patchPreset} onRuntime={onRuntime} />)
  return { ...utils, onRuntime, patchPreset }
}

// ── Queries ──

export const primary = () => screen.getByRole('button', { name: /^(PLAY|PAUSE|START|CHOOSE|DONE)$/ })
export const currentCard = () => document.querySelector('[aria-current="step"]')
export const currentText = () => currentCard()?.textContent ?? ''
export const pageText = () => document.body.textContent
export const optionButton = (name) => screen.getByRole('button', { name: new RegExp(name) })
// Last value the mode reported to App as "a run is under way".
export const underway = (onRuntime) => onRuntime.mock.calls.at(-1)?.[0]?.isPlaying
export const isWaiting = () => /Tap to start|Choose a move/.test(pageText())
