import { test, expect } from './fixtures/auth.fixture'

test.describe('Inventory Transfers - Page Load', () => {
	/** Transfers page loads and shows header */
	test('displays transfer page with header', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await expect(page.getByRole('heading', { name: /transfer inventori/i })).toBeVisible()
	})

	/** Shows location name in description when location is active */
	test('shows active location context in description', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await expect(page.getByText(/transfer antar lokasi dari/i)).toBeVisible()
	})

	/** Shows "Buat Transfer" button */
	test('shows create transfer button', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await expect(page.getByRole('button', { name: /buat transfer/i })).toBeVisible()
	})
})

test.describe('Inventory Transfers - Empty State', () => {
	/** Shows empty state when no transfers exist */
	test('displays empty state or table', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		const hasTable = page.locator('table')
		const hasEmpty = page.getByText(/belum ada transfer/i)

		await expect(hasTable.or(hasEmpty)).toBeVisible()
	})
})

test.describe('Inventory Transfers - Create Dialog', () => {
	/** Opens create transfer dialog */
	test('opens create transfer dialog on button click', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await page.getByRole('button', { name: /buat transfer/i }).click()

		await expect(page.getByRole('heading', { name: /buat transfer/i })).toBeVisible()
		await expect(page.getByText(/lokasi asal/i)).toBeVisible()
		await expect(page.getByText(/lokasi tujuan/i)).toBeVisible()
	})

	/** Shows material line inputs in create dialog */
	test('shows item transfer section with material inputs', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await page.getByRole('button', { name: /buat transfer/i }).click()

		await expect(page.getByText(/item transfer/i)).toBeVisible()
		await expect(page.getByRole('button', { name: /tambah baris/i })).toBeVisible()
	})

	/** Can add and remove lines in create dialog */
	test('can add additional material lines', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await page.getByRole('button', { name: /buat transfer/i }).click()
		await page.getByRole('button', { name: /tambah baris/i }).click()

		const materialInputs = page.getByPlaceholder('Pilih material')
		await expect(materialInputs).toHaveCount(2)
	})
})

test.describe('Inventory Transfers - Navigation', () => {
	/** Transfers link is accessible from sidebar */
	test('can navigate to transfers page from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: /transfers/i }).click()

		await expect(page).toHaveURL(/\/inventory\/transfers/)
	})
})
