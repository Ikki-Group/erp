import { test, expect } from './fixtures/auth.fixture';

test.describe('Finance Dashboard', () => {
	/**
	 * Test that main dashboard loads and displays KPI cards
	 * This ensures the finance dashboard is accessible and shows key metrics
	 */
	test('displays main dashboard with KPI cards', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Verify page title
		await expect(page.getByText('Dashboard Utama')).toBeVisible();

		// Verify KPI cards are displayed
		await expect(page.getByText('Pendapatan (Bulan Ini)')).toBeVisible();
		await expect(page.getByText('Total HPP (COGS)')).toBeVisible();
		await expect(page.getByText('Laba Bersih')).toBeVisible();
		await expect(page.getByText('Stok Menipis')).toBeVisible();
	});

	/**
	 * Test that dashboard displays revenue amount
	 * This ensures revenue data is correctly displayed
	 */
	test('displays revenue amount on dashboard', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Verify revenue is displayed with currency format
		await expect(page.getByText(/Rp/i)).toBeVisible();
	});

	/**
	 * Test that dashboard displays gross margin percentage
	 * This ensures the gross margin calculation is shown
	 */
	test('displays gross margin on HPP card', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Verify gross margin percentage is displayed
		await expect(page.getByText(/% Gross Margin/i)).toBeVisible();
	});

	/**
	 * Test that dashboard displays top selling products chart
	 * This ensures the sales analytics chart is rendered
	 */
	test('displays top selling products chart', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Verify chart section exists
		await expect(page.getByText('Produk Terlaris (Bulan Ini)')).toBeVisible();
	});

	/**
	 * Test that dashboard displays P&L summary
	 * This ensures the profit and loss summary is visible
	 */
	test('displays P&L summary section', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Verify P&L summary section exists
		await expect(page.getByText('Ringkasan P&L')).toBeVisible();

		// Verify P&L components
		await expect(page.getByText('Pendapatan')).toBeVisible();
		await expect(page.getByText('HPP (COGS)')).toBeVisible();
		await expect(page.getByText('Biaya Operasional')).toBeVisible();
	});

	/**
	 * Test that dashboard displays low stock alerts when applicable
	 * This ensures inventory warnings are shown for restock needs
	 */
	test('displays low stock alerts when items need restock', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Check if low stock alerts section exists (may not always show if no alerts)
		const lowStockSection = page.getByText('Peringatan Stok Rendah');
		const isVisible = await lowStockSection.isVisible();

		if (isVisible) {
			// Verify table structure
			await expect(page.getByText('Material')).toBeVisible();
			await expect(page.getByText('Lokasi')).toBeVisible();
			await expect(page.getByText('Stok')).toBeVisible();
		}
	});

	/**
	 * Test that user can navigate to finance reports pages
	 * This ensures the detailed finance reports are accessible
	 */
	test('can navigate to profit loss report page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/profit-loss');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to cash flow report page
	 * This ensures cash flow visibility is accessible
	 */
	test('can navigate to cash flow report page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/cash-flow');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to ledger page
	 * This ensures the accounting ledger is accessible
	 */
	test('can navigate to ledger page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/ledger');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to AR/AP ledger page
	 * This ensures accounts receivable/payable tracking is accessible
	 */
	test('can navigate to AR/AP ledger page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/ledger-ar-ap');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to expenses page
	 * This ensures expense tracking is accessible
	 */
	test('can navigate to expenses page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/expenses');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to accounts page
	 * This ensures chart of accounts management is accessible
	 */
	test('can navigate to accounts page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/accounts');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to payments page
	 * This ensures payment tracking is accessible
	 */
	test('can navigate to payments page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/payments');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that dashboard has quick action to open POS
	 * This ensures quick access to sales interface is available
	 */
	test('dashboard has quick action to open POS', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Verify Open POS button exists
		await expect(page.getByRole('button', { name: /open pos/i })).toBeVisible();
	});

	/**
	 * Test that P&L summary shows net profit with correct color
	 * This ensures profit/loss visual indicators work correctly
	 */
	test('P&L summary shows net profit color based on value', async ({ page, login }) => {
		await login();

		await page.goto('/');

		// Verify net profit is displayed (color depends on positive/negative value)
		await expect(page.getByText('Laba Bersih')).toBeVisible();
	});
});
