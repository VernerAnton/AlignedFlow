import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import EveningBuilder from '../../src/EveningBuilder.jsx'
import { getActivePreset } from '../../src/dataStore.js'

const sections = [{ name: 'Floor', color: '#b8785a' }]
const lizard = { id: 1, section: 'Floor', title: 'Lizard', timing: '90 sec per side', duration: 180, bilateral: true, steps: ['lunge', 'sink'] }
const plain = { id: 2, section: 'Floor', title: 'Plain', timing: '60s', duration: 60, steps: ['one', 'two', 'three'] }

let latest
function Harness({ body }) {
  const [store, setStore] = useState({ presets: [{ id: 't1', name: 'Test', ...body }], activeId: 't1' })
  latest = store
  return <EveningBuilder store={store} setStore={setStore} onBack={() => {}} />
}

function renderBuilder(overrides = {}) {
  render(<Harness body={{ sections, switchBuffer: 8, transitionTime: 10, tapToStart: false, muted: false, exercises: [lizard, plain], ...overrides }} />)
}
// The builder autosaves on a 300ms debounce.
const saved = () => { act(() => { vi.advanceTimersByTime(400) }); return getActivePreset(latest) }
const savedCard = (id) => saved().exercises.find(e => e.id === id)
const open = (title) => fireEvent.click(screen.getByText(title, { selector: 'span' }))
const choiceToggle = () => screen.getByText(/Choice card — pick one move/)
const commit = (input, value) => { fireEvent.change(input, { target: { value } }); fireEvent.blur(input) }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
afterEach(() => vi.useRealTimers())

describe('wait-for-tap setting', () => {
  it('saves to the preset', () => {
    renderBuilder()
    fireEvent.click(screen.getByText('WAIT FOR TAP BEFORE EACH CARD'))
    expect(saved().tapToStart).toBe(true)
  })

  it('marks the transition time as unused while it is on', () => {
    renderBuilder({ tapToStart: true })
    expect(screen.getByText(/TRANSITION TIME — UNUSED WITH WAIT FOR TAP/)).toBeTruthy()
  })

  it('is put back by Reset → Settings', () => {
    renderBuilder({ tapToStart: true })
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }))
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('wait for tap'))
    expect(saved().tapToStart).toBe(false)
  })
})

describe('turning a card into a choice card', () => {
  it('seeds two options, the first a copy of the card', () => {
    renderBuilder()
    open('Lizard')
    fireEvent.click(choiceToggle())
    const card = savedCard(1)
    expect(card.options).toHaveLength(2)
    expect(card.options[0]).toEqual({ title: 'Lizard', steps: ['lunge', 'sink'], duration: 180, bilateral: true, timing: '90 sec per side' })
    expect(card.options[1]).toMatchObject({ title: 'Option 2', duration: 180, bilateral: true })
  })

  it('swaps the card-level fields for a heading and the option list', () => {
    renderBuilder()
    open('Lizard')
    fireEvent.click(choiceToggle())
    expect(screen.getByText('Heading')).toBeTruthy()
    expect(screen.getByText('Options')).toBeTruthy()
    expect(screen.getByRole('button', { name: '+ OPTION' })).toBeTruthy()
  })

  it('shows the option count and duration range on the collapsed row', () => {
    renderBuilder({ exercises: [{ ...lizard, options: [{ title: 'A', duration: 45, steps: [] }, { title: 'B', duration: 180, steps: [] }] }, plain] })
    expect(screen.getByText('2×')).toBeTruthy()
    expect(screen.getByText('45–180s')).toBeTruthy()
  })

  it('shows a single duration when every option matches', () => {
    renderBuilder({ exercises: [{ ...lizard, options: [{ title: 'A', duration: 90, steps: [] }, { title: 'B', duration: 90, steps: [] }] }, plain] })
    expect(screen.getByText('90s')).toBeTruthy()
  })
})

