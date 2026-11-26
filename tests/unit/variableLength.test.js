import { describe, it, expect } from 'vitest'
import {
  isVariableCard, variableMax, stepLength, migrateEvening, parseImport, presetSchemaText,
  VARIABLE_MIN, VARIABLE_MAX,
} from '../../src/dataStore.js'

const sections = [{ name: 'Lying', color: '#8e6a99' }]
const breathe = (extra = {}) => ({ id: 1, section: 'Lying', title: 'Box breathing', duration: 600, variableLength: true, steps: ['in 4, hold 4'], ...extra })
const importEvening = (exercises) => parseImport('evening', JSON.stringify({ sections, exercises }))

describe('limits', () => {
  it('run from 1 to 30 minutes', () => {
    expect(VARIABLE_MIN).toBe(60)
    expect(VARIABLE_MAX).toBe(1800)
  })
})

describe('isVariableCard', () => {
  it.each([
    ['a flagged card', breathe(), true],
    ['an unflagged card', { title: 'X', duration: 60 }, false],
    ['a flag set to false', breathe({ variableLength: false }), false],
    ['a choice card, even if flagged', breathe({ options: [{ title: 'A', steps: [] }] }), false],
    ['nothing', undefined, false],
  ])('%s → %s', (_, ex, expected) => {
    expect(isVariableCard(ex)).toBe(expected)
  })
})

describe('variableMax', () => {
  it.each([
    ['no maximum set', undefined, 1800],
    ['a maximum inside the range', 900, 900],
    ['a maximum above 30 minutes', 3600, 1800],
    ['a maximum below a minute', 10, 60],
    ['a maximum that is not a number', 'lots', 1800],
  ])('%s → %ss', (_, maxDuration, expected) => {
    expect(variableMax(breathe({ maxDuration }))).toBe(expected)
  })
})

describe('stepLength', () => {
  it.each([
    ['+ from a whole minute', 600, 1, 1800, 660],
    ['− from a whole minute', 600, -1, 1800, 540],
    ['+ from 1:30 snaps up to 2 min', 90, 1, 1800, 120],
    ['− from 1:30 snaps down to 1 min', 90, -1, 1800, 60],
    ['− never goes under 1 min', 60, -1, 1800, 60],
    ['+ never goes over the maximum', 900, 1, 900, 900],
    ['+ stops at a maximum that is not a whole minute', 600, 1, 630, 630],
  ])('%s', (_, current, dir, max, expected) => {
    expect(stepLength(current, dir, max)).toBe(expected)
  })
})

describe('migrateEvening', () => {
  const migrate = (ex) => migrateEvening({ sections, exercises: [ex] }).exercises[0]

  it('fills in a 30-minute maximum when none is set', () => {
    expect(migrate(breathe()).maxDuration).toBe(1800)
  })

  it('pulls a default above the maximum down to it', () => {
    expect(migrate(breathe({ duration: 1200, maxDuration: 900 })).duration).toBe(900)
  })

  it('raises a default under a minute to one', () => {
    expect(migrate(breathe({ duration: 20 })).duration).toBe(60)
  })

  it('gives a flagged card with no duration a 10-minute default', () => {
    expect(migrate(breathe({ duration: undefined })).duration).toBe(600)
  })

  it('caps a maximum over 30 minutes', () => {
    expect(migrate(breathe({ maxDuration: 5000 })).maxDuration).toBe(1800)
  })

  it('drops the flag from a card that is also a choice card', () => {
    const ex = migrate(breathe({ maxDuration: 900, options: [{ title: 'A', duration: 60, steps: [] }] }))
    expect(ex.variableLength).toBeUndefined()
    expect(ex.maxDuration).toBeUndefined()
    expect(ex.options).toHaveLength(1)
  })

  it('leaves ordinary cards alone', () => {
    const plain = { id: 2, section: 'Lying', title: 'Plain', duration: 30, steps: [] }
    expect(migrate(plain)).toBe(plain)
  })
})

describe('import', () => {
  it('accepts a variable-length card', () => {
    const r = importEvening([breathe({ maxDuration: 1200 })])
    expect(r.ok).toBe(true)
    expect(r.presets[0].exercises[0]).toMatchObject({ variableLength: true, maxDuration: 1200, duration: 600 })
  })

  it('refuses a variableLength that is not true or false', () => {
    expect(importEvening([breathe({ variableLength: 'yes' })]).error)
      .toBe('"Box breathing" has a variableLength that is not true or false')
  })

  it('refuses a maxDuration that is not a positive number', () => {
    expect(importEvening([breathe({ maxDuration: -5 })]).error)
      .toBe('"Box breathing" has no valid maxDuration (seconds)')
  })

  it('documents the feature in the schema handed to an AI, with an example that imports', () => {
    const schema = presetSchemaText('evening')
    expect(schema).toMatch(/variableLength/)
    expect(schema).toMatch(/maxDuration/)
    const r = parseImport('evening', schema.slice(schema.indexOf('{')))
    expect(r.ok).toBe(true)
    expect(r.presets[0].exercises.filter(isVariableCard)).toHaveLength(1)
  })
})
