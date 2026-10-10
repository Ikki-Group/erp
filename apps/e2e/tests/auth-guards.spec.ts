import { test, expect } from './fixtures/auth.fixture'
import { TEST_CREDENTIALS } from './helpers/test-data'

test.describe('Auth guards', () => {
	test('unauthenticated deep link redirects to login, then back after sign-in', async ({
		page,
	}) => {
		await page.goto('/settings/locations')
		await expect(page).toHaveURL(/\/login\?redirect=/u)

		await page.getByLabel('Nama pengguna').fill(TEST_CREDENTIALS.owner.username)
		await page.getByLabel('Kata sandi', { exact: true }).fill(TEST_CREDENTIALS.owner.password)
		await page.getByRole('button', { name: 'Masuk ke ruang kerja' }).click()

		await expect(page).toHaveURL(/\/settings\/locations/u)
		await expect(page.getByRole('heading', { level: 1, name: 'Locations' })).toBeVisible()
	})

	test('unknown authenticated route shows the 404 page', async ({ page, login }) => {
		await login()
		await page.goto('/this-does-not-exist')
		await expect(page.getByText('Page not found')).toBeVisible()
		await page.getByRole('link', { name: 'Back to Home' }).click()
		await expect(page).toHaveURL('/')
	})
})
