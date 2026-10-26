import { describe, it, expect, vi, beforeEach } from 'vitest'

// sounds.js keeps one AudioContext for the life of the page, so each test
// loads a fresh copy of the module against its own fake context.
function fakeAudio(state, refuse = false) {
  const ctx = { state, resume: vi.fn(() => refuse ? Promise.reject(new Error('InvalidStateError')) : Promise.resolve()), currentTime: 0 }
  vi.stubGlobal('AudioContext', vi.fn(() => ctx))
  return ctx
}

async function loadSounds() {
  vi.resetModules()
  return import('../../src/sounds.js')
}

describe('unlockAudio', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it.each(['suspended', 'interrupted'])('resumes a context that is %s', async (state) => {
    const ctx = fakeAudio(state)
    const { unlockAudio } = await loadSounds()
    unlockAudio()
    expect(ctx.resume).toHaveBeenCalledTimes(1)
  })

  it.each(['running', 'closed'])('leaves a context that is %s alone', async (state) => {
    const ctx = fakeAudio(state)
    const { unlockAudio } = await loadSounds()
    unlockAudio()
    expect(ctx.resume).not.toHaveBeenCalled()
  })

  it('swallows a refused resume instead of throwing an unhandled rejection', async () => {
    const ctx = fakeAudio('interrupted', true)
    const { unlockAudio } = await loadSounds()
    expect(() => unlockAudio()).not.toThrow()
    await Promise.resolve()
    expect(ctx.resume).toHaveBeenCalled()
  })

  it('creates the context once and reuses it', async () => {
    fakeAudio('running')
    const { unlockAudio } = await loadSounds()
    unlockAudio(); unlockAudio(); unlockAudio()
    expect(globalThis.AudioContext).toHaveBeenCalledTimes(1)
  })
})
