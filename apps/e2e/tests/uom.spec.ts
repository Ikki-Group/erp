import { test, expect } from './fixtures/auth.fixture'
import { uid } from './helpers/test-data'
import { expectToast, pickOption, searchList } from './helpers/ui'

test.describe('Units of measure', () => {
	test('create → detail → edit → delete', async ({ page, login }) => {
		const code = `u${uid()}`.toLowerCase()
		const name = `E2E Unit ${code}`
		await login()
		await page.goto('/master/uom')
		await page.getByRole('button', { name: 'Add Unit' }).click()
		await expect(page).toHaveURL(/\/master\/uom\/new$/u)
		await page.getByRole('textbox', { name: 'Code' }).fill(code)
		await pickOption(page, 'Category', /Weight/iu)
		await page.getByRole('textbox', { name: 'Name' }).fill(name)
		await page.getByRole('button', { name: 'Create' }).click()
		await expectToast(page, /created/iu)

		await page.goto('/master/uom')
		await searchList(page, 'Search units...', code)
		await page.getByRole('button', { name: new RegExp(`^${code} `, 'u') }).click()
		await expect(page).toHaveURL(/\/master\/uom\/\d+$/u)
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

		await page.getByRole('button', { name: 'Edit', exact: true }).click()
		await page.getByRole('textbox', { name: 'Name' }).fill(`${name} edited`)
		await page.getByRole('button', { name: 'Save Changes' }).click()
		await expectToast(page, /updated/iu)
		await expect(page.getByRole('heading', { level: 1, name: `${name} edited` })).toBeVisible()

		await page.getByRole('button', { name: 'More actions' }).click()
		await page.getByRole('menuitem', { name: /delete/iu }).click()
		await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
		await expectToast(page, /deleted/iu)
		await expect(page).toHaveURL(/\/master\/uom\?/u)
	})
})
