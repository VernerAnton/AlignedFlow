import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CONFIG, isChoiceCard, resolveExercise, migrateEvening, parseImport, presetSchemaText,
} from '../../src/dataStore.js'

const sections = [{ name: 'Floor', color: '#b8785a' }]
const importEvening = (body) => parseImport('evening', JSON.stringify(body))
const choiceCard = (extra = {}) => ({
  id: 7, section: 'Floor', title: 'Hip opener', timing: '90 sec', duration: 90, bilateral: true, steps: ['card step'],
  options: [
    { title: 'Lizard', duration: 180, bilateral: true, timing: '90 sec per side', steps: ['l1', 'l2'] },
    { title: 'Reclined Hero', steps: ['r1'] },
  ],
  ...extra,
})

describe('defaults', () => {
  it('ship with tap-to-start off, so the routine stays hands-free', () => {
    expect(DEFAULT_CONFIG.evening.tapToStart).toBe(false)
  })

  it('contain no choice cards — the default routine is untouched', () => {
    expect(DEFAULT_CONFIG.evening.exercises.some(isChoiceCard)).toBe(false)
  })
})

describe('isChoiceCard', () => {
  it.each([
    ['a card with options', { options: [{ title: 'A' }] }, true],
    ['a card with an empty options list', { options: [] }, false],
    ['a card without options', { title: 'X' }, false],
    ['options that are not a list', { options: 'A' }, false],
    ['undefined', undefined, false],
    ['null', null, false],
  ])('%s → %s', (_, ex, expected) => {
    expect(isChoiceCard(ex)).toBe(expected)
  })
})

describe('resolveExercise', () => {
  it('returns the card itself when nothing is picked', () => {
    const card = choiceCard()
    expect(resolveExercise(card, undefined)).toBe(card)
    expect(resolveExercise(card, null)).toBe(card)
  })

  it('returns an ordinary card unchanged whatever index is passed', () => {
    const card = { id: 1, title: 'Plain', duration: 30, steps: [] }
    expect(resolveExercise(card, 0)).toBe(card)
  })

  it("takes the picked option's own fields", () => {
    const r = resolveExercise(choiceCard(), 0)
    expect(r).toMatchObject({
      id: 7, section: 'Floor', title: 'Lizard', duration: 180, bilateral: true,
      timing: '90 sec per side', steps: ['l1', 'l2'], choiceTitle: 'Hip opener',
    })
  })

  it("falls back to the card's duration, bilateral and timing for fields the option leaves out", () => {
    const r = resolveExercise(choiceCard(), 1)
    expect(r).toMatchObject({ title: 'Reclined Hero', duration: 90, bilateral: true, timing: '90 sec', steps: ['r1'] })
  })

  it('lets an option turn bilateral off explicitly', () => {
    const card = choiceCard({ options: [{ title: 'One-sided', bilateral: false, steps: [] }] })
    expect(resolveExercise(card, 0).bilateral).toBe(false)
  })

  it.each([0, -5, 'sixty', null])('ignores an invalid option duration (%s) and uses the card\'s', (bad) => {
    const card = choiceCard({ options: [{ title: 'Bad', duration: bad, steps: [] }] })
    expect(resolveExercise(card, 0).duration).toBe(90)
  })

  it('gives an option without a steps list an empty one rather than crashing the card', () => {
    const card = choiceCard({ options: [{ title: 'No steps' }] })
    expect(resolveExercise(card, 0).steps).toEqual([])
  })

  it('returns the card for an index that no longer exists', () => {
    const card = choiceCard()
    expect(resolveExercise(card, 5)).toBe(card)
  })

  it('does not mutate the card', () => {
    const card = choiceCard()
    const before = JSON.stringify(card)
    resolveExercise(card, 0)
    expect(JSON.stringify(card)).toBe(before)
  })
})

describe('migrateEvening', () => {
  const base = () => ({ sections, exercises: [], switchBuffer: 8, transitionTime: 10, muted: false })

  it('fills in tapToStart for presets saved before it existed', () => {
    expect(migrateEvening(base()).tapToStart).toBe(false)
  })

  it('keeps a tapToStart that is already set', () => {
    expect(migrateEvening({ ...base(), tapToStart: true }).tapToStart).toBe(true)
  })

  it("gives a choice card with no duration its first timed option's", () => {
    const e = migrateEvening({ ...base(), exercises: [{ section: 'Floor', title: 'Pick', options: [{ title: 'A', steps: [] }, { title: 'B', duration: 45, steps: [] }] }] })
    expect(e.exercises[0].duration).toBe(45)
    expect(e.exercises[0].steps).toEqual([])
  })

  it('falls back to 60s when no option of a choice card is timed', () => {
    const e = migrateEvening({ ...base(), exercises: [{ section: 'Floor', title: 'Pick', options: [{ title: 'A', steps: [] }] }] })
    expect(e.exercises[0].duration).toBe(60)
  })

  it("keeps a choice card's own duration and steps when it has them", () => {
    const e = migrateEvening({ ...base(), exercises: [choiceCard()] })
    expect(e.exercises[0].duration).toBe(90)
    expect(e.exercises[0].steps).toEqual(['card step'])
  })

  it('leaves ordinary cards alone', () => {
    const plain = { id: 1, section: 'Floor', title: 'Plain', duration: 30, steps: ['x'] }
    const e = migrateEvening({ ...base(), exercises: [plain] })
    expect(e.exercises[0]).toBe(plain)
  })
})

