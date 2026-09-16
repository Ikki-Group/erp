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

	/** Add Location navigates to the full-page create route */
	test('navigates to the create page when clicking Add Location', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		await page.getByRole('button', { name: /add location/i }).click()

		await expect(page).toHaveURL(/\/master\/locations\/new$/)
		await expect(page.getByRole('heading', { name: /add location/i })).toBeVisible()
	})

	/** Create a new location end-to-end via the full-page form */
	test('can create a new location', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations/new')

		await page.getByLabel('Code').fill('WH-E2E')
		await page.getByLabel('Name').fill('E2E Test Warehouse')
		await page.getByLabel('Type').selectOption('warehouse')

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/i)).toBeVisible()
	})

	/** Searching writes the term to the URL and survives a reload (URL-driven list state) */
	test('reflects search in the URL and restores it on reload', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		await page.getByPlaceholder(/search locations/i).fill('E2E')

		// The search term is pushed to the URL as ?q=…
		await expect(page).toHaveURL(/[?&]q=E2E/)

		// A reload restores the same filtered view from the URL (refresh-stable).
		await page.reload()
		await expect(page).toHaveURL(/[?&]q=E2E/)
		await expect(page.getByPlaceholder(/search locations/i)).toHaveValue('E2E')
	})

	/** A shared filtered URL reproduces the filtered view directly */
	test('opens a shared filtered URL directly', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations?q=E2E&page=1')

		await expect(page.getByPlaceholder(/search locations/i)).toHaveValue('E2E')
	})

	/** Edit navigates to the full-page edit route and saves */
	test('can edit a location via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()
		await page.getByRole('menuitem', { name: 'Edit' }).click()

		// Full-page edit route, not a dialog
		await expect(page).toHaveURL(/\/master\/locations\/\d+$/)
		await expect(page.getByRole('heading', { name: 'Edit Location' })).toBeVisible()

		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Location')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/updated successfully/i)).toBeVisible()
	})

	/** Delete a location via action menu (confirm dialog) */
	test('can delete a location via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/locations')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()
		await page.getByRole('menuitem', { name: 'Delete' }).click()

		await expect(page.getByText(/delete location/i)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/deleted successfully/i)).toBeVisible()
	})
})
