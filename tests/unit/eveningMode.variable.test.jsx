import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import * as sounds from '../../src/sounds.js'
import {
  installClock, uninstallClock, tick, makeConfig, renderEvening, primary, currentCard, currentText, pageText,
  alpha, gamma,
} from './helpers/evening.jsx'

vi.mock('../../src/sounds.js', () => ({
  playPulseTone: vi.fn(), playRingTone: vi.fn(), playSide2Chime: vi.fn(), playExerciseCompleteSound: vi.fn(),
  playExerciseStartSound: vi.fn(), playDoneSound: vi.fn(), playEndingTick: vi.fn(), unlockAudio: vi.fn(),
}))
vi.mock('../../src/notifications.js', () => ({ sendNotification: vi.fn() }))

beforeEach(installClock)
afterEach(uninstallClock)

// 2 minutes by default, up to 3.
const breathe = { id: 2, section: 'Floor', title: 'Box breathing', timing: 'stale text', duration: 120, variableLength: true, maxDuration: 180, steps: ['in 4, hold 4'] }
const config = (overrides) => makeConfig({ exercises: [alpha, breathe, gamma], ...overrides })
const shorter = () => screen.getByRole('button', { name: 'Shorter' })
const longer = () => screen.getByRole('button', { name: 'Longer' })
// The number between − and +, not the "up to" line under it.
const pickerValue = () => currentText().match(/−(.*?)up to/)?.[1]
const railTop = () => Math.max(...[...document.querySelectorAll('span')].map(s => s.textContent)
  .filter(t => /^\d+m$/.test(t)).map(t => parseInt(t)))

function arrive(overrides) {
  const utils = renderEvening(config(overrides))
  fireEvent.click(primary()); tick(5); tick(4)
  return utils
}

describe('arriving at a variable-length card', () => {
  it('waits with its default length, even with tap-to-start off', () => {
    arrive({ tapToStart: false })
    expect(primary().textContent).toBe('START')
    expect(currentText()).toContain('2 min')
    expect(currentText()).toContain('up to 3 min')
    expect(pageText()).toContain('Tap to start · space · −/+')
    tick(30)
    expect(primary().textContent).toBe('START')
  })

  it('shows the length instead of timing text that would go stale', () => {
    arrive()
    expect(currentText()).not.toContain('stale text')
  })

  it('+ and − change the length shown and the rail', () => {
    arrive()
    expect(railTop()).toBe(2)
    fireEvent.click(longer())
    expect(pickerValue()).toBe('3 min')
    expect(railTop()).toBe(3)
    // The new top of the rail reads as still to come, not as time already
    // spent — the clock moved with the length.
    const top = [...document.querySelectorAll('span')].find(s => s.textContent === '3m')
    expect(top.style.opacity).toBe('1')
    fireEvent.click(shorter())
    fireEvent.click(shorter())
    expect(pickerValue()).toBe('1 min')
  })

  it('stops at 1 minute and at the card maximum', () => {
    arrive()
    fireEvent.click(shorter())
    expect(shorter().disabled).toBe(true)
    fireEvent.click(longer()); fireEvent.click(longer())
    expect(pickerValue()).toBe('3 min')
    expect(longer().disabled).toBe(true)
  })

  it('does not start the card when − or + is tapped', () => {
    arrive()
    fireEvent.click(longer())
    expect(primary().textContent).toBe('START')
    expect(currentText()).not.toContain('Get Ready')
  })

  it('runs for the length chosen', () => {
    arrive()
    fireEvent.click(longer())                 // 3 min
    fireEvent.click(within(currentCard()).getByText('in 4, hold 4'))
    tick(3)                                   // count-in
    expect(sounds.playExerciseStartSound).toHaveBeenCalledTimes(2)
    tick(179)
    expect(currentText()).toContain('Box breathing')
    tick(1)
    expect(currentText()).toContain('Gamma')
  })

  it('hides − and + once the card is running', () => {
    arrive()
    fireEvent.click(primary()); tick(3)
    expect(screen.queryByRole('button', { name: 'Longer' })).toBeNull()
    expect(currentText()).toContain('2 min')
  })

  it('adjusts with the - and + keys', () => {
    arrive()
    fireEvent.keyDown(document.body, { key: '+' })
    expect(pickerValue()).toBe('3 min')
    fireEvent.keyDown(document.body, { key: '-' })
    fireEvent.keyDown(document.body, { key: '-' })
    expect(pickerValue()).toBe('1 min')
  })

  it('ignores the keys on an ordinary waiting card', () => {
    renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(primary()); tick(5); tick(4)
    fireEvent.keyDown(document.body, { key: '+' })
    expect(primary().textContent).toBe('START')
    expect(currentText()).toContain('Beta')
  })
})

describe('a default that is not a whole minute', () => {
  const odd = { ...breathe, duration: 90 }

  it('shows minutes and seconds, then snaps to whole minutes', () => {
    arrive({ exercises: [alpha, odd, gamma] })
    expect(pickerValue()).toBe('1:30 min')
    fireEvent.click(longer())
    expect(pickerValue()).toBe('2 min')
  })
})

describe('bilateral variable cards', () => {
  it('splits the chosen length across both sides, with the switch in the middle', () => {
    arrive({ exercises: [alpha, { ...breathe, bilateral: true }, gamma] })
    expect(currentText()).toContain('2 min · both sides')
    fireEvent.click(primary()); tick(3)
    expect(currentText()).toContain('Side 1')
    // 120s + 4s switch buffer = 124s; the switch window is the 4s around
    // the middle, from 64s left down to 60s.
    tick(124 - 65)
    expect(currentText()).toContain('Side 1')
    tick(1)
    expect(currentText()).toContain('Switch Sides')
  })
})

describe('as the first card', () => {
  const first = () => makeConfig({ exercises: [breathe, gamma] })

  it('can be adjusted before Play, and Play runs that length', () => {
    renderEvening(first())
    expect(primary().textContent).toBe('PLAY')
    fireEvent.click(longer())
    fireEvent.click(primary())
    tick(5)
    tick(179)
    expect(currentText()).toContain('Box breathing')
    tick(1)
    expect(currentText()).toContain('Gamma')
  })
})

describe('remembering and clearing', () => {
  it('keeps the chosen length when stepping back to the card', () => {
    arrive({ tapToStart: true })
    fireEvent.click(longer())
    fireEvent.click(primary()); tick(3); tick(180)
    expect(currentText()).toContain('Gamma')
    vi.advanceTimersByTime(1000)
    fireEvent.click(screen.getByRole('button', { name: '‹' }))
    expect(pickerValue()).toBe('3 min')
  })

  it('Reset goes back to the default', () => {
    arrive()
    fireEvent.click(longer())
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }))
    tick(2)
    fireEvent.click(screen.getByRole('button', { name: '›' }))
    vi.advanceTimersByTime(1000)
    expect(pickerValue()).toBe('2 min')
  })

  it('never writes the chosen length into the preset', () => {
    const { patchPreset } = arrive()
    fireEvent.click(longer())
    expect(patchPreset).not.toHaveBeenCalledWith(expect.objectContaining({ exercises: expect.anything() }))
  })
})

describe('peeking cards', () => {
  it('show the default length but no − or +', () => {
    renderEvening(config())
    expect(pageText()).toContain('2 min')
    expect(screen.queryByRole('button', { name: 'Longer' })).toBeNull()
  })
})
