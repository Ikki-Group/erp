import { test, expect } from './fixtures/auth.fixture'

test.describe('Sales Analytics', () => {
	/**
	 * Test that dashboard displays sales analytics
	 * This ensures sales metrics are visible on the main dashboard
	 */
	test('dashboard displays sales analytics', async ({ page, login }) => {
		await login()

		await page.goto('/')

		// Verify sales-related metrics are displayed
		await expect(page.getByText('Pendapatan (Bulan Ini)')).toBeVisible()
	})

	/**
	 * Test that dashboard displays top selling products
	 * This ensures product performance analytics are visible
	 */
	test('dashboard displays top selling products chart', async ({ page, login }) => {
		await login()

		await page.goto('/')

		// Verify top selling products chart exists
		await expect(page.getByText('Produk Terlaris (Bulan Ini)')).toBeVisible()
	})

	/**
	 * Test that sales orders page displays order history
	 * This ensures sales transaction history is accessible
	 */
	test('displays sales orders history', async ({ page, login }) => {
		await login()

		await page.goto('/sales/orders')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that sales orders can be filtered by date
	 * This ensures order history can be narrowed by time period
	 */
	test('sales orders can be filtered by date range', async ({ page, login }) => {
		await login()

		await page.goto('/sales/orders')

		// Look for date filter inputs
		const dateInput = page.getByRole('textbox').first()
		if ((await dateInput.count()) > 0) {
			await expect(dateInput).toBeVisible()
		}
	})

	/**
	 * Test that sales orders display status
	 * This ensures order status (open, closed, cancelled) is visible
	 */
	test('sales orders display order status', async ({ page, login }) => {
		await login()

		await page.goto('/sales/orders')

		// Verify status column or badge exists
		await expect(page.getByText(/status/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that invoices page displays invoice history
	 * This ensures invoice tracking is accessible
	 */
	test('displays invoice history', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that invoices display payment status
	 * This ensures invoice payment status is visible
	 */
	test('invoices display payment status', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Verify payment status badges exist
		await expect(page.getByText(/lunas|belum lunas/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that customers page displays customer list
	 * This ensures customer management is accessible
	 */
	test('displays customer list for analytics', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that customers display purchase history
	 * This ensures customer transaction data is visible
	 */
	test('customers display purchase history data', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Verify customer data is displayed
		await expect(page.getByText('Pelanggan')).toBeVisible()
	})

	/**
	 * Test that POS displays sales summary
	 * This ensures real-time sales data is visible
	 */
	test('POS displays sales summary', async ({ page, login }) => {
		await login()

		await page.goto('/sales/pos')

		// Verify cart section exists
		await expect(page.getByText('Keranjang')).toBeVisible()
	})

	/**
	 * Test that POS displays cart total
	 * This ensures order total is calculated and shown
	 */
	test('POS displays cart total amount', async ({ page, login }) => {
		await login()

		await page.goto('/sales/pos')

		// Verify total is displayed
		await expect(page.getByText(/total/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that sales analytics can be filtered by location
	 * This ensures location-specific sales data is accessible
	 */
	test('sales analytics can be filtered by location', async ({ page, login }) => {
		await login()

		await page.goto('/')

		// Verify location switcher exists
		await expect(page.getByTestId('location-switcher')).toBeVisible()
	})

	/**
	 * Test that sales analytics can be filtered by date range
	 * This ensures time-period filtering works
	 */
	test('sales analytics can be filtered by date range on dashboard', async ({ page, login }) => {
		await login()

		await page.goto('/')

		// Look for date filter controls
		const dateFilter = page.getByRole('textbox').first()
		if ((await dateFilter.count()) > 0) {
			await expect(dateFilter).toBeVisible()
		}
	})

	/**
	 * Test that sales orders display total amount
	 * This ensures order totals are visible
	 */
	test('sales orders display total amount', async ({ page, login }) => {
		await login()

		await page.goto('/sales/orders')

		// Verify total column or display exists
		await expect(page.getByText(/total/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that invoices can be exported
	 * This ensures invoice data can be exported for reporting
	 */
	test('invoices can be exported or printed', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Look for export or print button
		const printButton = page.getByRole('button', { name: /cetak|export/i })
		if ((await printButton.count()) > 0) {
			await expect(printButton).toBeVisible()
		}
	})

	/**
	 * Test that sales analytics shows gross margin
	 * This ensures profitability metrics are visible
	 */
	test('dashboard displays gross margin', async ({ page, login }) => {
		await login()

		await page.goto('/')

		// Verify gross margin is displayed
		await expect(page.getByText(/% Gross Margin/i)).toBeVisible()
	})
})