describe('import validation', () => {
  it('accepts a choice card and renumbers ids as before', () => {
    const r = importEvening({ sections, exercises: [choiceCard({ id: 99 })] })
    expect(r.ok).toBe(true)
    expect(r.presets[0].exercises[0].id).toBe(1)
    expect(r.presets[0].exercises[0].options).toHaveLength(2)
  })

  it('accepts a choice card that leaves duration and steps to its options', () => {
    const r = importEvening({ sections, exercises: [{ section: 'Floor', title: 'Pick', options: [{ title: 'A', duration: 30, steps: [] }, { title: 'B', steps: ['x'] }] }] })
    expect(r.ok).toBe(true)
    const ex = r.presets[0].exercises[0]
    expect(ex.duration).toBe(30)
    expect(resolveExercise(ex, 1).duration).toBe(30)
  })

  it.each([
    ['options that are not a list', { duration: 60, steps: [], options: 'A' }, '"Pick" has an options value that is not a list'],
    ['an option that is not an object', { duration: 60, options: ['A'] }, '"Pick" option 1 is not an object'],
    ['an option without a title', { duration: 60, options: [{ steps: [] }] }, '"Pick" option 1 has no title'],
    ['an option without steps', { duration: 60, options: [{ title: 'A' }] }, '"Pick" option 1 has no steps list'],
    ['an option with a bad duration', { duration: 60, options: [{ title: 'A', steps: [], duration: -3 }] }, '"Pick" option 1 has no valid duration (seconds)'],
    ['no duration anywhere', { options: [{ title: 'A', steps: [] }] }, '"Pick" option 1 has no duration, and neither does its card'],
  ])('rejects %s with a readable message', (_, extra, message) => {
    const r = importEvening({ sections, exercises: [{ section: 'Floor', title: 'Pick', ...extra }] })
    expect(r.ok).toBe(false)
    expect(r.error).toBe(message)
  })

  it('still applies the ordinary rules to a card with an empty options list', () => {
    const r = importEvening({ sections, exercises: [{ section: 'Floor', title: 'Pick', options: [] }] })
    expect(r.ok).toBe(false)
    expect(r.error).toBe('"Pick" has no valid duration (seconds)')
  })

  it('still requires a duration and steps on an ordinary card', () => {
    expect(importEvening({ sections, exercises: [{ section: 'Floor', title: 'X', steps: [] }] }).error)
      .toBe('"X" has no valid duration (seconds)')
    expect(importEvening({ sections, exercises: [{ section: 'Floor', title: 'X', duration: 5 }] }).error)
      .toBe('"X" has no steps list')
  })

  it('carries tapToStart through import and fills it in when missing', () => {
    const plain = { section: 'Floor', title: 'X', duration: 5, steps: [] }
    expect(importEvening({ sections, tapToStart: true, exercises: [plain] }).presets[0].tapToStart).toBe(true)
    expect(importEvening({ sections, exercises: [plain] }).presets[0].tapToStart).toBe(false)
  })
})

describe('presetSchemaText', () => {
  const schema = presetSchemaText('evening')
  const example = JSON.parse(schema.slice(schema.indexOf('{')))

  it('documents tapToStart and options for whoever writes a preset from it', () => {
    expect(schema).toMatch(/tapToStart/)
    expect(schema).toMatch(/options/)
    expect(example.tapToStart).toBe(false)
    expect(example.exercises.some(isChoiceCard)).toBe(true)
  })

  it('round-trips through the importer', () => {
    const r = parseImport('evening', schema.slice(schema.indexOf('{')))
    expect(r.ok).toBe(true)
    expect(r.presets[0].exercises.filter(isChoiceCard)).toHaveLength(1)
  })

  it('shows a choice card whose options differ in duration and sides', () => {
    const card = example.exercises.find(isChoiceCard)
    const resolved = card.options.map((_, i) => resolveExercise(card, i))
    expect(new Set(resolved.map(r => r.duration)).size).toBeGreaterThan(1)
    expect(new Set(resolved.map(r => !!r.bilateral)).size).toBe(2)
  })
})
