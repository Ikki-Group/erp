import { test, expect } from './fixtures/auth.fixture'

test.describe('Locations - CRUD', () => {
	/** Page loads and shows header */
	test('displays locations page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible()
		await expect(page.getByText('Manage stores and warehouses')).toBeVisible()
	})

	/** Add Location button is visible for authorized users */
	test('shows Add Location button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		await expect(page.getByRole('button', { name: /add location/i })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Location', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		await page.getByRole('button', { name: /add location/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Location')).toBeVisible()
	})

	/** Create a new location end-to-end */
	test('can create a new location', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		await page.getByRole('button', { name: /add location/i }).click()

		// Fill form fields
		await page.getByLabel('Code').fill('WH-E2E')
		await page.getByLabel('Name').fill('E2E Test Warehouse')
		await page.getByLabel('Type').selectOption('warehouse')

		// Submit
		await page.getByRole('button', { name: 'Create' }).click()

		// Verify success toast
		await expect(page.getByText(/created successfully/i)).toBeVisible()
	})

	/** Search/filter locations */
	test('can search locations by name', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		const searchInput = page.getByPlaceholder(/search locations/i)
		await searchInput.fill('E2E')

		// Table should filter results (wait for network response)
		await page.waitForLoadState('networkidle')
	})

	/** Edit an existing location */
	test('can edit a location via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		// Open action menu on first row
		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		// Dialog should open with "Edit Location" title
		await expect(page.getByText('Edit Location')).toBeVisible()

		// Modify name
		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Location')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/updated successfully/i)).toBeVisible()
	})

	/** Delete a location via action menu */
	test('can delete a location via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		// Open action menu on first row
		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		// Confirm dialog should appear
		await expect(page.getByText(/delete location/i)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/deleted successfully/i)).toBeVisible()
	})
})
