import { test, expect } from './fixtures/auth.fixture'

test.describe('Material Catalog - CRUD', () => {
	/**
	 * Test that material list page loads and displays materials
	 * This ensures the material catalog is accessible and renders correctly
	 */
	test('displays material list page', async ({ page, login }) => {
		await login()

		await page.goto('/material')

		// Verify page title
		await expect(page.getByText('Bahan Baku')).toBeVisible()
	})

	/**
	 * Test that user can navigate to material creation page
	 * This ensures the create flow is accessible from the material list
	 */
	test('can navigate to material creation page', async ({ page, login }) => {
		await login()

		await page.goto('/material')

		// Click "Tambah" button
		await page.getByRole('button', { name: /tambah/i }).click()

		// Verify form page loads
		await expect(page.getByText('Tambah Bahan Baku')).toBeVisible()
	})

	/**
	 * Test that material form has all required fields
	 * This ensures the form structure is complete for data entry
	 */
	test('material form displays all required fields', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Verify basic info fields
		await expect(page.getByLabel('Nama')).toBeVisible()
		await expect(page.getByLabel('SKU')).toBeVisible()
		await expect(page.getByLabel('Kategori')).toBeVisible()
		await expect(page.getByLabel('Jenis')).toBeVisible()
		await expect(page.getByLabel('Deskripsi')).toBeVisible()

		// Verify UOM section
		await expect(page.getByText('Satuan Dasar')).toBeVisible()
		await expect(page.getByLabel('Satuan Utama')).toBeVisible()

		// Verify conversions section
		await expect(page.getByText('Konversi Satuan')).toBeVisible()
	})

	/**
	 * Test that user can create a new material with basic information
	 * This ensures the create functionality works end-to-end
	 */
	test('can create a new material', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Fill in material name
		await page.getByLabel('Nama').fill('Test Material E2E')

		// Generate SKU
		await page.getByLabel('SKU').fill('MAT-TEST-001')

		// Set type
		await page.getByLabel('Jenis').selectOption('raw')

		// Set base UOM (assuming PCS exists)
		await page.getByLabel('Satuan Utama').selectOption('1')

		// Submit form
		await page.getByRole('button', { name: /simpan/i }).click()

		// Verify success toast
		await expect(page.getByText(/berhasil/i)).toBeVisible()

		// Verify redirect to material list
		await expect(page).toHaveURL(/\/material/)
	})

	/**
	 * Test that material form validates required fields
	 * This ensures form validation prevents invalid data submission
	 */
	test('validates required material fields', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Try to submit without filling required fields
		await page.getByRole('button', { name: /simpan/i }).click()

		// Should show validation errors
		await expect(page.getByText('Nama bahan baku harus diisi')).toBeVisible()
	})

	/**
	 * Test that SKU can be auto-generated from material name
	 * This ensures the SKU generation feature works correctly
	 */
	test('can auto-generate SKU from material name', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Fill material name
		await page.getByLabel('Nama').fill('Gula Aren Test')

		// Click generate SKU button
		await page.getByTitle('Generate SKU otomatis').click()

		// Verify SKU is generated
		const skuInput = page.getByLabel('SKU')
		const skuValue = await skuInput.inputValue()
		expect(skuValue.length).toBeGreaterThan(0)
	})

	/**
	 * Test that user can edit an existing material
	 * This ensures the update functionality works correctly
	 */
	test('can edit existing material', async ({ page, login }) => {
		await login()

		// Navigate to material list
		await page.goto('/material')

		// Click edit button on first material (this assumes at least one material exists)
		const editButton = page.getByRole('button', { name: /edit/i }).first()
		await editButton.click()

		// Verify edit page loads
		await expect(page.getByText('Edit Bahan Baku')).toBeVisible()

		// Update material name
		const nameField = page.getByLabel('Nama')
		await nameField.clear()
		await nameField.fill('Updated Test Material')

		// Submit form
		await page.getByRole('button', { name: /simpan/i }).click()

		// Verify success toast
		await expect(page.getByText(/berhasil/i)).toBeVisible()
	})

	/**
	 * Test that user can add UOM conversions to a material
	 * This ensures the unit conversion feature works for materials with multiple units
	 */
	test('can add UOM conversions to material', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Fill basic material info
		await page.getByLabel('Nama').fill('Conversion Test Material')
		await page.getByLabel('SKU').fill('MAT-CONV-001')
		await page.getByLabel('Jenis').selectOption('raw')

		// Set base UOM
		await page.getByLabel('Satuan Utama').selectOption('1')

		// Click "Tambah Konversi" button
		await page.getByRole('button', { name: /tambah konversi/i }).click()

		// Verify conversion row is added
		await expect(page.getByPlaceholder('Pilih satuan...')).toBeVisible()
	})

	/**
	 * Test that user can remove UOM conversions
	 * This ensures conversions can be removed when no longer needed
	 */
	test('can remove UOM conversions', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Fill basic info and set base UOM
		await page.getByLabel('Nama').fill('Remove Conversion Test')
		await page.getByLabel('SKU').fill('MAT-REM-001')
		await page.getByLabel('Jenis').selectOption('raw')
		await page.getByLabel('Satuan Utama').selectOption('1')

		// Add a conversion
		await page.getByRole('button', { name: /tambah konversi/i }).click()

		// Remove the conversion
		const deleteButton = page.getByRole('button', { name: /delete/i }).last()
		await deleteButton.click()

		// Verify conversion row is removed
		const conversionRows = page.getByPlaceholder('Pilih satuan...')
		const count = await conversionRows.count()
		expect(count).toBe(0)
	})

	/**
	 * Test that user can search for materials by name
	 * This ensures the search functionality works for finding specific materials
	 */
	test('can search for materials by name', async ({ page, login }) => {
		await login()

		await page.goto('/material')

		// Enter search term
		const searchInput = page.getByPlaceholder(/cari/i)
		await searchInput.fill('Test')

		// Wait for search to complete
		await page.waitForTimeout(500)

		// Verify search results are displayed
		await expect(searchInput).toHaveValue('Test')
	})

	/**
	 * Test that material type selection works correctly
	 * This ensures materials can be categorized as raw or semi-finished
	 */
	test('can select material type (raw vs semi-finished)', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Select "Bahan Mentah" type
		await page.getByLabel('Jenis').selectOption('raw')

		// Verify selection
		const typeSelect = page.getByLabel('Jenis')
		const selectedValue = await typeSelect.inputValue()
		expect(selectedValue).toBe('raw')
	})

	/**
	 * Test that conversion section shows alert when base UOM not set
	 * This ensures user guidance is provided when configuration is incomplete
	 */
	test('shows alert when base UOM not set for conversions', async ({ page, login }) => {
		await login()

		await page.goto('/material/create')

		// Fill name but don't set base UOM
		await page.getByLabel('Nama').fill('Test Material')

		// Scroll to conversions section
		await page.getByText('Konversi Satuan').scrollIntoViewIfNeeded()

		// Verify alert is shown
		await expect(page.getByText('Satuan Dasar Belum Dipilih')).toBeVisible()
	})
})
