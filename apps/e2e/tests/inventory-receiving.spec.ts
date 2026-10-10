import { test, expect } from './fixtures/auth.fixture'

test.describe('Inventory Receiving - Page Load', () => {
	/** Receiving page loads and shows header */
	test('displays receiving page with header', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await expect(page.getByRole('heading', { name: /penerimaan barang/iu })).toBeVisible()
	})

	/** Shows active location context in description */
	test('shows active location context in description', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await expect(page.getByText(/penerimaan dari supplier ke/iu)).toBeVisible()
	})

	/** Shows "Buat Penerimaan" button */
	test('shows create receiving button', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await expect(page.getByRole('button', { name: /buat penerimaan/iu })).toBeVisible()
	})
})

test.describe('Inventory Receiving - Empty State', () => {
	/** Shows empty state or table depending on data */
	test('displays empty state or table', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		const hasTable = page.locator('table')
		const hasEmpty = page.getByText(/belum ada penerimaan/iu)

		await expect(hasTable.or(hasEmpty)).toBeVisible()
	})
})

test.describe('Inventory Receiving - Create Dialog', () => {
	/** Opens create receiving dialog */
	test('opens create receiving dialog on button click', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await page.getByRole('button', { name: /buat penerimaan/iu }).click()

		await expect(page.getByRole('heading', { name: /buat penerimaan/iu })).toBeVisible()
		await expect(page.getByText(/supplier/iu)).toBeVisible()
	})

	/** Shows line item section in create dialog */
	test('shows item section with add line button', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await page.getByRole('button', { name: /buat penerimaan/iu }).click()

		await expect(page.getByText(/item penerimaan/iu)).toBeVisible()
		await expect(page.getByRole('button', { name: /tambah baris/iu })).toBeVisible()
	})

	/** Can add additional material lines */
	test('can add additional material lines', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await page.getByRole('button', { name: /buat penerimaan/iu }).click()
		await page.getByRole('button', { name: /tambah baris/iu }).click()

		const materialInputs = page.getByPlaceholder('Pilih material')
		await expect(materialInputs).toHaveCount(2)
	})
})

test.describe('Inventory Receiving - Detail View', () => {
	/** Detail button is visible when receivings exist */
	test('shows detail button in table rows', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		const hasTable = page.locator('table')
		const hasEmpty = page.getByText(/belum ada penerimaan/iu)

		const tableVisible = await hasTable.isVisible().catch(() => false)
		if (tableVisible) {
			const detailBtn = page.getByRole('button', { name: /detail/iu }).first()
			await expect(detailBtn).toBeVisible()
		} else {
			await expect(hasEmpty).toBeVisible()
		}
	})
})

test.describe('Inventory Receiving - Navigation', () => {
	/** Receiving link is accessible from sidebar */
	test('can navigate to receiving page from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: /penerimaan/iu }).click()

		await expect(page).toHaveURL(/\/inventory\/receiving/u)
	})
})
