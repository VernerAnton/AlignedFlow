import { test, expect, seed, openEvening, routine, primary, current } from './helpers.js'

const withBreathing = routine({ exercises: [
  { id: 1, section: 'Standing', title: 'Alpha', timing: '3s', duration: 3, steps: ['alpha step'] },
  { id: 2, section: 'Floor', title: 'Box breathing', duration: 120, variableLength: true, maxDuration: 180, steps: ['in 4, hold 4'] },
] })
const pickerValue = async (page) => (await current(page).textContent()).match(/−(.*?)up to/)?.[1]

test('a variable card waits, takes − and +, and starts on a tap', async ({ page }) => {
  await seed(page, withBreathing)
  await openEvening(page)
  await primary(page).click()
  await expect(primary(page)).toHaveText('START', { timeout: 15_000 })
  await expect(current(page)).toContainText('up to 3 min')
  expect(await pickerValue(page)).toBe('2 min')

  await page.getByRole('button', { name: 'Longer' }).click()
  expect(await pickerValue(page)).toBe('3 min')
  await expect(page.getByRole('button', { name: 'Longer' })).toBeDisabled()
  await page.waitForTimeout(1500)
  await expect(primary(page)).toHaveText('START')     // − / + never start it

  await current(page).getByText('in 4, hold 4').click()
  await expect(current(page)).toContainText('Get Ready')
  await expect(current(page)).not.toContainText('Get Ready', { timeout: 5000 })
  await expect(page.getByRole('button', { name: 'Longer' })).toHaveCount(0)
  await expect(current(page)).toContainText('3 min')
})

test('the - and + keys adjust it', async ({ page }) => {
  await seed(page, withBreathing)
  await openEvening(page)
  await primary(page).click()
  await expect(primary(page)).toHaveText('START', { timeout: 15_000 })
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('-')
  expect(await pickerValue(page)).toBe('1 min')
  await page.keyboard.press('+')
  await page.keyboard.press('+')
  expect(await pickerValue(page)).toBe('3 min')
})

test('a variable card made in the builder offers its length on the card', async ({ page }) => {
  await seed(page, routine({ exercises: [
    { id: 1, section: 'Floor', title: 'Breathing', timing: '10 min', duration: 600, steps: ['in', 'out'] },
  ] }))
  await openEvening(page)
  await page.getByRole('button', { name: 'EDIT', exact: true }).click()
  await page.getByText('Breathing', { exact: true }).click()
  await page.getByText(/Variable length — choose how long/).click()
  await page.getByRole('slider', { name: 'Max length in minutes' }).fill('20')
  await expect(page.getByText('10m · up to 20m')).toBeVisible()
  await page.getByRole('button', { name: '‹' }).first().click()
  await expect(current(page)).toContainText('up to 20 min')
  expect(await pickerValue(page)).toBe('10 min')
})
