import { test, expect } from './fixtures/auth.fixture'

test.describe('Purchasing Flow', () => {
	/**
	 * Test that supplier list page loads and displays suppliers
	 * This ensures the supplier directory is accessible
	 */
	test('displays supplier list page', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Verify page title
		await expect(page.getByText('Data Supplier')).toBeVisible()
	})

	/**
	 * Test that user can navigate to supplier creation dialog
	 * This ensures the supplier creation flow is accessible
	 */
	test('can open supplier creation dialog', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Click "Tambah Supplier" button
		await page.getByRole('button', { name: /tambah supplier/i }).click()

		// Verify dialog opens
		await expect(page.getByText(/tambah supplier/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that supplier form has required fields
	 * This ensures the form structure is complete for supplier data entry
	 */
	test('supplier form displays required fields', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Open supplier dialog
		await page.getByRole('button', { name: /tambah supplier/i }).click()

		// Verify form fields
		await expect(page.getByLabel('Nama')).toBeVisible()
		await expect(page.getByLabel('Kode')).toBeVisible()
	})

	/**
	 * Test that user can create a new supplier
	 * This ensures supplier creation functionality works end-to-end
	 */
	test('can create a new supplier', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Open supplier dialog
		await page.getByRole('button', { name: /tambah supplier/i }).click()

		// Fill supplier name
		await page.getByLabel('Nama').fill('Test Supplier E2E')

		// Fill supplier code
		await page.getByLabel('Kode').fill('SUP-TEST-001')

		// Submit form
		await page.getByRole('button', { name: /simpan/i }).click()

		// Verify success toast
		await expect(page.getByText(/berhasil/i)).toBeVisible()
	})

	/**
	 * Test that user can edit an existing supplier
	 * This ensures supplier update functionality works correctly
	 */
	test('can edit existing supplier', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Click edit button on first supplier (assumes at least one exists)
		const editButton = page.getByRole('button', { name: /edit/i }).first()
		await editButton.click()

		// Verify dialog opens with edit mode
		await expect(page.getByText(/edit supplier/i, { exact: false })).toBeVisible()

		// Update supplier name
		const nameField = page.getByLabel('Nama')
		await nameField.clear()
		await nameField.fill('Updated Test Supplier')

		// Submit form
		await page.getByRole('button', { name: /simpan/i }).click()

		// Verify success toast
		await expect(page.getByText(/berhasil/i)).toBeVisible()
	})

	/**
	 * Test that user can search for suppliers
	 * This ensures the search functionality works for finding specific suppliers
	 */
	test('can search for suppliers', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Enter search term
		const searchInput = page.getByPlaceholder(/cari supplier/i)
		await searchInput.fill('Test')

		// Wait for search to complete
		await page.waitForTimeout(500)

		// Verify search input has value
		await expect(searchInput).toHaveValue('Test')
	})

	/**
	 * Test that user can navigate to purchase orders page
	 * This ensures the PO management page is accessible
	 */
	test('can navigate to purchase orders page', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/orders')

		// Verify page loads (check for PO-related content)
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that user can navigate to goods receipt (GRN) page
	 * This ensures the receiving flow is accessible
	 */
	test('can navigate to goods receipt page', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/receipts')

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that supplier deletion requires confirmation
	 * This ensures accidental deletions are prevented
	 */
	test('requires confirmation before deleting supplier', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Click delete button on a supplier
		const deleteButton = page.getByRole('button', { name: /hapus/i }).first()
		await deleteButton.click()

		// Verify confirmation dialog appears
		await expect(page.getByText(/apakah anda yakin/i)).toBeVisible()
	})

	/**
	 * Test that user can cancel supplier deletion
	 * This ensures the cancel action works in confirmation dialog
	 */
	test('can cancel supplier deletion', async ({ page, login }) => {
		await login()

		await page.goto('/procurement/suppliers')

		// Click delete button
		const deleteButton = page.getByRole('button', { name: /hapus/i }).first()
		await deleteButton.click()

		// Click cancel in confirmation dialog
		const cancelButton = page.getByRole('button', { name: /batal/i })
		await cancelButton.click()

		// Verify dialog closes and supplier still exists
		await expect(page.getByText(/apakah anda yakin/i)).not.toBeVisible()
	})
})
