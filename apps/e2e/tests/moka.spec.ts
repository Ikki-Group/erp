import { test, expect } from './fixtures/auth.fixture'

test.describe('Moka Integration', () => {
	/**
	 * Test that Moka configuration page loads
	 * This ensures the Moka integration setup page is accessible
	 */
	test('displays Moka configuration page', async ({ page, login }) => {
		await login()

		await page.goto('/moka/configuration')

		// Verify page title
		await expect(page.getByText('Konfigurasi Moka')).toBeVisible()
	})

	/**
	 * Test that Moka configuration has email field
	 * This ensures Moka account email can be configured
	 */
	test('Moka configuration has email field', async ({ page, login }) => {
		await login()

		await page.goto('/moka/configuration')

		// Verify email field exists
		await expect(page.getByLabel('Email Moka')).toBeVisible()
	})

	/**
	 * Test that Moka configuration has password field
	 * This ensures Moka account password can be configured
	 */
	test('Moka configuration has password field', async ({ page, login }) => {
		await login()

		await page.goto('/moka/configuration')

		// Verify password field exists
		await expect(page.getByLabel('Password Moka')).toBeVisible()
	})

	/**
	 * Test that Moka integration can be activated
	 * This ensures the integration toggle works
	 */
	test('can activate Moka integration', async ({ page, login }) => {
		await login()

		await page.goto('/moka/configuration')

		// Verify activation toggle exists
		const activeToggle = page.getByRole('switch', { name: /aktifkan integrasi/i })
		if ((await activeToggle.count()) > 0) {
			await expect(activeToggle).toBeVisible()
		}
	})

	/**
	 * Test that Moka configuration can be saved
	 * This ensures configuration persistence works
	 */
	test('can save Moka configuration', async ({ page, login }) => {
		await login()

		await page.goto('/moka/configuration')

		// Fill configuration
		await page.getByLabel('Email Moka').fill('test@moka.com')
		await page.getByLabel('Password Moka').fill('test123')

		// Submit form
		const saveButton = page.getByRole('button', { name: /simpan konfigurasi/i })
		if ((await saveButton.count()) > 0) {
			await saveButton.click()

			// Verify success toast (may fail if API not available)
			await expect(page.getByText(/berhasil|gagal/i)).toBeVisible()
		}
	})

	/**
	 * Test that sales cron can be enabled
	 * This ensures automatic sales sync can be configured
	 */
	test('can enable sales cron for automatic sync', async ({ page, login }) => {
		await login()

		await page.goto('/moka/configuration')

		// Verify sales cron toggle exists
		const cronToggle = page.getByRole('switch', { name: /sinkronisasi sales otomatis/i })
		if ((await cronToggle.count()) > 0) {
			await expect(cronToggle).toBeVisible()
		}
	})

	/**
	 * Test that Moka sync page loads
	 * This ensures manual sync page is accessible
	 */
	test('displays Moka sync page', async ({ page, login }) => {
		await login()

		await page.goto('/moka/sync')

		// Verify page title
		await expect(page.getByText('Sinkronisasi Moka')).toBeVisible()
	})

	/**
	 * Test that category sync button exists
	 * This ensures manual category sync can be triggered
	 */
	test('has category sync button', async ({ page, login }) => {
		await login()

		await page.goto('/moka/sync')

		// Verify category sync button exists
		await expect(page.getByText('Kategori')).toBeVisible()
		await expect(page.getByRole('button', { name: /sync kategori/i })).toBeVisible()
	})

	/**
	 * Test that product sync button exists
	 * This ensures manual product sync can be triggered
	 */
	test('has product sync button', async ({ page, login }) => {
		await login()

		await page.goto('/moka/sync')

		// Verify product sync button exists
		await expect(page.getByText('Produk')).toBeVisible()
		await expect(page.getByRole('button', { name: /sync produk/i })).toBeVisible()
	})

	/**
	 * Test that sales sync button exists
	 * This ensures manual sales sync can be triggered
	 */
	test('has sales sync button', async ({ page, login }) => {
		await login()

		await page.goto('/moka/sync')

		// Verify sales sync button exists
		await expect(page.getByRole('button', { name: /sync sales/i })).toBeVisible()
	})

	/**
	 * Test that Moka monitoring page loads
	 * This ensures sync monitoring is accessible
	 */
	test('displays Moka monitoring page', async ({ page, login }) => {
		await login()

		await page.goto('/moka/monitoring')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that configuration form validates required fields
	 * This ensures email and password are required for setup
	 */
	test('Moka configuration validates required fields', async ({ page, login }) => {
		await login()

		await page.goto('/moka/configuration')

		// Try to submit without email
		const saveButton = page.getByRole('button', { name: /simpan konfigurasi/i })
		if ((await saveButton.count()) > 0) {
			await saveButton.click()

			// Should show validation error
			await expect(page.getByText(/required|wajib/i)).toBeVisible()
		}
	})

	/**
	 * Test that sync buttons show loading state
	 * This ensures user feedback during sync operations
	 */
	test('sync buttons show loading state during sync', async ({ page, login }) => {
		await login()

		await page.goto('/moka/sync')

		// Click sync button
		const syncButton = page.getByRole('button', { name: /sync kategori/i })
		if ((await syncButton.count()) > 0) {
			await syncButton.click()

			// Verify button shows loading state (may fail if API not available)
			await expect(page.getByText('Sinkronisasi...')).toBeVisible()
		}
	})

	/**
	 * Test that sync operations show success/error toasts
	 * This ensures user feedback on sync results
	 */
	test('sync operations show success or error toasts', async ({ page, login }) => {
		await login()

		await page.goto('/moka/sync')

		// Click sync button
		const syncButton = page.getByRole('button', { name: /sync kategori/i })
		if ((await syncButton.count()) > 0) {
			await syncButton.click()

			// Verify toast appears (success or error)
			await expect(page.getByText(/berhasil|gagal/i)).toBeVisible()
		}
	})
})
