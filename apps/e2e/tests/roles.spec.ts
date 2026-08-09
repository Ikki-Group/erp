import { test, expect } from './fixtures/auth.fixture'

test.describe('Roles - CRUD', () => {
	/** Page loads and shows header */
	test('displays roles page with header', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible()
		await expect(page.getByText('Manage roles and their permission sets')).toBeVisible()
	})

	/** Add Role button is visible for authorized users */
	test('shows Add Role button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		await expect(page.getByRole('button', { name: /add role/i })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Role', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		await page.getByRole('button', { name: /add role/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Role')).toBeVisible()
	})

	/** Create a new role end-to-end */
	test('can create a new role', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		await page.getByRole('button', { name: /add role/i }).click()

		// Fill required fields
		await page.getByLabel('Code').fill('e2e-role')
		await page.getByLabel('Name').fill('E2E Test Role')

		// Submit
		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/i)).toBeVisible()
	})

	/** Search/filter roles */
	test('can search roles by name', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		const searchInput = page.getByPlaceholder(/search roles/i)
		await searchInput.fill('owner')

		await page.waitForLoadState('networkidle')
	})

	/** Edit an existing role (non-system) */
	test('can edit a role via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		// Open action menu on a non-system role row
		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText('Edit Role')).toBeVisible()

		// Modify name
		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Role')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/updated successfully/i)).toBeVisible()
	})

	/** Delete a role via action menu */
	test('can delete a role via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		// Open action menu
		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		// Confirm dialog
		await expect(page.getByText(/delete role/i)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/deleted/i)).toBeVisible()
	})

	/** System roles should not show edit/delete actions */
	test('system roles do not show action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles')

		// System roles (e.g., Owner, Cashier) should exist in the table
		// but should NOT have action buttons
		const ownerRow = page.getByRole('row').filter({ hasText: /owner/i })
		await expect(ownerRow).toBeVisible()

		// System rows should not have an action trigger within them
		const actionsInRow = ownerRow.getByRole('button', { name: /actions/i })
		await expect(actionsInRow).toHaveCount(0)
	})
})
