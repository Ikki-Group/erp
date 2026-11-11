import { test, expect } from './fixtures/auth.fixture'

test.describe('Users - CRUD', () => {
	/** Page loads and shows header */
	test('displays users page with header', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
	})

	/** Add User button is visible for authorized users */
	test('shows Add User button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		await expect(page.getByRole('button', { name: /add user/i })).toBeVisible()
	})

	/** Opening the full-page create form */
	test('opens create form when clicking Add User', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		await page.getByRole('button', { name: /add user/i }).click()

		await expect(page).toHaveURL(/\/settings\/users\/new$/)
		await expect(page.getByRole('heading', { name: 'Add User' })).toBeVisible()
	})

	/** Create a new user end-to-end */
	test('can create a new user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		await page.getByRole('button', { name: /add user/i }).click()

		// Fill required fields
		await page.getByLabel('Username').fill('e2e-user')
		await page.getByLabel('Name').fill('E2E Test User')
		await page.getByLabel('Password').fill('testpass123')

		// Submit
		await page.getByRole('button', { name: /create/i }).click()

		await expect(page.getByText(/created successfully|berhasil/i)).toBeVisible()
	})

	/** Search/filter users */
	test('can search users by name', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		const searchInput = page.getByPlaceholder(/search/i)
		await searchInput.fill('owner')

		await page.waitForLoadState('networkidle')
	})

	/** View user details */
	test('can view user details via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'View' }).click()

		await expect(page).toHaveURL(/\/settings\/users\/\d+$/)
		await expect(page.getByRole('heading', { name: 'User Details' })).toBeVisible()
		await expect(page.getByRole('button', { name: /edit user/i })).toBeVisible()
	})

	/** Edit an existing user */
	test('can edit a user via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		// Open action menu on first row
		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page).toHaveURL(/\/settings\/users\/\d+\?mode=edit$/)
		await expect(page.getByRole('heading', { name: 'Edit User' })).toBeVisible()

		// Modify display name
		const nameField = page.getByLabel('Full Name')
		await nameField.clear()
		await nameField.fill('Updated User Name')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/updated successfully|berhasil/i)).toBeVisible()
	})

	/** Reset a user's password via action menu */
	test('can reset a user password via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Reset Password' }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await page.getByLabel('New password').fill('newpassword123')
		await page.getByRole('button', { name: /reset password/i }).click()

		await expect(page.getByText(/reset successfully/i)).toBeVisible()
	})

	/** Deactivate a user via action menu */
	test('can deactivate a user via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users')

		// Open action menu on first row
		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: /deactivate/i }).click()

		// Confirm dialog
		await expect(page.getByRole('dialog')).toBeVisible()
		await page.getByRole('button', { name: /deactivate|confirm/i }).click()

		await expect(page.getByText(/deactivated|berhasil/i)).toBeVisible()
	})
})
