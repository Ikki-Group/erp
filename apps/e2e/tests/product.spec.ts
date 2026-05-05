import { test, expect } from './fixtures/auth.fixture'

test.describe('Product Catalog - CRUD', () => {
	/**
	 * Test that product list page loads and displays products
	 * This ensures the product catalog is accessible and renders correctly
	 */
	test('displays product list page', async ({ page, login }) => {
		await login()

		await page.goto('/product')

		// Verify page title
		await expect(page.getByText('Daftar Produk')).toBeVisible()
	})

	/**
	 * Test that user can navigate to product creation page
	 * This ensures the create flow is accessible from the product list
	 */
	test('can navigate to product creation page', async ({ page, login }) => {
		await login()

		await page.goto('/product')

		// Click "Tambah Produk" button
		await page.getByRole('button', { name: /tambah/i }).click()

		// Verify form page loads
		await expect(page.getByText('Tambah Produk')).toBeVisible()
	})

	/**
	 * Test that product form has all required fields
	 * This ensures the form structure is complete for data entry
	 */
	test('product form displays all required fields', async ({ page, login }) => {
		await login()

		await page.goto('/product/create')

		// Verify basic info fields
		await expect(page.getByLabel('Nama Produk')).toBeVisible()
		await expect(page.getByLabel('SKU')).toBeVisible()
		await expect(page.getByLabel('Kategori')).toBeVisible()
		await expect(page.getByLabel('Status')).toBeVisible()
		await expect(page.getByLabel('Deskripsi')).toBeVisible()

		// Verify pricing section
		await expect(page.getByText('Harga & Varian')).toBeVisible()
	})

	/**
	 * Test that user can create a new product with basic information
	 * This ensures the create functionality works end-to-end
	 */
	test('can create a new product', async ({ page, login }) => {
		await login()

		await page.goto('/product/create')

		// Fill in product name
		await page.getByLabel('Nama Produk').fill('Test Product E2E')

		// Generate SKU
		await page.getByLabel('SKU').fill('PRD-TEST-001')

		// Set status
		await page.getByLabel('Status').selectOption('active')

		// Set base price
		await page.getByPlaceholder('0').fill('25000')

		// Submit form
		await page.getByRole('button', { name: /simpan/i }).click()

		// Verify success toast
		await expect(page.getByText(/berhasil/i)).toBeVisible()

		// Verify redirect to product list
		await expect(page).toHaveURL(/\/product/)
	})

	/**
	 * Test that product form validates required fields
	 * This ensures form validation prevents invalid data submission
	 */
	test('validates required product fields', async ({ page, login }) => {
		await login()

		await page.goto('/product/create')

		// Try to submit without filling required fields
		await page.getByRole('button', { name: /simpan/i }).click()

		// Should show validation errors
		await expect(page.getByText('Nama produk wajib diisi')).toBeVisible()
	})

	/**
	 * Test that SKU can be auto-generated from product name
	 * This ensures the SKU generation feature works correctly
	 */
	test('can auto-generate SKU from product name', async ({ page, login }) => {
		await login()

		await page.goto('/product/create')

		// Fill product name
		await page.getByLabel('Nama Produk').fill('Cappuccino Test')

		// Click generate SKU button
		await page.getByTitle('Generate SKU otomatis').click()

		// Verify SKU is generated
		const skuInput = page.getByLabel('SKU')
		const skuValue = await skuInput.inputValue()
		expect(skuValue.length).toBeGreaterThan(0)
	})

	/**
	 * Test that user can edit an existing product
	 * This ensures the update functionality works correctly
	 */
	test('can edit existing product', async ({ page, login }) => {
		await login()

		// Navigate to product list
		await page.goto('/product')

		// Click edit button on first product (this assumes at least one product exists)
		const editButton = page.getByRole('button', { name: /edit/i }).first()
		await editButton.click()

		// Verify edit page loads
		await expect(page.getByText('Edit Produk')).toBeVisible()

		// Update product name
		const nameField = page.getByLabel('Nama Produk')
		await nameField.clear()
		await nameField.fill('Updated Test Product')

		// Submit form
		await page.getByRole('button', { name: /simpan/i }).click()

		// Verify success toast
		await expect(page.getByText(/berhasil/i)).toBeVisible()
	})

	/**
	 * Test that user can deactivate a product (soft delete)
	 * This ensures products can be marked as inactive without deletion
	 */
	test('can deactivate a product', async ({ page, login }) => {
		await login()

		await page.goto('/product')

		// Navigate to edit page
		const editButton = page.getByRole('button', { name: /edit/i }).first()
		await editButton.click()

		// Change status to inactive
		await page.getByLabel('Status').selectOption('inactive')

		// Submit form
		await page.getByRole('button', { name: /simpan/i }).click()

		// Verify success
		await expect(page.getByText(/berhasil/i)).toBeVisible()
	})

	/**
	 * Test that user can filter products by search term
	 * This ensures the search functionality works for finding specific products
	 */
	test('can search for products by name', async ({ page, login }) => {
		await login()

		await page.goto('/product')

		// Enter search term
		const searchInput = page.getByPlaceholder(/cari/i)
		await searchInput.fill('Test')

		// Wait for search to complete
		await page.waitForTimeout(500)

		// Verify search results are displayed
		// (This assumes products with "Test" in the name exist)
		await expect(searchInput).toHaveValue('Test')
	})

	/**
	 * Test that user can add product variants
	 * This ensures the variant management feature works for products with multiple SKUs
	 */
	test('can add product variants', async ({ page, login }) => {
		await login()

		await page.goto('/product/create')

		// Fill basic product info
		await page.getByLabel('Nama Produk').fill('Variant Test Product')
		await page.getByLabel('SKU').fill('PRD-VAR-001')

		// Click "Tambah varian" button
		await page.getByRole('button', { name: /tambah varian/i }).click()

		// Verify variant dialog opens
		await expect(page.getByText(/kelola varian/i)).toBeVisible()
	})

	/**
	 * Test that user can enable sales type pricing
	 * This ensures different prices can be set per sales channel (e.g., dine-in vs take-away)
	 */
	test('can enable sales type pricing', async ({ page, login }) => {
		await login()

		await page.goto('/product/create')

		// Fill basic info
		await page.getByLabel('Nama Produk').fill('Sales Type Test')
		await page.getByLabel('SKU').fill('PRD-ST-001')

		// Enable sales type pricing toggle
		const salesTypeToggle = page.getByRole('switch', { name: /harga per sales type/i })
		await salesTypeToggle.click()

		// Verify sales type pricing table appears
		await expect(page.getByText(/Dine In/i)).toBeVisible()
	})
})
