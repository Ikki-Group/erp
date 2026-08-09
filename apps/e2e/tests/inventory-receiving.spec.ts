import { test, expect } from './fixtures/auth.fixture'

test.describe('Inventory Receiving - Page Load', () => {
	/** Receiving page loads and shows header */
	test('displays receiving page with header', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await expect(page.getByRole('heading', { name: /penerimaan barang/i })).toBeVisible()
	})

	/** Shows active location context in description */
	test('shows active location context in description', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await expect(page.getByText(/penerimaan dari supplier ke/i)).toBeVisible()
	})

	/** Shows "Buat Penerimaan" button */
	test('shows create receiving button', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await expect(page.getByRole('button', { name: /buat penerimaan/i })).toBeVisible()
	})
})

test.describe('Inventory Receiving - Empty State', () => {
	/** Shows empty state or table depending on data */
	test('displays empty state or table', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		const hasTable = page.locator('table')
		const hasEmpty = page.getByText(/belum ada penerimaan/i)

		await expect(hasTable.or(hasEmpty)).toBeVisible()
	})
})

test.describe('Inventory Receiving - Create Dialog', () => {
	/** Opens create receiving dialog */
	test('opens create receiving dialog on button click', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await page.getByRole('button', { name: /buat penerimaan/i }).click()

		await expect(page.getByRole('heading', { name: /buat penerimaan/i })).toBeVisible()
		await expect(page.getByText(/supplier/i)).toBeVisible()
	})

	/** Shows line item section in create dialog */
	test('shows item section with add line button', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await page.getByRole('button', { name: /buat penerimaan/i }).click()

		await expect(page.getByText(/item penerimaan/i)).toBeVisible()
		await expect(page.getByRole('button', { name: /tambah baris/i })).toBeVisible()
	})

	/** Can add additional material lines */
	test('can add additional material lines', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await page.getByRole('button', { name: /buat penerimaan/i }).click()
		await page.getByRole('button', { name: /tambah baris/i }).click()

		const materialInputs = page.getByPlaceholder('Pilih material')
		await expect(materialInputs).toHaveCount(2)
	})
})

test.describe('Inventory Receiving - Navigation', () => {
	/** Receiving link is accessible from sidebar */
	test('can navigate to receiving page from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: /penerimaan/i }).click()

		await expect(page).toHaveURL(/\/inventory\/receiving/)
	})
})
