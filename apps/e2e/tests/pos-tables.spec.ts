import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'
import { uniqueSuffix } from './helpers/test-data'

/** Creates a table through the full-page form and waits for the list. */
async function createTable(page: Page, number: string) {
	await page.goto('/pos/tables/new')
	await page.getByLabel('Nomor / Nama').fill(number)
	await page.getByLabel('Kapasitas').fill('6')
	await page.getByRole('button', { name: 'Buat' }).click()
	await expect(page.getByText('Meja berhasil dibuat.')).toBeVisible()
}

test.describe('POS Tables - CRUD', () => {
	/** Page loads and shows header */
	test('displays tables page with header', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		await expect(page.getByRole('heading', { name: 'Meja' })).toBeVisible()
		await expect(page.getByText('Kelola meja makan di tempat untuk lokasi ini.')).toBeVisible()
	})

	/** Add Table button is visible */
	test('shows Tambah Meja button', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		await expect(page.getByRole('button', { name: 'Tambah Meja' })).toBeVisible()
	})

	/** Opening the full-page create route */
	test('navigates to the create page when clicking Tambah Meja', async ({ page, login }) => {
		await login()
		await page.goto('/pos/tables')

		await page.getByRole('button', { name: 'Tambah Meja' }).click()

		await expect(page).toHaveURL(/\/pos\/tables\/new$/u)
		await expect(page.getByRole('heading', { name: 'Tambah Meja' })).toBeVisible()
	})

	/** Create a new table end-to-end */
	test('can create a new table', async ({ page, login }) => {
		await login()

		const number = `T-${uniqueSuffix()}`
		await createTable(page, number)

		await expect(page).toHaveURL(/\/pos\/tables(\?.*)?$/u)
		await page.goto(`/pos/tables?q=${number}`)
		await expect(page.getByRole('cell', { name: number, exact: true })).toBeVisible()
	})

	/** Edit a table via action menu */
	test('can edit a table via action menu', async ({ page, login }) => {
		await login()

		const number = `T-${uniqueSuffix()}`
		await createTable(page, number)

		await page.goto(`/pos/tables?q=${number}`)
		await expect(page.getByRole('cell', { name: number, exact: true })).toBeVisible()

		const actionTrigger = page.getByRole('button', { name: 'Tindakan' }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page).toHaveURL(/\/pos\/tables\/\d+$/u)
		await expect(page.getByRole('heading', { name: 'Ubah Meja' })).toBeVisible()

		const numberField = page.getByLabel('Nomor / Nama')
		await numberField.clear()
		await numberField.fill(`T-UPD-${uniqueSuffix()}`)

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Meja berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a table via action menu */
	test('can delete a table via action menu', async ({ page, login }) => {
		await login()

		const number = `T-${uniqueSuffix()}`
		await createTable(page, number)

		await page.goto(`/pos/tables?q=${number}`)
		await expect(page.getByRole('cell', { name: number, exact: true })).toBeVisible()

		const actionTrigger = page.getByRole('button', { name: 'Tindakan' }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		await expect(page.getByRole('dialog').getByText('Hapus meja?')).toBeVisible()
		await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Meja berhasil dihapus.')).toBeVisible()
	})
})
