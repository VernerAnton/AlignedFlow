import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import * as sounds from '../../src/sounds.js'
import {
  installClock, uninstallClock, tick, makeConfig, renderEvening, primary, currentCard, currentText, pageText,
  optionButton, alpha, gamma, pick,
} from './helpers/evening.jsx'

vi.mock('../../src/sounds.js', () => ({
  playPulseTone: vi.fn(), playRingTone: vi.fn(), playSide2Chime: vi.fn(), playExerciseCompleteSound: vi.fn(),
  playExerciseStartSound: vi.fn(), playDoneSound: vi.fn(), playEndingTick: vi.fn(), unlockAudio: vi.fn(),
}))
vi.mock('../../src/notifications.js', () => ({ sendNotification: vi.fn() }))

beforeEach(installClock)
afterEach(uninstallClock)

const config = (overrides) => makeConfig({ exercises: [alpha, pick, gamma], ...overrides })
// Play, run Alpha, arrive on the choice card.
function arriveAtChoice(overrides) {
  const utils = renderEvening(config(overrides))
  fireEvent.click(primary()); tick(5); tick(4)
  return utils
}
const railLabels = () => [...document.querySelectorAll('span')].map(s => s.textContent).filter(t => /^\d+s$/.test(t)).map(t => parseInt(t))

describe('arriving at a choice card', () => {
  it('waits for a pick even with tap-to-start off', () => {
    arriveAtChoice({ tapToStart: false })
    expect(primary().textContent).toBe('CHOOSE')
    tick(60)
    expect(primary().textContent).toBe('CHOOSE')
    expect(pageText()).not.toContain('Get into position')
  })

  it('lists every option with its timing and a B badge for bilateral ones', () => {
    arriveAtChoice()
    const card = within(currentCard())
    expect(card.getByText('Pick one')).toBeTruthy()
    expect(card.getByText('2 options')).toBeTruthy()
    expect(optionButton('Short opt').textContent).toContain('4 sec')
    const long = optionButton('Long bilateral')
    expect(long.textContent).toContain('6s per side')
    expect(long.textContent).toContain('B')
    expect(pageText()).toContain('Choose a move · 1–9')
  })

  it('shows its own duration on an option with no timing text', () => {
    arriveAtChoice({ exercises: [alpha, { ...pick, options: [{ title: 'Untimed text', duration: 42, steps: [] }] }, gamma] })
    expect(optionButton('Untimed text').textContent).toContain('42s')
  })

  it('disables the main button, and ignores taps on the card and Space', () => {
    arriveAtChoice()
    expect(primary().disabled).toBe(true)
    fireEvent.click(within(currentCard()).getByText('Pick one'))
    fireEvent.keyDown(document.body, { key: ' ', code: 'Space' })
    expect(primary().textContent).toBe('CHOOSE')
    expect(currentText()).not.toContain('Get Ready')
  })
})

describe('picking an option', () => {
  it('starts the 3-2-1 straight away and then runs that option', () => {
    arriveAtChoice()
    fireEvent.click(optionButton('Short opt'))
    expect(currentText()).toContain('Get Ready')
    tick(3)
    expect(currentText()).toContain('Short opt')
    expect(currentText()).toContain('Pick one · option 1 of 2')
    expect(currentText()).toContain('short step')
    expect(currentText()).not.toContain('Long bilateral')
  })

  it("times the card by the option's own duration and sides", () => {
    arriveAtChoice()
    fireEvent.click(optionButton('Long bilateral'))
    tick(3)
    expect(Math.max(...railLabels())).toBe(16)        // 12s + 4s switch buffer
    expect(currentText()).toContain('Side 1')
    tick(6)                                            // into the switch window
    expect(currentText()).toContain('Switch Sides')
    tick(4)
    expect(currentText()).toContain('Side 2')
    expect(sounds.playSide2Chime).toHaveBeenCalledTimes(1)
    tick(5)
    expect(currentText()).toContain('Long bilateral')  // 1s left
    tick(1)
    expect(currentText()).toContain('Gamma')
  })

  it('a short option is over in its own time, not the card default', () => {
    arriveAtChoice({ exercises: [alpha, { ...pick, duration: 60 }, gamma], tapToStart: true })
    fireEvent.click(optionButton('Short opt'))
    tick(3); tick(4)
    expect(currentText()).toContain('Gamma')
  })

  it('picks with number keys', () => {
    arriveAtChoice()
    fireEvent.keyDown(document.body, { key: '2' })
    tick(3)
    expect(currentText()).toContain('Pick one · option 2 of 2')
  })

  it('ignores a number key with no matching option', () => {
    arriveAtChoice()
    fireEvent.keyDown(document.body, { key: '7' })
    expect(primary().textContent).toBe('CHOOSE')
  })

  it('ignores number keys on an ordinary card', () => {
    renderEvening(config({ tapToStart: true }))
    fireEvent.keyDown(document.body, { key: '1' })
    expect(primary().textContent).toBe('PLAY')
  })
})

