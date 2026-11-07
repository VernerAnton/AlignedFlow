import { test, expect, seed, openEvening, routine, primary, current, wakeLock } from './helpers.js'

const plain = [
  { id: 1, section: 'Standing', title: 'Alpha', timing: '3s', duration: 3, steps: ['alpha step'] },
  { id: 2, section: 'Floor', title: 'Beta', timing: '3s', duration: 3, steps: ['beta step'] },
  { id: 3, section: 'Floor', title: 'Gamma', timing: '3s', duration: 3, steps: ['gamma step'] },
]

// Play → 5s Get Ready → Alpha 3s → parked on Beta.
async function parkOnBeta(page) {
  await seed(page, routine({ tapToStart: true, exercises: plain }))
  await openEvening(page)
  await primary(page).click()
  await expect(primary(page)).toHaveText('START', { timeout: 15_000 })
  await expect(current(page)).toContainText('Beta')
}

test('a card waits for its tap, and the clock does not move meanwhile', async ({ page }) => {
  await parkOnBeta(page)
  await expect(page.getByText('Tap to start · space')).toBeVisible()
  await page.waitForTimeout(4000)
  await expect(primary(page)).toHaveText('START')
  await expect(current(page)).toContainText('Beta')
  await expect(current(page)).not.toContainText('Get Ready')
})

test('a tap on empty screen gives a 3-2-1, then the exercise runs and the next card waits', async ({ page }) => {
  await parkOnBeta(page)
  await page.mouse.click(20, 700)
  await expect(current(page)).toContainText('Get Ready')
  await expect(primary(page)).toHaveText('PAUSE')
  await expect(current(page)).not.toContainText('Get Ready', { timeout: 5000 })
  await expect(current(page)).toContainText('Gamma', { timeout: 6000 })
  await expect(primary(page)).toHaveText('START')
})

test('a double tap starts the card once and leaves it running', async ({ page }) => {
  await parkOnBeta(page)
  await page.mouse.dblclick(20, 700)
  await page.waitForTimeout(1200)
  await expect(primary(page)).toHaveText('PAUSE')
})

test('a double click on START starts the card once and leaves it running', async ({ page }) => {
  await parkOnBeta(page)
  await primary(page).dblclick()
  await page.waitForTimeout(1200)
  await expect(primary(page)).toHaveText('PAUSE')
})

// The real browser clicks a focused button on Space by itself; the app must
// not handle the same press a second time.
test('Space on a focused button toggles exactly once', async ({ page }) => {
  await parkOnBeta(page)
  await primary(page).focus()
  await page.keyboard.press('Space')
  await expect(primary(page)).toHaveText('PAUSE')
  await page.waitForTimeout(700)
  await page.keyboard.press('Space')
  await expect(primary(page)).toHaveText('PLAY')
  await page.waitForTimeout(300)
  await expect(primary(page)).toHaveText('PLAY')
})

test('Space with nothing focused starts, pauses and resumes', async ({ page }) => {
  await parkOnBeta(page)
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('Space')
  await expect(primary(page)).toHaveText('PAUSE')
  await page.waitForTimeout(700)
  await page.keyboard.press('Space')
  await expect(primary(page)).toHaveText('PLAY')
  await page.keyboard.press('Space')
  await expect(primary(page)).toHaveText('PAUSE')
})

test('Prev mid-routine parks on the previous card', async ({ page }) => {
  await parkOnBeta(page)
  await primary(page).click()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: '‹' }).click()
  await expect(current(page)).toContainText('Alpha')
  await expect(primary(page)).toHaveText('START')
})

test('Reset from a waiting card returns to card 1, idle', async ({ page }) => {
  await parkOnBeta(page)
  await page.getByRole('button', { name: 'RESET' }).click()
  await expect(current(page)).toContainText('Alpha', { timeout: 3000 })
  await expect(primary(page)).toHaveText('PLAY')
  await expect(page.getByText('Tap to start')).toHaveCount(0)
})

test('the screen is kept awake while waiting, and let go on pause and reset', async ({ page }) => {
  await parkOnBeta(page)
  expect((await wakeLock(page)).held).toBe(1)
  await primary(page).click()
  await page.waitForTimeout(700)
  await primary(page).click()                 // pause
  await expect(primary(page)).toHaveText('PLAY')
  await expect.poll(async () => (await wakeLock(page)).held).toBe(0)
  await primary(page).click()                 // resume
  await expect.poll(async () => (await wakeLock(page)).held).toBe(1)
  await page.getByRole('button', { name: 'RESET' }).click()
  await expect.poll(async () => (await wakeLock(page)).held).toBe(0)
})

test('with tap-to-start off the routine still runs hands-free to the end', async ({ page }) => {
  await seed(page, routine({ tapToStart: false, exercises: plain.slice(0, 2) }))
  await openEvening(page)
  await primary(page).click()
  await expect(page.getByText('Get into position — 5s')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText('Tap to start')).toHaveCount(0)
  await expect(page.getByText('Evening routine done.')).toBeVisible({ timeout: 15_000 })
  await expect.poll(async () => (await wakeLock(page)).held).toBe(0)
})
