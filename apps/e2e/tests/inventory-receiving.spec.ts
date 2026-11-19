import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'

/** Wizard step 1: pick a seeded supplier so the Item step unlocks. */
async function chooseSupplier(page: Page) {
	await page.getByLabel('Pemasok').click()
	await page.getByRole('option', { name: /PT Kopi Nusantara/ }).click()
}

test.describe('Inventory Receiving - Page Load', () => {
	/** Receiving page loads and shows header */
	test('displays receiving page with header', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await expect(page.getByRole('heading', { name: 'Penerimaan Barang' })).toBeVisible()
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

		await expect(page.getByRole('button', { name: /buat penerimaan/i }).first()).toBeVisible()
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

test.describe('Inventory Receiving - Create Wizard', () => {
	/** Create button opens the full-page wizard (no dialog anymore) */
	test('opens create receiving wizard on button click', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		await page
			.getByRole('button', { name: /buat penerimaan/i })
			.first()
			.click()

		await expect(page).toHaveURL(/\/inventory\/receiving\/new/)
		await expect(page.getByRole('heading', { name: 'Buat Penerimaan' })).toBeVisible()
		await expect(page.getByLabel('Pemasok')).toBeVisible()
	})

	/** Item step shows the line editor with its add-row button */
	test('shows item section with add line button', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving/new')

		await chooseSupplier(page)
		await page.getByRole('button', { name: 'Lanjut' }).click()

		await expect(page.getByRole('heading', { name: /item penerimaan/i })).toBeVisible()
		await expect(page.getByRole('button', { name: /tambah baris/i })).toBeVisible()
	})

	/** Can add additional material lines */
	test('can add additional material lines', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving/new')

		await chooseSupplier(page)
		await page.getByRole('button', { name: 'Lanjut' }).click()
		await page.getByRole('button', { name: /tambah baris/i }).click()

		const materialInputs = page.getByPlaceholder('Pilih bahan')
		await expect(materialInputs).toHaveCount(1)
	})
})

test.describe('Inventory Receiving - Detail View', () => {
	/** Detail button is visible when receivings exist */
	test('shows detail button in table rows', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')

		const detailBtn = page.getByRole('button', { name: /^detail /i }).first()
		const emptyState = page.getByText(/belum ada penerimaan/i)

		await expect(detailBtn.or(emptyState)).toBeVisible()
	})
})

test.describe('Inventory Receiving - Navigation', () => {
	/** Receiving link is accessible from sidebar */
	test('can navigate to receiving page from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: /penerimaan barang/i }).click()

		await expect(page).toHaveURL(/\/inventory\/receiving/)
	})
})
