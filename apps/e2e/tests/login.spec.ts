import { test, expect } from './fixtures/auth.fixture'

test.describe('Login', () => {
	test('redirects unauthenticated user to login page', async ({ page }) => {
		await page.goto('/')
		await expect(page).toHaveURL(/\/login/)
	})

	test('shows login form with all required fields', async ({ page }) => {
		await page.goto('/login')

		await expect(page.getByLabel('Email')).toBeVisible()
		await expect(page.getByLabel('Password')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible()
	})

	test('validates empty form submission', async ({ page }) => {
		await page.goto('/login')

		await page.getByRole('button', { name: 'Masuk' }).click()

		// Should still be on login page (form validation prevents submission)
		await expect(page).toHaveURL(/\/login/)
	})

	test('logs in successfully with valid credentials', async ({ page, login }) => {
		await login()

		// Should be redirected away from login page
		await expect(page).not.toHaveURL(/\/login/)
	})

	test('shows error with invalid credentials', async ({ page }) => {
		await page.goto('/login')

		await page.getByLabel('Email').fill('wrong@email.com')
		await page.getByLabel('Password').fill('wrongpassword')
		await page.getByRole('button', { name: 'Masuk' }).click()

		// Should show error toast
		await expect(page.getByText('Login Gagal')).toBeVisible()
	})

	test('redirects authenticated user away from login page', async ({ page, login }) => {
		await login()

		// Navigate back to login
		await page.goto('/login')

		// Should be redirected away
		await expect(page).not.toHaveURL(/\/login/)
	})
})