describe('a choice card before the routine has started', () => {
  const first = () => config({ exercises: [pick, gamma] })

  it('shows its options in idle, and picking one is the Play press', () => {
    const { onRuntime } = renderEvening(first())
    fireEvent.click(optionButton('Short opt'))
    expect(currentText()).toContain('Get Ready')
    expect(currentText()).toContain('5')
    expect(onRuntime.mock.calls.at(-1)[0].isPlaying).toBe(true)
    tick(5)
    expect(currentText()).toContain('Short opt')
  })

  it('Play with nothing picked parks on it rather than counting down to nothing', () => {
    renderEvening(first())
    fireEvent.click(primary())
    expect(primary().textContent).toBe('CHOOSE')
    expect(currentText()).not.toContain('Get Ready')
    fireEvent.click(optionButton('Long bilateral'))
    expect(currentText()).toContain('Get Ready')
    tick(3)
    expect(currentText()).toContain('Side 1')
  })
})

describe('remembering and clearing picks', () => {
  it('going back to a picked card shows the pick and starts from a tap', () => {
    arriveAtChoice({ tapToStart: true })
    fireEvent.click(optionButton('Long bilateral'))
    tick(3); tick(16)
    expect(currentText()).toContain('Gamma')
    vi.advanceTimersByTime(1000)
    fireEvent.click(screen.getByRole('button', { name: '‹' }))
    expect(primary().textContent).toBe('START')
    expect(pageText()).toContain('Tap to start')
    // Its options stay on show, the pick highlighted, so it can be changed.
    expect(optionButton('Short opt')).toBeTruthy()
    fireEvent.click(within(currentCard()).getByText('Pick one'))
    tick(3)
    expect(currentText()).toContain('Pick one · option 2 of 2')
  })

  it('a different option can be picked when coming back', () => {
    arriveAtChoice({ tapToStart: true })
    fireEvent.click(optionButton('Long bilateral'))
    tick(3); tick(16)
    vi.advanceTimersByTime(1000)
    fireEvent.click(screen.getByRole('button', { name: '‹' }))
    fireEvent.click(optionButton('Short opt'))
    tick(3)
    expect(currentText()).toContain('Pick one · option 1 of 2')
  })

  it('Reset forgets every pick', () => {
    arriveAtChoice()
    fireEvent.click(optionButton('Long bilateral'))
    tick(3)
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }))
    tick(2)
    fireEvent.click(screen.getByRole('button', { name: '›' }))
    vi.advanceTimersByTime(1000)
    expect(currentText()).toContain('2 options')
    // With the pick forgotten, Play has nothing to count down to yet.
    fireEvent.click(primary())
    expect(primary().textContent).toBe('CHOOSE')
    expect(currentText()).not.toContain('Get Ready')
  })
})

describe('peeking cards', () => {
  it('shows an upcoming choice card as its heading and options, with nothing to press', () => {
    renderEvening(config())
    const peeks = screen.getAllByText('Pick one')
    expect(peeks.length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Short opt/ })).toBeNull()
    expect(pageText()).toContain('Short opt')
  })
})
