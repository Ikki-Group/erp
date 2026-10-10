import type { Page } from '@playwright/test'
import { test, expect } from './fixtures/auth.fixture'
import { uid } from './helpers/test-data'
import { expectToast, pickOption, searchList } from './helpers/ui'

async function createMaterial(page: Page, code: string, name: string) {
	await page.goto('/master/materials')
	await page.getByRole('button', { name: 'Add Material' }).click()
	await expect(page).toHaveURL(/\/master\/materials\/new$/u)
	await page.getByRole('textbox', { name: 'Code' }).fill(code)
	await page.getByRole('textbox', { name: 'Name' }).fill(name)
	await pickOption(page, 'Base unit', /Kilogram/u)
	await page.getByRole('button', { name: 'Create' }).click()
	await expectToast(page, 'Material created successfully.')
	await expect(page).toHaveURL(/\/master\/materials\?/u)
}

/** Search the list and open the row's read view. */
async function openMaterial(page: Page, code: string) {
	await searchList(page, 'Search materials...', code)
	await page.getByRole('button', { name: new RegExp(`^${code} `, 'u') }).click()
	await expect(page).toHaveURL(/\/master\/materials\/\d+$/u)
}

test.describe('Materials', () => {
	test('list → detail read view → edit → save', async ({ page, login }) => {
		const code = `MAT-${uid()}`
		const name = `E2E Material ${code}`
		await login()
		await createMaterial(page, code, name)

		await openMaterial(page, code)
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
		await expect(page.getByRole('definition').filter({ hasText: 'Kilogram (kg)' })).toBeVisible()

		await page.getByRole('button', { name: 'Edit', exact: true }).click()
		await expect(page).toHaveURL(/\/master\/materials\/\d+\/edit$/u)
		await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(name)
		await page.getByRole('textbox', { name: 'Name' }).fill(`${name} edited`)
		await page.getByRole('textbox', { name: 'Min Stock' }).fill('4')
		await page.getByRole('button', { name: 'Save Changes' }).click()

		await expectToast(page, 'Material updated successfully.')
		await expect(page).toHaveURL(/\/master\/materials\/\d+$/u)
		await expect(page.getByRole('heading', { level: 1, name: `${name} edited` })).toBeVisible()

		// Persisted, not just optimistic.
		await page.reload()
		await expect(page.getByRole('heading', { level: 1, name: `${name} edited` })).toBeVisible()
		await expect(page.getByRole('definition').filter({ hasText: /^4$/u })).toBeVisible()
	})

	test('deactivate from the detail page "More actions" menu', async ({ page, login }) => {
		const code = `MAT-${uid()}`
		await login()
		await createMaterial(page, code, `E2E Delete ${code}`)
		await openMaterial(page, code)

		await page.getByRole('button', { name: 'More actions' }).click()
		await page.getByRole('menuitem', { name: 'Deactivate material' }).click()
		const dialog = page.getByRole('dialog', { name: 'Deactivate material?' })
		await expect(dialog).toContainText(code)
		await dialog.getByRole('button', { name: 'Deactivate' }).click()

		await expectToast(page, 'Material deactivated.')
		await expect(page).toHaveURL(/\/master\/materials\?/u)
		// The server soft-deletes (deactivates): the row stays, marked Inactive.
		await searchList(page, 'Search materials...', code)
		await expect(page.getByRole('button', { name: new RegExp(`^${code} `, 'u') })).toContainText(
			'Inactive',
		)
	})

	test('add a category from the list page', async ({ page, login }) => {
		const name = `E2E Cat ${uid()}`
		await login()
		await page.goto('/master/materials')
		await page.getByRole('button', { name: 'Add Category' }).click()
		const dialog = page.getByRole('dialog', { name: 'Add Category' })
		await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeVisible()
		await dialog.getByRole('textbox', { name: 'Name' }).fill(name)
		await dialog.getByRole('button', { name: 'Create' }).click()
		await expect(dialog).toBeHidden()
		await expect(page.getByRole('button', { name: `Edit ${name}` })).toBeVisible()
	})
})
