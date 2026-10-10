import { test, expect } from './fixtures/auth.fixture'
import { TEST_CREDENTIALS } from './helpers/test-data'

test.describe('Login', () => {
	test('valid credentials land on the dashboard', async ({ page, login }) => {
		await login()
		await expect(page).toHaveURL('/')
		await expect(
			page.getByRole('heading', { level: 1, name: 'Selamat datang, Budi' }),
		).toBeVisible()
	})

	test('invalid credentials show an error and stay on login', async ({ page }) => {
		await page.goto('/login')
		await page.getByLabel('Nama pengguna').fill('nonexistent')
		await page.getByLabel('Kata sandi', { exact: true }).fill('wrongpassword')
		await page.getByRole('button', { name: 'Masuk ke ruang kerja' }).click()
		await expect(page.getByRole('alert')).toBeVisible()
		await expect(page.getByLabel('Nama pengguna')).toHaveAttribute('aria-invalid', 'true')
		await expect(page).toHaveURL(/\/login/u)
	})

	test('password visibility can be toggled', async ({ page }) => {
		await page.goto('/login')
		const password = page.getByLabel('Kata sandi', { exact: true })
		await expect(password).toHaveAttribute('type', 'password')
		await page.getByRole('button', { name: 'Tampilkan kata sandi' }).click()
		await expect(password).toHaveAttribute('type', 'text')
	})

	test('an authenticated user visiting /login is bounced to the dashboard', async ({
		page,
		login,
	}) => {
		await login()
		await page.goto('/login')
		await expect(page).toHaveURL('/')
	})

	test('logout returns to login and protects the app again', async ({ page, login }) => {
		await login(TEST_CREDENTIALS.cashier.username, TEST_CREDENTIALS.cashier.password)
		await page.getByRole('button', { name: 'Open user menu for Andi Pratama' }).click()
		await page.getByRole('menuitem', { name: 'Logout' }).click()
		await expect(page).toHaveURL(/\/login/u)
		await page.goto('/')
		await expect(page).toHaveURL(/\/login/u)
	})
})
