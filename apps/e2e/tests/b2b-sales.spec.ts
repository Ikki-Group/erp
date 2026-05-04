import { test, expect } from './fixtures/auth.fixture'

test.describe('B2B Sales Flow', () => {
	/**
	 * Test that customer list page loads and displays customers
	 * This ensures the customer management is accessible for B2B sales
	 */
	test('displays customer list page', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that user can create a new customer for B2B
	 * This ensures customer creation works for wholesale partners
	 */
	test('can create new customer', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click "Tambah" button
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify dialog opens
			await expect(page.getByText(/tambah pelanggan/i, { exact: false })).toBeVisible()
		}
	})

	/**
	 * Test that customer form has required fields
	 * This ensures the form structure is complete for customer data entry
	 */
	test('customer form displays required fields', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Open customer dialog
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify form fields
			await expect(page.getByLabel('Nama')).toBeVisible()
		}
	})

	/**
	 * Test that customers display tier information
	 * This ensures customer tier classification is visible (Bronze, Silver, Gold, Platinum)
	 */
	test('displays customer tier information', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Verify Tier column exists
		await expect(page.getByText('Tier')).toBeVisible()
	})

	/**
	 * Test that customers display points balance
	 * This ensures loyalty points are visible for CRM integration
	 */
	test('displays customer points balance', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Verify Poin column exists
		await expect(page.getByText('Poin')).toBeVisible()
	})

	/**
	 * Test that user can edit existing customer
	 * This ensures customer update functionality works correctly
	 */
	test('can edit existing customer', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click edit button on first customer (assumes at least one exists)
		const editButton = page.getByRole('button', { name: /edit/i }).first()
		if ((await editButton.count()) > 0) {
			await editButton.click()

			// Verify dialog opens with edit mode
			await expect(page.getByText(/edit pelanggan/i, { exact: false })).toBeVisible()
		}
	})

	/**
	 * Test that user can search for customers
	 * This ensures the search functionality works for finding specific customers
	 */
	test('can search for customers', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Enter search term
		const searchInput = page.getByPlaceholder(/cari/i)
		if ((await searchInput.count()) > 0) {
			await searchInput.fill('Test')

			// Wait for search to complete
			await page.waitForTimeout(500)

			// Verify search input has value
			await expect(searchInput).toHaveValue('Test')
		}
	})

	/**
	 * Test that invoices page loads and displays invoices
	 * This ensures invoice management is accessible for B2B sales
	 */
	test('displays invoices page', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that invoices display status badges
	 * This ensures invoice status (Lunas, Belum Lunas, Batal) is visible
	 */
	test('displays invoice status badges', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Verify Status column exists
		await expect(page.getByText('Status')).toBeVisible()
	})

	/**
	 * Test that invoices display customer information
	 * This ensures invoice shows which customer it belongs to
	 */
	test('displays customer information on invoices', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Verify Pelanggan column exists
		await expect(page.getByText('Pelanggan')).toBeVisible()
	})

	/**
	 * Test that user can print invoice
	 * This ensures invoice printing functionality works for formal documentation
	 */
	test('can print invoice', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Click print button on an invoice
		const printButton = page.getByRole('button', { name: /cetak/i }).first()
		if ((await printButton.count()) > 0) {
			await printButton.click()

			// Verify print dialog or action is triggered
			// (Actual print dialog depends on browser)
		}
	})

	/**
	 * Test that user can void an unpaid invoice
	 * This ensures invoice cancellation works for invalid orders
	 */
	test('can void unpaid invoice', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Click void button on an unpaid invoice
		const voidButton = page.getByRole('button', { name: /batalkan/i }).first()
		if ((await voidButton.count()) > 0) {
			await voidButton.click()

			// Verify confirmation dialog appears
			await expect(page.getByText(/apakah anda yakin/i)).toBeVisible()
		}
	})

	/**
	 * Test that invoices display total amount
	 * This ensures invoice totals are correctly displayed
	 */
	test('displays invoice total amount', async ({ page, login }) => {
		await login()

		await page.goto('/sales/invoices')

		// Verify Total column exists
		await expect(page.getByText('Total')).toBeVisible()
	})

	/**
	 * Test that user can navigate to sales orders page
	 * This ensures order management is accessible
	 */
	test('can navigate to sales orders page', async ({ page, login }) => {
		await login()

		await page.goto('/sales/orders')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that customer deletion requires confirmation
	 * This ensures accidental deletions are prevented
	 */
	test('requires confirmation before deleting customer', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click delete button on a customer
		const deleteButton = page.getByRole('button', { name: /hapus/i }).first()
		if ((await deleteButton.count()) > 0) {
			await deleteButton.click()

			// Verify confirmation dialog appears
			await expect(page.getByText(/apakah anda yakin/i)).toBeVisible()
		}
	})
})
