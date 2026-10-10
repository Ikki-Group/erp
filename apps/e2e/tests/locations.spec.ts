import { test, expect } from './fixtures/auth.fixture'
import { uid } from './helpers/test-data'
import { expectToast, pickOption } from './helpers/ui'

test.describe('Locations', () => {
	test('create → detail → edit; the new location joins the picker', async ({ page, login }) => {
		const code = `LOC-${uid()}`
		const name = `E2E Gudang ${code}`
		await login()
		await page.goto('/settings/locations')
		await page.getByRole('button', { name: 'Add Location' }).click()
		await expect(page).toHaveURL(/\/settings\/locations\/new$/u)
		await page.getByRole('textbox', { name: 'Name' }).fill(name)
		await page.getByRole('textbox', { name: 'Code' }).fill(code)
		await pickOption(page, 'Type', /Warehouse/u)
		await page.getByRole('textbox', { name: 'Address' }).fill('Jl. Uji No. 1')
		await page.getByRole('button', { name: 'Create Location' }).click()
		await expectToast(page, /created/iu)

		await page.goto('/settings/locations')
		await page.getByRole('button', { name: new RegExp(`^${code} `, 'u') }).click()
		await expect(page).toHaveURL(/\/settings\/locations\/\d+(\?|$)/u)
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

		await page.getByRole('button', { name: 'Edit', exact: true }).click()
		await expect(page).toHaveURL(/\/settings\/locations\/\d+\/edit$/u)
		await page.getByRole('textbox', { name: 'Address' }).fill('Jl. Uji No. 2')
		await page.getByRole('button', { name: /save/iu }).click()
		await expectToast(page, /updated/iu)
		await expect(page.getByText('Jl. Uji No. 2')).toBeVisible()

		// Owner has company-wide access, so the new location is selectable.
		await page
			.getByRole('banner')
			.getByRole('button', { name: 'Semua Lokasi', exact: true })
			.click()
		await expect(page.getByRole('menuitem', { name })).toBeVisible()
	})
})
