import { test as base, expect } from '@playwright/test'

export const sections = [
  { name: 'Standing', color: '#c4956a' },
  { name: 'Floor', color: '#b8785a' },
]

// Durations of a few seconds: these specs run on real time.
export function routine({ tapToStart = false, exercises } = {}) {
  return {
    id: 't1', name: 'E2E', sections, switchBuffer: 4, transitionTime: 5, tapToStart, muted: true,
    exercises: exercises ?? [
      { id: 1, section: 'Standing', title: 'Alpha', timing: '3s', duration: 3, steps: ['alpha step'] },
      { id: 2, section: 'Floor', title: 'Pick one', timing: '', duration: 3, steps: [], options: [
        { title: 'Short opt', duration: 3, timing: '3 sec', steps: ['short step'] },
        { title: 'Long bilateral', duration: 8, bilateral: true, timing: '4s per side', steps: ['long step'] },
      ] },
      { id: 3, section: 'Floor', title: 'Gamma', timing: '3s', duration: 3,
        steps: Array.from({ length: 30 }, (_, i) => `Gamma step ${i + 1} — a long line so the list has to scroll on a phone`) },
    ],
  }
}

// Seeds the evening preset (first load only, so a reload sees what the app
// saved) and swaps in a recording wake lock: headless Chromium has no screen
// to keep on, and the record is what the tests assert on.
export async function seed(page, body) {
  await page.addInitScript(([store]) => {
    if (!localStorage.getItem('alignedflow-evening-presets')) localStorage.setItem('alignedflow-evening-presets', store)
    window.__wakeLock = { held: 0, requests: 0 }
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: {
      request: async () => {
        window.__wakeLock.requests++
        window.__wakeLock.held++
        const listeners = []
        let released = false
        return {
          addEventListener: (_, fn) => listeners.push(fn),
          release: async () => { if (released) return; released = true; window.__wakeLock.held--; listeners.forEach(fn => fn()) },
        }
      },
    } })
  }, [JSON.stringify({ presets: [body], activeId: body.id })])
}

export async function openEvening(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'EVENING', exact: true }).click()
  // Work mode fades out over the switch, START button and all.
  await expect(primary(page)).toHaveCount(1)
  await expect(primary(page)).toHaveText('PLAY')
}

export const primary = (page) => page.locator('button').filter({ hasText: /^(PLAY|PAUSE|START|CHOOSE|DONE)$/ })
export const current = (page) => page.locator('[aria-current="step"]')
export const wakeLock = (page) => page.evaluate(() => window.__wakeLock)

// Fails any test whose page throws or logs an error.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    await use(page)
    expect(errors, 'page errors').toEqual([])
  },
})

export { expect }
