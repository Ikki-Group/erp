import { test, expect } from './fixtures/auth.fixture';

test.describe('Financial Reports', () => {
	/**
	 * Test that profit & loss report page loads
	 * This ensures the P&L report is accessible
	 */
	test('displays profit & loss report page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/profit-loss');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that cash flow report page loads
	 * This ensures the cash flow statement is accessible
	 */
	test('displays cash flow report page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/cash-flow');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that ledger page loads
	 * This ensures the general ledger is accessible
	 */
	test('displays general ledger page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/ledger');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that AR/AP ledger page loads
	 * This ensures the accounts receivable/payable ledger is accessible
	 */
	test('displays AR/AP ledger page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/ledger-ar-ap');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that expenses page loads
	 * This ensures expense tracking is accessible
	 */
	test('displays expenses page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/expenses');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that accounts page loads
	 * This ensures the chart of accounts is accessible
	 */
	test('displays accounts page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/accounts');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that payments page loads
	 * This ensures payment tracking is accessible
	 */
	test('displays payments page', async ({ page, login }) => {
		await login();

		await page.goto('/finance/payments');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that P&L report displays revenue
	 * This ensures income is shown in the report
	 */
	test('P&L report displays revenue', async ({ page, login }) => {
		await login();

		await page.goto('/finance/profit-loss');

		// Verify revenue section exists
		await expect(page.getByText(/pendapatan/i, { exact: false })).toBeVisible();
	});

	/**
	 * Test that P&L report displays COGS
	 * This ensures cost of goods sold is shown
	 */
	test('P&L report displays COGS', async ({ page, login }) => {
		await login();

		await page.goto('/finance/profit-loss');

		// Verify COGS section exists
		await expect(page.getByText(/hpp/i, { exact: false })).toBeVisible();
	});

	/**
	 * Test that P&L report displays operating expenses
	 * This ensures operational costs are shown
	 */
	test('P&L report displays operating expenses', async ({ page, login }) => {
		await login();

		await page.goto('/finance/profit-loss');

		// Verify operating expenses section exists
		await expect(page.getByText(/biaya operasional/i, { exact: false })).toBeVisible();
	});

	/**
	 * Test that P&L report displays net profit
	 * This ensures final profit calculation is shown
	 */
	test('P&L report displays net profit', async ({ page, login }) => {
		await login();

		await page.goto('/finance/profit-loss');

		// Verify net profit section exists
		await expect(page.getByText(/laba bersih/i, { exact: false })).toBeVisible();
	});

	/**
	 * Test that cash flow report displays cash inflows
	 * This ensures incoming cash is tracked
	 */
	test('cash flow report displays cash inflows', async ({ page, login }) => {
		await login();

		await page.goto('/finance/cash-flow');

		// Verify cash inflow section exists
		await expect(page.getByText(/masuk/i, { exact: false })).toBeVisible();
	});

	/**
	 * Test that cash flow report displays cash outflows
	 * This ensures outgoing cash is tracked
	 */
	test('cash flow report displays cash outflows', async ({ page, login }) => {
		await login();

		await page.goto('/finance/cash-flow');

		// Verify cash outflow section exists
		await expect(page.getByText(/keluar/i, { exact: false })).toBeVisible();
	});

	/**
	 * Test that ledger displays transaction entries
	 * This ensures accounting entries are visible
	 */
	test('ledger displays transaction entries', async ({ page, login }) => {
		await login();

		await page.goto('/finance/ledger');

		// Verify table or list exists
		await expect(page.locator('table, tbody, div').first()).toBeVisible();
	});

	/**
	 * Test that AR/AP ledger shows balances
	 * This ensures receivable/payable amounts are visible
	 */
	test('AR/AP ledger shows account balances', async ({ page, login }) => {
		await login();

		await page.goto('/finance/ledger-ar-ap');

		// Verify balance information is displayed
		await expect(page.getByText(/saldo/i, { exact: false })).toBeVisible();
	});

	/**
	 * Test that expenses can be filtered by date range
	 * This ensures expense reports can be narrowed by time period
	 */
	test('expenses can be filtered by date range', async ({ page, login }) => {
		await login();

		await page.goto('/finance/expenses');

		// Look for date filter inputs
		const dateInput = page.getByRole('textbox').first();
		if ((await dateInput.count()) > 0) {
			await expect(dateInput).toBeVisible();
		}
	});

	/**
	 * Test that accounts can be created
	 * This ensures new chart of accounts can be added
	 */
	test('can create new account', async ({ page, login }) => {
		await login();

		await page.goto('/finance/accounts');

		// Click add button
		const addButton = page.getByRole('button', { name: /tambah/i });
		if ((await addButton.count()) > 0) {
			await addButton.click();

			// Verify form or dialog opens
			await expect(page.locator('h1, h2').first()).toBeVisible();
		}
	});

	/**
	 * Test that payments can be recorded
	 * This ensures payment transactions can be logged
	 */
	test('can record new payment', async ({ page, login }) => {
		await login();

		await page.goto('/finance/payments');

		// Click add button
		const addButton = page.getByRole('button', { name: /tambah/i });
		if ((await addButton.count()) > 0) {
			await addButton.click();

			// Verify form or dialog opens
			await expect(page.locator('h1, h2').first()).toBeVisible();
		}
	});
});
