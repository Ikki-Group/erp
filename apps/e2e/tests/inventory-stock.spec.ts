import { test, expect } from './fixtures/auth.fixture'

test.describe('Inventory Stock - Page Load', () => {
	/** Stock page loads and shows header */
	test('displays stock page with header', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/stock')

		await expect(page.getByRole('heading', { name: /stok inventori/i })).toBeVisible()
	})

	/** Shows location name in description when location is active */
	test('shows active location name in description', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/stock')

		await expect(page.getByText(/saldo stok di/i)).toBeVisible()
	})

	/** Tab navigation is visible */
	test('shows tab navigation with Saldo Stok and Riwayat', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/stock')

		await expect(page.getByRole('tab', { name: /saldo stok/i })).toBeVisible()
		await expect(page.getByRole('tab', { name: /riwayat pergerakan/i })).toBeVisible()
	})
})

test.describe('Inventory Stock - Balance Tab', () => {
	/** Saldo Stok tab is active by default */
	test('defaults to Saldo Stok tab', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/stock')

		const tab = page.getByRole('tab', { name: /saldo stok/i })
		await expect(tab).toHaveAttribute('aria-selected', 'true')
	})

	/** Shows empty state or table depending on data */
	test('shows stock data or empty state', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/stock')

		// Either we see the table or an empty state
		const hasTable = page.locator('table')
		const hasEmpty = page.getByText(/belum ada data stok/i)

		await expect(hasTable.or(hasEmpty)).toBeVisible()
	})
})

test.describe('Inventory Stock - Movement Tab', () => {
	/** Switching to Riwayat tab shows material selection prompt */
	test('shows material selection prompt on Riwayat tab', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/stock')

		await page.getByRole('tab', { name: /riwayat pergerakan/i }).click()

		await expect(page.getByText(/pilih material/i)).toBeVisible()
	})
})

test.describe('Inventory Stock - Navigation', () => {
	/** Stock link is accessible from sidebar */
	test('can navigate to stock page from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: /stock/i }).click()

		await expect(page).toHaveURL(/\/inventory\/stock/)
	})
})
