import { test, expect } from './fixtures/auth.fixture'

test.describe('Auth Guards', () => {
	/** Visiting a protected page without auth should redirect to /login */
	test('redirects unauthenticated user to login', async ({ page }) => {
		await page.goto('/')

		await expect(page).toHaveURL(/\/login/)
	})

	/** Visiting nested protected routes without auth should redirect */
	test('redirects from settings/access-control to login when not authenticated', async ({
		page,
	}) => {
		await page.goto('/settings/access-control')

		await expect(page).toHaveURL(/\/login/)
	})

	/** Visiting settings routes without auth should redirect */
	test('redirects from settings/locations to login when not authenticated', async ({ page }) => {
		await page.goto('/settings/locations')

		await expect(page).toHaveURL(/\/login/)
	})

	/** Authenticated user should access protected routes */
	test('allows authenticated user to access protected routes', async ({ page, login }) => {
		await login()

		await page.goto('/settings/access-control')

		await expect(page).not.toHaveURL(/\/login/)
	})

	/** Non-existent routes under authenticated layout show 404 */
	test('shows not-found for invalid authenticated routes', async ({ page, login }) => {
		await login()

		await page.goto('/this-does-not-exist')

		await expect(page.getByText(/tidak ditemukan|not found/i)).toBeVisible()
	})
})
