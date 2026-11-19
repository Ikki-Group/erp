import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'
import { uniqueSuffix } from './helpers/test-data'

/** Creates a supplier through the full-page form and waits for the list. */
async function createSupplier(page: Page, code: string, name: string) {
	await page.goto('/master/suppliers/new')
	await page.getByLabel('Kode').fill(code)
	await page.getByLabel('Nama').fill(name)
	await page.getByRole('button', { name: 'Buat', exact: true }).click()
	await expect(page.getByText('Pemasok berhasil dibuat.')).toBeVisible()
}

test.describe('Suppliers - CRUD', () => {
	/** Page loads and shows header */
	test('displays suppliers page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		await expect(page.getByRole('heading', { name: 'Pemasok' })).toBeVisible()
		await expect(page.getByText('Kelola pemasok dan harga bahannya.')).toBeVisible()
	})

	/** Add Supplier button is visible */
	test('shows Tambah Pemasok button', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		await expect(page.getByRole('button', { name: 'Tambah Pemasok' })).toBeVisible()
	})

	/** Add Supplier navigates to the full-page create route */
	test('navigates to the create page when clicking Tambah Pemasok', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		await page.getByRole('button', { name: 'Tambah Pemasok' }).click()

		await expect(page).toHaveURL(/\/master\/suppliers\/new$/u)
		await expect(page.getByRole('heading', { name: 'Tambah Pemasok' })).toBeVisible()
	})

	/** Create a new supplier end-to-end via the full-page form */
	test('can create a new supplier', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		await createSupplier(page, `SUP-E2E-${suffix}`, `Pemasok E2E ${suffix}`)

		await expect(page).toHaveURL(/\/master\/suppliers(\?.*)?$/u)
	})

	/** Search filters the list by name */
	test('can search suppliers by name', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `SUP-E2E-${suffix}`
		await createSupplier(page, code, `Pemasok E2E ${suffix}`)

		await page.goto('/master/suppliers')
		await page.getByPlaceholder('Cari pemasok...').fill(suffix)

		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()
	})

	/** Edit navigates to the full-page edit route and saves */
	test('can edit a supplier via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `SUP-E2E-${suffix}`
		await createSupplier(page, code, `Pemasok E2E ${suffix}`)

		await page.goto(`/master/suppliers?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page).toHaveURL(/\/master\/suppliers\/\d+$/u)
		await expect(page.getByRole('heading', { name: 'Ubah Pemasok' })).toBeVisible()

		const nameField = page.getByLabel('Nama')
		await nameField.clear()
		await nameField.fill(`Pemasok Ubah ${suffix}`)

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Pemasok berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a supplier via action menu */
	test('can delete a supplier via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `SUP-E2E-${suffix}`
		await createSupplier(page, code, `Pemasok E2E ${suffix}`)

		await page.goto(`/master/suppliers?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		await expect(page.getByText('Hapus pemasok?')).toBeVisible()
		await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Pemasok berhasil dihapus.')).toBeVisible()
	})
})

test.describe('Suppliers - Pricing', () => {
	/** Open the pricing dialog from the action menu */
	test('can open pricing dialog', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `SUP-E2E-${suffix}`
		await createSupplier(page, code, `Pemasok E2E ${suffix}`)

		await page.goto(`/master/suppliers?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Harga' }).click()

		await expect(page.getByRole('heading', { name: 'Harga Bahan' })).toBeVisible()
		await expect(page.getByText('Belum ada data harga untuk pemasok ini.')).toBeVisible()

		await page.getByRole('button', { name: 'Selesai' }).click()
	})

	/** Add a material price for a supplier */
	test('can add a material price', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `SUP-E2E-${suffix}`
		await createSupplier(page, code, `Pemasok E2E ${suffix}`)

		await page.goto(`/master/suppliers?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Harga' }).click()

		await page.getByRole('button', { name: 'Tambah Harga' }).click()
		await expect(page.getByRole('heading', { name: 'Tambah Harga Bahan' })).toBeVisible()

		await page.getByRole('combobox', { name: 'Bahan' }).click()
		await page.getByRole('option').first().click()

		await page.getByLabel('Harga Satuan').fill('50000')

		await page.getByRole('combobox', { name: 'Satuan' }).click()
		await page.getByRole('option').first().click()

		await page.getByRole('button', { name: 'Tambah', exact: true }).click()

		await expect(page.getByText('Harga berhasil ditambahkan.')).toBeVisible()
		await expect(page.getByText('Rp 50.000')).toBeVisible()
	})
})
