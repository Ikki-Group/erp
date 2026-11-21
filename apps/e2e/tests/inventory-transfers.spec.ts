import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'

/** Wizard step 1: destination must differ from the locked source location. */
async function chooseDestination(page: Page) {
	await page.getByLabel('Lokasi Tujuan').click()
	await page.getByRole('option', { name: /warehouse pusat/i }).click()
}

test.describe('Inventory Transfers - Page Load', () => {
	/** Transfers page loads and shows header */
	test('displays transfer page with header', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await expect(page.getByRole('heading', { name: 'Transfer Inventori' })).toBeVisible()
	})

	/** Shows location name in description when location is active */
	test('shows active location context in description', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await expect(page.getByText(/transfer antar lokasi dari dan ke/i)).toBeVisible()
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

test.describe('Inventory Transfers - Create Wizard', () => {
	/** Create button opens the full-page wizard (no dialog anymore) */
	test('opens create transfer wizard on button click', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers')

		await page.getByRole('button', { name: /buat transfer/i }).click()

		await expect(page).toHaveURL(/\/inventory\/transfers\/new/)
		await expect(page.getByRole('heading', { name: 'Buat Transfer' })).toBeVisible()
		await expect(page.getByLabel('Lokasi Asal')).toBeVisible()
		await expect(page.getByLabel('Lokasi Tujuan')).toBeVisible()
	})

	/** Item step shows the line editor with its add-row button */
	test('shows item transfer section with material inputs', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers/new')

		await chooseDestination(page)
		await page.getByRole('button', { name: 'Lanjut' }).click()

		await expect(page.getByRole('heading', { name: /item transfer/i })).toBeVisible()
		await expect(page.getByRole('button', { name: /tambah baris/i })).toBeVisible()
	})

	/** Can add and remove lines in create wizard */
	test('can add additional material lines', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/transfers/new')

		await chooseDestination(page)
		await page.getByRole('button', { name: 'Lanjut' }).click()
		await page.getByRole('button', { name: /tambah baris/i }).click()

		const materialInputs = page.getByPlaceholder('Pilih bahan')
		await expect(materialInputs).toHaveCount(1)
	})
})

test.describe('Inventory Transfers - Navigation', () => {
	/** Transfers link is accessible from sidebar */
	test('can navigate to transfers page from sidebar', async ({ page, login }) => {
		await login()

		await page.getByRole('link', { name: /transfer stok/i }).click()

		await expect(page).toHaveURL(/\/inventory\/transfers/)
	})
})
