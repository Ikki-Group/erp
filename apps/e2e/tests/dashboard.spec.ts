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

		// Sidebar renders its grouped nav links (no <nav> landmark in the shell)
		await expect(page.getByRole('link', { name: 'Dasbor' })).toBeVisible()
		await expect(page.getByRole('link', { name: 'Stok', exact: true })).toBeVisible()
	})

	/** User can navigate from sidebar */
	test('can navigate to access control from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: 'Kontrol Akses' }).click()

		await expect(page).toHaveURL(/\/settings\/access-control/)
	})
})
