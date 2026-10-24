import { test, expect } from './fixtures/auth.fixture'

import { TEST_CREDENTIALS } from './helpers/test-data'

test.describe('Login', () => {
	/** Unauthenticated users should see the login form */
	test('displays login form with username and password fields', async ({ page }) => {
		await page.goto('/login')

		await expect(page.getByLabel('Username')).toBeVisible()
		await expect(page.getByLabel('Password')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible()
	})

	/** Valid credentials should redirect to dashboard */
	test('logs in successfully with valid credentials', async ({ page, login }) => {
		await login()

		await expect(page).not.toHaveURL(/\/login/)
		await expect(page).toHaveURL('/')
	})

	/** Invalid credentials should show an error message */
	test('shows error with invalid credentials', async ({ page }) => {
		await page.goto('/login')

		await page.getByLabel('Username').fill('nonexistent')
		await page.getByLabel('Password').fill('wrongpassword')
		await page.getByRole('button', { name: 'Masuk' }).click()

		// Should show a destructive alert with error text
		await expect(page.getByRole('alert')).toBeVisible()
		await expect(page).toHaveURL(/\/login/)
	})

	/** Empty form should not submit (HTML required attribute) */
	test('prevents submission with empty fields', async ({ page }) => {
		await page.goto('/login')

		await page.getByRole('button', { name: 'Masuk' }).click()

		// Should remain on login page
		await expect(page).toHaveURL(/\/login/)
	})

	/** Already-authenticated user visiting /login should be redirected */
	test('redirects authenticated user away from login page', async ({ page, login }) => {
		await login()

		// Try navigating back to login
		await page.goto('/login')

		await expect(page).not.toHaveURL(/\/login/)
	})

	/** Login as cashier role to verify non-owner login */
	test('logs in successfully as cashier', async ({ page, login }) => {
		await login(TEST_CREDENTIALS.cashier.username, TEST_CREDENTIALS.cashier.password)

		await expect(page).not.toHaveURL(/\/login/)
	})
})