describe('editing options', () => {
  const twoOptions = { ...lizard, options: [
    { title: 'Lizard', duration: 180, bilateral: true, timing: '90 sec per side', steps: ['lunge'] },
    { title: 'Hero', duration: 120, bilateral: false, timing: '2 min', steps: ['kneel'] },
  ] }
  const setup = () => { renderBuilder({ exercises: [twoOptions, plain] }); open('Lizard') }
  const openOption = (title) => fireEvent.click(screen.getAllByText(title).find(el => el.tagName === 'SPAN' && el.closest('[style*="cursor: pointer"]')))

  it("gives each option its own duration, and the card follows option 1's", () => {
    setup()                                   // option 1 opens by default
    commit(screen.getByDisplayValue('180'), '200')
    expect(savedCard(1).options[0].duration).toBe(200)
    expect(savedCard(1).duration).toBe(200)

    openOption('Hero')
    commit(screen.getByDisplayValue('120'), '75')
    expect(savedCard(1).options[1].duration).toBe(75)
    expect(savedCard(1).duration).toBe(200)
  })

  it('sets bilateral per option', () => {
    setup()
    openOption('Hero')
    const bilateral = screen.getAllByText('Bilateral').at(-1)
    fireEvent.click(bilateral)
    expect(savedCard(1).options[1].bilateral).toBe(true)
    expect(savedCard(1).options[0].bilateral).toBe(true)
  })

  it('edits an option title, timing and steps', () => {
    setup()
    openOption('Hero')
    fireEvent.change(screen.getByDisplayValue('Hero'), { target: { value: 'Reclined Hero' } })
    fireEvent.change(screen.getByDisplayValue('2 min'), { target: { value: '120 sec' } })
    fireEvent.change(screen.getByDisplayValue('kneel'), { target: { value: 'kneel, sit back' } })
    fireEvent.click(screen.getByRole('button', { name: '+ STEP' }))
    expect(savedCard(1).options[1]).toMatchObject({ title: 'Reclined Hero', timing: '120 sec', steps: ['kneel, sit back', 'New step'] })
  })

  it('adds an option that starts from the last one\'s timing', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: '+ OPTION' }))
    const card = savedCard(1)
    expect(card.options).toHaveLength(3)
    expect(card.options[2]).toMatchObject({ title: 'Option 3', duration: 120, bilateral: false })
  })

  it('moving an option to the top makes the card follow it', () => {
    setup()
    const deleteButtons = screen.getAllByTitle('Delete option')
    const heroRow = deleteButtons[1].parentElement
    fireEvent.click(within(heroRow).getByRole('button', { name: '↑' }))
    const card = savedCard(1)
    expect(card.options.map(o => o.title)).toEqual(['Hero', 'Lizard'])
    expect(card.duration).toBe(120)
  })

  it('deletes an option, but never the last one', () => {
    setup()
    fireEvent.click(screen.getAllByTitle('Delete option')[0])
    expect(savedCard(1).options.map(o => o.title)).toEqual(['Hero'])
    const last = screen.getByTitle('A choice card needs at least one option')
    expect(last.disabled).toBe(true)
  })
})

describe('turning a choice card back into a single exercise', () => {
  const card = { ...lizard, title: 'Hip opener', options: [
    { title: 'Hero', duration: 120, bilateral: false, timing: '2 min', steps: ['kneel'] },
    { title: 'Lizard', duration: 180, bilateral: true, steps: ['lunge'] },
  ] }

  it("keeps option 1's move after confirming", () => {
    renderBuilder({ exercises: [card, plain] })
    open('Hip opener')
    fireEvent.click(choiceToggle())
    expect(window.confirm).toHaveBeenCalled()
    const ex = savedCard(1)
    expect(ex.options).toBeUndefined()
    expect(ex).toMatchObject({ title: 'Hero', duration: 120, bilateral: false, timing: '2 min', steps: ['kneel'] })
  })

  it('changes nothing if the confirm is cancelled', () => {
    window.confirm.mockReturnValue(false)
    renderBuilder({ exercises: [card, plain] })
    open('Hip opener')
    fireEvent.click(choiceToggle())
    expect(savedCard(1).options).toHaveLength(2)
  })
})

describe('ordinary cards after the step-list refactor', () => {
  it('still edit, add, reorder and delete steps', () => {
    renderBuilder()
    open('Plain')
    fireEvent.change(screen.getByDisplayValue('one'), { target: { value: 'first' } })
    const rowOf = (value) => screen.getByDisplayValue(value).parentElement
    fireEvent.click(within(rowOf('three')).getByRole('button', { name: '↑' }))
    fireEvent.click(within(rowOf('two')).getByRole('button', { name: '✕' }))
    fireEvent.click(screen.getByRole('button', { name: '+ STEP' }))
    expect(savedCard(2).steps).toEqual(['first', 'three', 'New step'])
  })

  it('still edit duration, timing and bilateral', () => {
    renderBuilder()
    open('Plain')
    commit(screen.getByDisplayValue('60'), '75')
    fireEvent.change(screen.getByDisplayValue('60s'), { target: { value: '75 sec' } })
    fireEvent.click(screen.getByText('Bilateral'))
    expect(savedCard(2)).toMatchObject({ duration: 75, timing: '75 sec', bilateral: true })
    expect(savedCard(2).options).toBeUndefined()
  })
})
