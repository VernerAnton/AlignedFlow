import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import {
  installClock, uninstallClock, tick, makeConfig, renderEvening, primary, currentCard, currentText,
} from './helpers/evening.jsx'

vi.mock('../../src/sounds.js', () => ({
  playPulseTone: vi.fn(), playRingTone: vi.fn(), playSide2Chime: vi.fn(), playExerciseCompleteSound: vi.fn(),
  playExerciseStartSound: vi.fn(), playDoneSound: vi.fn(), playEndingTick: vi.fn(), unlockAudio: vi.fn(),
}))
vi.mock('../../src/notifications.js', () => ({ sendNotification: vi.fn() }))

beforeEach(installClock)
afterEach(uninstallClock)

// Play, run Alpha, park on Beta.
function waitingOnBeta() {
  const utils = renderEvening(makeConfig({ tapToStart: true }))
  fireEvent.click(primary()); tick(5); tick(4)
  expect(primary().textContent).toBe('START')
  return utils
}
const space = (target = document.body, extra = {}) => fireEvent.keyDown(target, { key: ' ', code: 'Space', ...extra })

describe('tap anywhere', () => {
  it('starts from a tap on the card', () => {
    waitingOnBeta()
    fireEvent.click(within(currentCard()).getByText('beta step'))
    expect(currentText()).toContain('Get Ready')
  })

  it('starts from a tap on empty background', () => {
    const { container } = waitingOnBeta()
    fireEvent.click(container.firstChild)
    expect(currentText()).toContain('Get Ready')
  })

  it('does not start from a tap on another control', () => {
    waitingOnBeta()
    const mute = screen.getAllByRole('button').find(b => b.querySelector('svg'))
    fireEvent.click(mute)
    expect(primary().textContent).toBe('START')
  })

  it('a double tap starts once and does not pause', () => {
    waitingOnBeta()
    const step = within(currentCard()).getByText('beta step')
    fireEvent.click(step)
    fireEvent.click(step)
    expect(primary().textContent).toBe('PAUSE')
    tick(3)
    expect(primary().textContent).toBe('PAUSE')
  })

  it('a double tap on START starts once and does not pause', () => {
    waitingOnBeta()
    fireEvent.click(primary())
    vi.advanceTimersByTime(150)
    fireEvent.click(primary())
    expect(primary().textContent).toBe('PAUSE')
  })

  it('a later tap on PAUSE still pauses', () => {
    waitingOnBeta()
    fireEvent.click(primary())
    vi.advanceTimersByTime(600)
    fireEvent.click(primary())
    expect(primary().textContent).toBe('PLAY')
  })

  it('tapping the screen mid-exercise does not pause it', () => {
    waitingOnBeta()
    fireEvent.click(primary()); tick(4)
    fireEvent.click(within(currentCard()).getByText('beta step'))
    expect(primary().textContent).toBe('PAUSE')
  })

  it('tapping the screen while idle does not start the routine', () => {
    renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(within(currentCard()).getByText('alpha step'))
    expect(primary().textContent).toBe('PLAY')
  })
})

describe('keyboard', () => {
  it('Space starts a waiting card', () => {
    waitingOnBeta()
    space()
    expect(currentText()).toContain('Get Ready')
  })

  it('Space plays, pauses and resumes like the main button', () => {
    renderEvening(makeConfig())
    space()
    expect(primary().textContent).toBe('PAUSE')
    vi.advanceTimersByTime(600)
    space()
    expect(primary().textContent).toBe('PLAY')
    space()
    expect(primary().textContent).toBe('PAUSE')
  })

  it('Space stops the page scrolling', () => {
    renderEvening(makeConfig())
    expect(space()).toBe(false)   // fireEvent returns false once preventDefault ran
  })

  // A focused button already clicks itself on Space; handling it here too
  // would start the card and pause it again in one press.
  it('Space is left alone while a button has focus', () => {
    waitingOnBeta()
    space(primary())
    expect(primary().textContent).toBe('START')
  })

  it('Space is left alone while typing in a field', () => {
    renderEvening(makeConfig())
    const input = document.createElement('input')
    document.body.appendChild(input)
    space(input)
    expect(primary().textContent).toBe('PLAY')
    input.remove()
  })

  it('a held Space does not repeat', () => {
    waitingOnBeta()
    space()
    vi.advanceTimersByTime(600)
    space(document.body, { repeat: true })
    expect(primary().textContent).toBe('PAUSE')
  })

  it('Space with a modifier is ignored', () => {
    renderEvening(makeConfig())
    space(document.body, { ctrlKey: true })
    space(document.body, { metaKey: true })
    expect(primary().textContent).toBe('PLAY')
  })

  it('stops listening once the mode unmounts', () => {
    const { unmount } = renderEvening(makeConfig())
    unmount()
    expect(space()).toBe(true)
  })
})
