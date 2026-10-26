import { test, expect, seed, openEvening, routine, primary, current } from './helpers.js'

const start = routine({ exercises: [
  { id: 1, section: 'Standing', title: 'Alpha', timing: '3s', duration: 3, steps: ['alpha step'] },
  { id: 2, section: 'Floor', title: 'Gamma', timing: '3s', duration: 3, steps: ['gamma step'] },
] })
const stored = (page) => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('alignedflow-evening-presets'))
  return s.presets.find(p => p.id === s.activeId)
})

test('a choice card built in the builder runs, and survives a reload', async ({ page }) => {
  await seed(page, start)
  await openEvening(page)
  await page.getByRole('button', { name: 'EDIT', exact: true }).click()

  await page.getByText('WAIT FOR TAP BEFORE EACH CARD').click()
  await page.getByText('Alpha', { exact: true }).click()
  await page.getByText(/Choice card — pick one move/).click()
  await page.locator('input[value="Option 2"]').fill('Bravo opt')
  await page.locator('input[inputmode="numeric"]').first().fill('5')
  await page.locator('input[inputmode="numeric"]').first().blur()
  await expect(page.getByText('3–5s')).toBeVisible()

  await expect.poll(async () => (await stored(page)).exercises[0].options?.length).toBe(2)
  const saved = await stored(page)
  expect(saved.tapToStart).toBe(true)
  expect(saved.exercises[0].options.map(o => [o.title, o.duration])).toEqual([['Alpha', 3], ['Bravo opt', 5]])

  await page.getByRole('button', { name: '‹' }).first().click()
  await expect(current(page)).toContainText('2 options')
  await page.getByRole('button', { name: /Bravo opt/ }).click()
  await expect(current(page)).toContainText('Get Ready')
  await expect(current(page)).toContainText('Alpha · option 2 of 2', { timeout: 7000 })

  await page.reload()
  await page.getByRole('button', { name: 'EVENING', exact: true }).click()
  await expect(primary(page)).toHaveCount(1)
  await expect(current(page)).toContainText('2 options')
  await expect(page.getByRole('button', { name: /Bravo opt/ })).toBeVisible()
})

test('a preset with choice cards imports through the JSON box', async ({ page }) => {
  await seed(page, start)
  await openEvening(page)
  await page.getByRole('button', { name: 'EDIT', exact: true }).click()
  await page.getByRole('button', { name: 'JSON' }).click()
  const preset = {
    name: 'Imported choice', sections: start.sections, tapToStart: true,
    exercises: [{ section: 'Floor', title: 'Hip opener', options: [
      { title: 'Lizard', duration: 60, bilateral: true, steps: ['lunge'] },
      { title: 'Hero', steps: ['kneel'] },
    ] }],
  }
  await page.getByPlaceholder(/Paste evening preset JSON/).fill(JSON.stringify(preset))
  await page.getByRole('button', { name: 'IMPORT PASTED' }).click()
  const all = await page.evaluate(() => JSON.parse(localStorage.getItem('alignedflow-evening-presets')).presets)
  const imported = all.find(p => p.name === 'Imported choice')
  expect(imported).toBeTruthy()
  expect(imported.tapToStart).toBe(true)
  expect(imported.exercises[0].duration).toBe(60)
  expect(imported.exercises[0].options).toHaveLength(2)
})

test('a broken option is refused with a readable message', async ({ page }) => {
  await seed(page, start)
  await openEvening(page)
  await page.getByRole('button', { name: 'EDIT', exact: true }).click()
  await page.getByRole('button', { name: 'JSON' }).click()
  const bad = { sections: start.sections, exercises: [{ section: 'Floor', title: 'Hip opener', duration: 60, options: [{ steps: [] }] }] }
  await page.getByPlaceholder(/Paste evening preset JSON/).fill(JSON.stringify(bad))
  await page.getByRole('button', { name: 'IMPORT PASTED' }).click()
  await expect(page.getByText('"Hip opener" option 1 has no title')).toBeVisible()
})
