import { test, expect, seed, openEvening, routine, primary, current } from './helpers.js'

async function arriveAtChoice(page, tapToStart) {
  await seed(page, routine({ tapToStart }))
  await openEvening(page)
  await primary(page).click()
  await expect(primary(page)).toHaveText('CHOOSE', { timeout: 15_000 })
}
const railMax = (page) => page.evaluate(() => Math.max(...[...document.querySelectorAll('span')]
  .map(s => s.textContent).filter(t => /^\d+s$/.test(t)).map(t => parseInt(t))))

for (const tapToStart of [false, true]) {
  test(`a choice card waits for a pick (tap-to-start ${tapToStart ? 'on' : 'off'})`, async ({ page }) => {
    await arriveAtChoice(page, tapToStart)
    await expect(page.getByText('Choose a move · 1–9')).toBeVisible()
    await expect(page.getByRole('button', { name: /Short opt/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Long bilateral/ })).toBeVisible()
    await page.waitForTimeout(3000)
    await expect(primary(page)).toHaveText('CHOOSE')
    await expect(primary(page)).toBeDisabled()
  })
}

test('tapping the card or pressing Space does not skip the pick', async ({ page }) => {
  await arriveAtChoice(page, false)
  await current(page).getByText('Pick one').click()
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('Space')
  await page.waitForTimeout(500)
  await expect(primary(page)).toHaveText('CHOOSE')
})

test('a bilateral option runs its own length with a switch in the middle', async ({ page }) => {
  await arriveAtChoice(page, true)
  await page.getByRole('button', { name: /Long bilateral/ }).click()
  await expect(current(page)).toContainText('Get Ready')
  await expect(current(page)).toContainText('Side 1', { timeout: 5000 })
  await expect(current(page)).toContainText('Pick one · option 2 of 2')
  expect(await railMax(page)).toBe(12)          // 8s + 4s switch buffer
  await expect(current(page)).toContainText('Switch Sides', { timeout: 6000 })
  await expect(current(page)).toContainText('Side 2', { timeout: 6000 })
  await expect(current(page)).toContainText('Gamma', { timeout: 8000 })
})

test('number keys pick an option', async ({ page }) => {
  await arriveAtChoice(page, false)
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('1')
  await expect(current(page)).toContainText('Get Ready')
  await expect(current(page)).toContainText('Pick one · option 1 of 2', { timeout: 5000 })
})

test('Reset forgets the pick', async ({ page }) => {
  await arriveAtChoice(page, false)
  await page.getByRole('button', { name: /Short opt/ }).click()
  await expect(current(page)).toContainText('option 1 of 2', { timeout: 5000 })
  await page.getByRole('button', { name: 'RESET' }).click()
  await expect(current(page)).toContainText('Alpha', { timeout: 3000 })
  // The rewind lets go of the controls one step after card 1 shows.
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: '›' }).click()
  await expect(current(page)).toContainText('2 options')
  await primary(page).click()
  await expect(primary(page)).toHaveText('CHOOSE')
})
