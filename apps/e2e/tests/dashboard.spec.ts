import { test, expect } from './fixtures/auth.fixture'

test.describe('Dashboard', () => {
	/** Dashboard loads for authenticated user */
	test('displays dashboard page after login', async ({ page, login }) => {
		await login()

		await expect(page).toHaveURL('/')
		// Dashboard should render within the AppShell layout
		await expect(page.locator('body')).toBeVisible()
	})

	/** Dashboard shows navigation sidebar */
	test('shows navigation sidebar', async ({ page, login }) => {
		await login()

		// Verify sidebar contains navigation links
		await expect(page.getByRole('navigation')).toBeVisible()
	})

	/** User can navigate to settings from sidebar */
	test('can navigate to settings/users from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: /user/i }).click()

		await expect(page).toHaveURL(/\/settings\/users/)
	})
})
