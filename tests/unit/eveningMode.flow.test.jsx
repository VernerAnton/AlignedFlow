import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import * as sounds from '../../src/sounds.js'
import { sendNotification } from '../../src/notifications.js'
import {
  installClock, uninstallClock, tick, makeConfig, renderEvening, primary, currentCard, currentText, pageText, isWaiting,
  alpha, beta, gamma,
} from './helpers/evening.jsx'

vi.mock('../../src/sounds.js', () => ({
  playPulseTone: vi.fn(), playRingTone: vi.fn(), playSide2Chime: vi.fn(), playExerciseCompleteSound: vi.fn(),
  playExerciseStartSound: vi.fn(), playDoneSound: vi.fn(), playEndingTick: vi.fn(), unlockAudio: vi.fn(),
}))
vi.mock('../../src/notifications.js', () => ({ sendNotification: vi.fn() }))

beforeEach(installClock)
afterEach(uninstallClock)

const play = () => fireEvent.click(primary())

describe('tap-to-start off — the automatic flow is unchanged', () => {
  it('runs Get Ready → exercise → get-into-position gap → exercise → done on its own', () => {
    renderEvening(makeConfig({ exercises: [alpha, beta] }))
    play()
    expect(currentText()).toContain('Get Ready')
    tick(5)
    expect(currentText()).toContain('Alpha')
    expect(currentText()).not.toContain('Get Ready')
    expect(sounds.playExerciseStartSound).toHaveBeenCalledTimes(1)

    tick(4)
    expect(currentText()).toContain('Beta')
    expect(pageText()).toContain('Get into position — 5s')
    expect(sounds.playExerciseCompleteSound).toHaveBeenCalledTimes(1)
    expect(isWaiting()).toBe(false)

    tick(2)
    expect(currentText()).toContain('Get Ready')   // final 3-2-1 of the gap
    tick(3)
    expect(sounds.playExerciseStartSound).toHaveBeenCalledTimes(2)
    expect(primary().textContent).toBe('PAUSE')

    tick(3)
    expect(pageText()).toContain('Evening routine done.')
    expect(primary().textContent).toBe('DONE')
    expect(sounds.playDoneSound).toHaveBeenCalledTimes(1)
    expect(sendNotification).toHaveBeenCalledWith('Evening Routine Complete', expect.any(String))
  })

  it('uses the preset transition time for the gap, not the count-in length', () => {
    renderEvening(makeConfig({ transitionTime: 9, exercises: [alpha, beta] }))
    play(); tick(5); tick(4)
    expect(pageText()).toContain('Get into position — 9s')
    expect(pageText()).toContain('9s')   // rail top label
  })

  it('pauses and resumes mid-exercise without moving on', () => {
    renderEvening(makeConfig({ exercises: [alpha, beta] }))
    play(); tick(5); tick(2)
    vi.advanceTimersByTime(600)          // clear of the double-tap window
    fireEvent.click(primary())
    expect(primary().textContent).toBe('PLAY')
    tick(10)
    expect(currentText()).toContain('Alpha')
    fireEvent.click(primary())
    tick(2)
    expect(currentText()).toContain('Beta')
  })
})

