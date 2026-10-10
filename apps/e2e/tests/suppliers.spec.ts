import { test, expect } from './fixtures/auth.fixture'
import { uid } from './helpers/test-data'
import { expectToast, searchList } from './helpers/ui'

test.describe('Suppliers', () => {
	test('create → detail → edit → save', async ({ page, login }) => {
		const code = `SUP-${uid()}`
		const name = `E2E Supplier ${code}`
		await login()
		await page.goto('/master/suppliers')
		await page.getByRole('button', { name: 'Add Supplier' }).click()
		await expect(page).toHaveURL(/\/master\/suppliers\/new$/u)
		await page.getByRole('textbox', { name: 'Code' }).fill(code)
		await page.getByRole('textbox', { name: 'Name' }).fill(name)
		await page.getByRole('textbox', { name: 'Contact Person' }).fill('Rudi')
		await page.getByRole('textbox', { name: 'Phone' }).fill('0812-0000-0000')
		await page.getByRole('button', { name: 'Create' }).click()
		await expectToast(page, /created/iu)

		await page.goto('/master/suppliers')
		await searchList(page, 'Search suppliers...', code)
		await page.getByRole('button', { name: new RegExp(`^${code} `, 'u') }).click()
		await expect(page).toHaveURL(/\/master\/suppliers\/\d+$/u)
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
		await expect(page.getByText('Rudi', { exact: true })).toBeVisible()

		await page.getByRole('button', { name: 'Edit', exact: true }).click()
		await expect(page).toHaveURL(/\/master\/suppliers\/\d+\/edit$/u)
		await page.getByRole('textbox', { name: 'Contact Person' }).fill('Rudi Hartono')
		await page.getByRole('button', { name: 'Save Changes' }).click()
		await expectToast(page, /updated/iu)
		await expect(page).toHaveURL(/\/master\/suppliers\/\d+$/u)
		await expect(page.getByText('Rudi Hartono', { exact: true })).toBeVisible()
	})
})
