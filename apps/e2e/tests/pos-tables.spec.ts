import { test, expect } from './fixtures/auth.fixture'

test.describe('POS Tables - CRUD', () => {
	/** Page loads and shows header */
	test('displays tables page with header', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		await expect(page.getByRole('heading', { name: 'Tables' })).toBeVisible()
		await expect(page.getByText(/manage dine-in tables/i)).toBeVisible()
	})

	/** Add Table button is visible */
	test('shows Add Table button', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		await expect(page.getByRole('button', { name: /add table/i })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Table', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		await page.getByRole('button', { name: /add table/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Table')).toBeVisible()
	})

	/** Create a new table end-to-end */
	test('can create a new table', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		await page.getByRole('button', { name: /add table/i }).click()

		await page.getByLabel(/number/i).fill('T-E2E')
		await page.getByLabel(/capacity/i).clear()
		await page.getByLabel(/capacity/i).fill('6')

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/i)).toBeVisible()
	})

	/** Edit a table via action menu */
	test('can edit a table via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText('Edit Table')).toBeVisible()

		const numberField = page.getByLabel(/number/i)
		await numberField.clear()
		await numberField.fill('T-UPDATED')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/updated successfully/i)).toBeVisible()
	})

	/** Delete a table via action menu */
	test('can delete a table via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		await expect(page.getByText(/delete table/i)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/deleted successfully/i)).toBeVisible()
	})
})