describe('tap-to-start on', () => {
  const config = () => makeConfig({ tapToStart: true })

  it('starts the first card from Play with the usual 5s Get Ready, not an extra wait', () => {
    renderEvening(config())
    play()
    expect(currentText()).toContain('Get Ready')
    expect(isWaiting()).toBe(false)
    tick(5)
    expect(primary().textContent).toBe('PAUSE')
  })

  it('parks the next card until it is tapped, with START and a hint', () => {
    renderEvening(config())
    play(); tick(5); tick(4)
    expect(currentText()).toContain('Beta')
    expect(primary().textContent).toBe('START')
    expect(pageText()).toContain('Tap to start · space')
    expect(sounds.playExerciseCompleteSound).toHaveBeenCalledTimes(1)
    expect(pageText()).not.toContain('Get into position')
  })

  it('does not count down while waiting, however long it waits', () => {
    renderEvening(config())
    play(); tick(5); tick(4)
    tick(120)
    expect(primary().textContent).toBe('START')
    expect(currentText()).toContain('Beta')
    expect(sounds.playExerciseStartSound).toHaveBeenCalledTimes(1)
  })

  it('a tap gives a 3-2-1 count-in, then the exercise runs its full length', () => {
    renderEvening(config())
    play(); tick(5); tick(4)
    fireEvent.click(currentCardStep('beta step'))
    expect(currentText()).toContain('Get Ready')
    expect(currentText()).toContain('3')
    expect(sounds.playRingTone).toHaveBeenCalled()
    expect(sounds.unlockAudio).toHaveBeenCalled()
    tick(3)
    expect(currentText()).not.toContain('Get Ready')
    expect(sounds.playExerciseStartSound).toHaveBeenCalledTimes(2)
    // Beta is 3s: still running after 2, parked on Gamma after 3.
    tick(2)
    expect(currentText()).toContain('Beta')
    tick(1)
    expect(currentText()).toContain('Gamma')
    expect(primary().textContent).toBe('START')
  })

  it('shows the count-in on the rail as its own 3s, not the transition time', () => {
    renderEvening(config())
    play(); tick(5); tick(4)
    fireEvent.click(primary())
    expect(pageText()).toContain('3s')
    expect(pageText()).not.toContain('5s')
  })

  it('START does the same as a tap', () => {
    renderEvening(config())
    play(); tick(5); tick(4)
    fireEvent.click(primary())
    expect(currentText()).toContain('Get Ready')
    tick(3)
    expect(primary().textContent).toBe('PAUSE')
  })

  it('finishes normally after the last card', () => {
    renderEvening(config())
    play(); tick(5); tick(4)
    fireEvent.click(primary()); tick(3); tick(3)
    fireEvent.click(primary()); tick(3); tick(3)
    expect(pageText()).toContain('Evening routine done.')
  })

  it('notifies only when the app is in the background as a card starts waiting', () => {
    let state = 'visible'
    Object.defineProperty(document, 'visibilityState', { get: () => state, configurable: true })
    renderEvening(config())
    play(); tick(5); tick(4)
    expect(sendNotification).not.toHaveBeenCalled()
    fireEvent.click(primary()); tick(3)
    state = 'hidden'
    tick(3)
    expect(sendNotification).toHaveBeenCalledWith('Ready when you are', 'Tap to start Gamma.')
    delete document.visibilityState
  })
})

describe('Prev / Next / Reset', () => {
  it('Next and Prev while idle stay idle', () => {
    renderEvening(makeConfig({ tapToStart: true }))
    fireEvent.click(nav('›'))
    vi.advanceTimersByTime(1000)
    expect(currentText()).toContain('Beta')
    expect(primary().textContent).toBe('PLAY')
    expect(isWaiting()).toBe(false)
  })

  it('stepping mid-routine with tap-to-start on parks on the new card', () => {
    renderEvening(makeConfig({ tapToStart: true }))
    play(); tick(5); tick(1)
    fireEvent.click(nav('›'))
    expect(currentText()).toContain('Beta')
    expect(primary().textContent).toBe('START')
  })

  it('stepping from a waiting card parks on the next one even with tap-to-start off', () => {
    renderEvening(makeConfig({ exercises: [alpha, { ...beta, options: [{ title: 'Only', duration: 3, steps: [] }] }, gamma] }))
    play(); tick(5); tick(4)
    expect(primary().textContent).toBe('CHOOSE')
    vi.advanceTimersByTime(1000)
    fireEvent.click(nav('›'))
    expect(currentText()).toContain('Gamma')
    expect(primary().textContent).toBe('START')
    tick(10)
    expect(primary().textContent).toBe('START')
  })

  it('stepping mid-routine with tap-to-start off keeps running, as before', () => {
    renderEvening(makeConfig({ exercises: [alpha, beta, gamma] }))
    play(); tick(5); tick(1)
    fireEvent.click(nav('›'))
    expect(currentText()).toContain('Beta')
    expect(primary().textContent).toBe('PAUSE')
  })

  it('Reset from a waiting card goes back to idle on card 1', () => {
    renderEvening(makeConfig({ tapToStart: true }))
    play(); tick(5); tick(4)
    fireEvent.click(nav('RESET'))
    tick(2)
    expect(currentText()).toContain('Alpha')
    expect(primary().textContent).toBe('PLAY')
    expect(isWaiting()).toBe(false)
  })
})

function nav(label) { return screen.getByRole('button', { name: label }) }
function currentCardStep(text) { return within(currentCard()).getByText(text) }
