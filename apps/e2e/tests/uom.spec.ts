import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'
import { uniqueSuffix } from './helpers/test-data'

/** Creates a unit through the full-page form and waits for the list. */
async function createUnit(page: Page, code: string, name: string) {
	await page.goto('/master/uom/new')
	await page.getByLabel('Kode').fill(code)
	await page.getByLabel('Nama').fill(name)
	await page.getByRole('button', { name: 'Buat', exact: true }).click()
	await expect(page.getByText('Satuan berhasil dibuat.')).toBeVisible()
}

test.describe('UoM - Unit CRUD', () => {
	/** Page loads and shows header */
	test('displays UoM page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await expect(page.getByRole('heading', { name: 'Satuan' })).toBeVisible()
		await expect(page.getByText('Kelola satuan dan faktor konversi.')).toBeVisible()
	})

	/** Add Unit button is visible for authorized users */
	test('shows Tambah Satuan button', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await expect(page.getByRole('button', { name: 'Tambah Satuan' })).toBeVisible()
	})

	/** Add Unit navigates to the full-page create route */
	test('navigates to the create page when clicking Tambah Satuan', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await page.getByRole('button', { name: 'Tambah Satuan' }).click()

		await expect(page).toHaveURL(/\/master\/uom\/new$/u)
		await expect(page.getByRole('heading', { name: 'Tambah Satuan' })).toBeVisible()
	})

	/** Create a new unit end-to-end via the full-page form */
	test('can create a new unit', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `uom-e2e-${suffix}`
		await createUnit(page, code, `Satuan E2E ${suffix}`)

		await expect(page).toHaveURL(/\/master\/uom(\?.*)?$/u)
	})

	/** Search filters the list by name */
	test('can search units by name', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `uom-e2e-${suffix}`
		await createUnit(page, code, `Satuan E2E ${suffix}`)

		await page.goto('/master/uom')
		await page.getByPlaceholder('Cari satuan...').fill(suffix)

		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()
	})

	/** Edit navigates to the full-page edit route and saves */
	test('can edit a unit via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `uom-e2e-${suffix}`
		await createUnit(page, code, `Satuan E2E ${suffix}`)

		await page.goto(`/master/uom?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page).toHaveURL(/\/master\/uom\/\d+$/u)
		await expect(page.getByRole('heading', { name: 'Ubah Satuan' })).toBeVisible()

		const nameField = page.getByLabel('Nama')
		await nameField.clear()
		await nameField.fill(`Satuan Ubah ${suffix}`)

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Satuan berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a unit via action menu */
	test('can delete a unit via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `uom-e2e-${suffix}`
		await createUnit(page, code, `Satuan E2E ${suffix}`)

		await page.goto(`/master/uom?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		await expect(page.getByText('Hapus satuan?')).toBeVisible()
		await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Satuan berhasil dihapus.')).toBeVisible()
	})
})

test.describe('UoM - Conversions', () => {
	/** Add Conversion button is visible */
	test('shows Tambah Konversi button', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await expect(page.getByRole('button', { name: 'Tambah Konversi' })).toBeVisible()
		await expect(page.getByText('Konversi', { exact: true })).toBeVisible()
	})

	/** Create a conversion between two units */
	test('can create a conversion', async ({ page, login }) => {
		await login()

		// Seed conversions already cover every same-category pair of the seeded
		// units, so create a fresh quantity unit first (the form defaults to it).
		const suffix = uniqueSuffix()
		const unitName = `Satuan Konversi ${suffix}`
		await createUnit(page, `uom-konv-${suffix}`, unitName)

		await page.goto('/master/uom')

		await page.getByRole('button', { name: 'Tambah Konversi' }).click()
		await expect(page.getByRole('heading', { name: 'Tambah Konversi' })).toBeVisible()

		await page.getByRole('combobox', { name: 'Dari Satuan' }).fill('Pieces')
		await page.getByRole('option', { name: /Pieces/u }).click()

		await page.getByRole('combobox', { name: 'Ke Satuan' }).fill(unitName)
		await page.getByRole('option', { name: new RegExp(unitName, 'u') }).click()

		await page.getByLabel('Faktor').fill('12')
		await page.getByRole('dialog').getByRole('button', { name: 'Buat', exact: true }).click()

		await expect(page.getByText('Konversi berhasil dibuat.')).toBeVisible()
	})

	/** Delete a conversion */
	test('can delete a conversion', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		const deleteButton = page.getByRole('button', { name: 'Hapus konversi' }).first()
		await expect(deleteButton).toBeVisible()
		await deleteButton.click()

		await expect(page.getByText('Hapus konversi?')).toBeVisible()
		await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Konversi berhasil dihapus.')).toBeVisible()
	})
})
