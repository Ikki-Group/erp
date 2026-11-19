import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'
import { uniqueSuffix } from './helpers/test-data'

/** Creates a material through the full-page form and waits for the list. */
async function createMaterial(page: Page, code: string, name: string) {
	await page.goto('/master/materials/new')
	await page.getByLabel('Kode').fill(code)
	await page.getByLabel('Nama').fill(name)
	await page.getByRole('combobox', { name: 'Satuan Dasar' }).fill('Kilogram')
	await page.getByRole('option', { name: /Kilogram/u }).click()
	await page.getByRole('button', { name: 'Buat', exact: true }).click()
	await expect(page.getByText('Bahan berhasil dibuat.')).toBeVisible()
}

test.describe('Materials - Material CRUD', () => {
	/** Page loads and shows header */
	test('displays materials page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await expect(page.getByRole('heading', { name: 'Bahan' })).toBeVisible()
		await expect(page.getByText('Kelola bahan, kategori, dan penugasan lokasi.')).toBeVisible()
	})

	/** Add Material button is visible */
	test('shows Tambah Bahan button', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await expect(page.getByRole('button', { name: 'Tambah Bahan' })).toBeVisible()
	})

	/** Add Material navigates to the full-page create route */
	test('navigates to the create page when clicking Tambah Bahan', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await page.getByRole('button', { name: 'Tambah Bahan' }).click()

		await expect(page).toHaveURL(/\/master\/materials\/new$/u)
		await expect(page.getByRole('heading', { name: 'Tambah Bahan' })).toBeVisible()
	})

	/** Create a new material end-to-end via the full-page form */
	test('can create a new material', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `MAT-E2E-${suffix}`
		await createMaterial(page, code, `Bahan E2E ${suffix}`)

		await expect(page).toHaveURL(/\/master\/materials(\?.*)?$/u)
	})

	/** Search filters the list by name */
	test('can search materials by name', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `MAT-E2E-${suffix}`
		await createMaterial(page, code, `Bahan E2E ${suffix}`)

		await page.goto('/master/materials')
		await page.getByPlaceholder('Cari bahan...').fill(suffix)

		await expect(page).toHaveURL(/[?&]q=/u)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()
	})

	/** Edit navigates to the full-page edit route and saves */
	test('can edit a material via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `MAT-E2E-${suffix}`
		await createMaterial(page, code, `Bahan E2E ${suffix}`)

		await page.goto(`/master/materials?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page).toHaveURL(/\/master\/materials\/\d+$/u)
		await expect(page.getByRole('heading', { name: 'Ubah Bahan' })).toBeVisible()

		const nameField = page.getByLabel('Nama')
		await nameField.clear()
		await nameField.fill(`Bahan Ubah ${suffix}`)

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Bahan berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a material via action menu */
	test('can delete a material via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `MAT-E2E-${suffix}`
		await createMaterial(page, code, `Bahan E2E ${suffix}`)

		await page.goto(`/master/materials?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		await expect(page.getByText('Hapus bahan?')).toBeVisible()
		await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Bahan berhasil dihapus.')).toBeVisible()
	})
})

test.describe('Materials - Category CRUD', () => {
	/** Add Category button is visible */
	test('shows Tambah Kategori button', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await expect(page.getByRole('button', { name: 'Tambah Kategori' })).toBeVisible()
	})

	/** Create a new category through the quick-add dialog */
	test('can create a new category', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		const name = `Kategori E2E ${uniqueSuffix()}`

		await page.getByRole('button', { name: 'Tambah Kategori' }).click()
		await expect(page.getByRole('heading', { name: 'Tambah Kategori' })).toBeVisible()

		await page.getByLabel('Nama').fill(name)
		await page.getByRole('dialog').getByRole('button', { name: 'Buat', exact: true }).click()

		await expect(page.getByText('Kategori berhasil dibuat.')).toBeVisible()
		await expect(page.getByText(name, { exact: true })).toBeVisible()
	})

	/** Category filter dropdown is available */
	test('can filter materials by category', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await expect(page.getByRole('combobox', { name: 'Kategori' })).toBeVisible()
	})

	/** Edit a category inline from the list */
	test('can edit a category inline', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		const suffix = uniqueSuffix()
		const name = `Kategori E2E ${suffix}`

		// Create a category so the inline edit button has a target.
		await page.getByRole('button', { name: 'Tambah Kategori' }).click()
		await page.getByLabel('Nama').fill(name)
		await page.getByRole('dialog').getByRole('button', { name: 'Buat', exact: true }).click()
		await expect(page.getByText('Kategori berhasil dibuat.')).toBeVisible()

		const categoryRow = page.getByText(name, { exact: true }).locator('..')
		await categoryRow.getByRole('button').first().click()

		await expect(page.getByRole('heading', { name: 'Ubah Kategori' })).toBeVisible()

		const nameField = page.getByLabel('Nama')
		await nameField.clear()
		await nameField.fill(`Kategori Ubah ${suffix}`)

		await page.getByRole('dialog').getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Kategori berhasil diperbarui.')).toBeVisible()
	})
})

test.describe('Materials - Location Assignment', () => {
	/** Open location assignment dialog from action menu */
	test('can open location assignment dialog', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `MAT-E2E-${suffix}`
		await createMaterial(page, code, `Bahan E2E ${suffix}`)

		await page.goto(`/master/materials?q=${code}`)
		await expect(page.getByRole('row', { name: new RegExp(code, 'u') })).toBeVisible()

		await page.getByRole('button', { name: 'Tindakan' }).first().click()
		await page.getByRole('menuitem', { name: 'Lokasi' }).click()

		await expect(page.getByRole('heading', { name: 'Penugasan Lokasi' })).toBeVisible()
		await expect(page.getByRole('list', { name: 'Penugasan lokasi' })).toBeVisible()
	})
})
