// Runs under the phone project (touch, small screen).
import { test, expect, seed, openEvening, routine, primary, current } from './helpers.js'

async function parkOnGamma(page) {
  await seed(page, routine({ tapToStart: true }))
  await openEvening(page)
  await primary(page).tap()
  await expect(primary(page)).toHaveText('CHOOSE', { timeout: 15_000 })
  await page.getByRole('button', { name: /Short opt/ }).tap()
  await expect(primary(page)).toHaveText('START', { timeout: 12_000 })
  await expect(current(page)).toContainText('Gamma')
}

// A real finger drag through CDP: Playwright's touchscreen API only taps.
async function swipeUp(page, x, y) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 15 }] })
    await page.waitForTimeout(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

test('scrolling a long step list does not start the card', async ({ page }) => {
  await parkOnGamma(page)
  const box = await current(page).getByText('Gamma step 3 —', { exact: false }).boundingBox()
  await swipeUp(page, box.x + 40, box.y + 120)
  await page.waitForTimeout(800)
  await expect(primary(page)).toHaveText('START')
})

test('a tap on the card starts it', async ({ page }) => {
  await parkOnGamma(page)
  const box = await current(page).getByText('Gamma step 2 —', { exact: false }).boundingBox()
  await page.touchscreen.tap(box.x + 40, box.y + 5)
  await expect(current(page)).toContainText('Get Ready')
  await expect(primary(page)).toHaveText('PAUSE')
})

test('a quick double tap starts once', async ({ page }) => {
  await parkOnGamma(page)
  const box = await current(page).getByText('Gamma step 2 —', { exact: false }).boundingBox()
  await page.touchscreen.tap(box.x + 40, box.y + 5)
  await page.waitForTimeout(120)
  await page.touchscreen.tap(box.x + 40, box.y + 5)
  await page.waitForTimeout(1000)
  await expect(primary(page)).toHaveText('PAUSE')
})

test('options are tappable rows on a phone', async ({ page }) => {
  await seed(page, routine({ tapToStart: false }))
  await openEvening(page)
  await page.getByRole('button', { name: '›' }).tap()
  const option = page.getByRole('button', { name: /Long bilateral/ })
  const box = await option.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(44)
  await option.tap()
  await expect(current(page)).toContainText('Get Ready')
})
