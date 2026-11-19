import { test, expect } from './fixtures/auth.fixture'

import { uniqueSuffix } from './helpers/test-data'

test.describe('Payment Methods - CRUD', () => {
	/** Page loads and shows header */
	test('displays payment methods page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await expect(page.getByRole('heading', { name: 'Metode Pembayaran' })).toBeVisible()
		await expect(
			page.getByText('Kelola metode pembayaran yang tersedia untuk pembayaran POS.'),
		).toBeVisible()
	})

	/** Add Payment Method button is visible */
	test('shows Add Payment Method button', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await expect(page.getByRole('button', { name: 'Tambah Metode Pembayaran' })).toBeVisible()
	})

	/** Create is a full-page editor, not a dialog */
	test('opens the create page when clicking Add Payment Method', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await page.getByRole('button', { name: 'Tambah Metode Pembayaran' }).click()

		await expect(page).toHaveURL(/\/master\/payment-methods\/new$/)
		await expect(page.getByRole('heading', { name: 'Tambah Metode Pembayaran' })).toBeVisible()
		await expect(page.getByRole('dialog')).toHaveCount(0)
	})

	/** Create a cash payment method end-to-end */
	test('can create a cash payment method', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods/new')

		const suffix = uniqueSuffix()

		await page.getByLabel('Kode').fill(`CASH-E2E-${suffix}`)
		await page.getByLabel('Nama', { exact: true }).fill('Tunai E2E')

		await page.getByRole('button', { name: 'Buat' }).click()

		await expect(page.getByText('Metode pembayaran berhasil dibuat.')).toBeVisible()
		await expect(page).toHaveURL(/\/master\/payment-methods(\?.*)?$/)
	})

	/** Create a digital payment method */
	test('can create a digital payment method', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods/new')

		const suffix = uniqueSuffix()

		await page.getByLabel('Kode').fill(`QRIS-E2E-${suffix}`)
		await page.getByLabel('Nama', { exact: true }).fill('QRIS E2E')

		await page.getByLabel('Tipe').click()
		await page.getByRole('option', { name: 'Digital' }).click()

		await page.getByRole('button', { name: 'Buat' }).click()

		await expect(page.getByText('Metode pembayaran berhasil dibuat.')).toBeVisible()
	})

	/** Search/filter payment methods */
	test('can search payment methods', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await page.getByPlaceholder('Cari metode pembayaran...').fill('Cash')

		await expect(page).toHaveURL(/[?&]q=Cash/)
		await expect(page.getByRole('row').filter({ hasText: 'Cash' }).first()).toBeVisible()
	})

	/** Edit an existing payment method */
	test('can edit a payment method via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await page.getByPlaceholder('Cari metode pembayaran...').fill('DEBIT')
		await expect(page).toHaveURL(/[?&]q=DEBIT/u)

		const row = page.getByRole('row').filter({ hasText: 'DEBIT' })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page).toHaveURL(/\/master\/payment-methods\/\d+$/)
		await expect(page.getByRole('heading', { name: 'Ubah Metode Pembayaran' })).toBeVisible()

		const nameField = page.getByLabel('Nama', { exact: true })
		await nameField.clear()
		await nameField.fill('Kartu Debit')

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Metode pembayaran berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a payment method via action menu */
	test('can delete a payment method via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `HAPUS-E2E-${suffix}`

		await page.goto('/master/payment-methods/new')
		await page.getByLabel('Kode').fill(code)
		await page.getByLabel('Nama', { exact: true }).fill('Metode Hapus E2E')
		await page.getByRole('button', { name: 'Buat' }).click()
		await expect(page.getByText('Metode pembayaran berhasil dibuat.')).toBeVisible()
		await expect(page).toHaveURL(/\/master\/payment-methods(\?.*)?$/)

		await page.getByPlaceholder('Cari metode pembayaran...').fill(code)
		await expect(page).toHaveURL(new RegExp(`[?&]q=${code}`))

		const row = page.getByRole('row').filter({ hasText: code })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		const dialog = page.locator('[data-slot="dialog-content"]')
		await expect(dialog).toBeVisible()
		await expect(dialog.getByRole('heading', { name: 'Hapus metode pembayaran?' })).toBeVisible()
		await dialog.getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Metode pembayaran berhasil dihapus.')).toBeVisible()
	})

	/** Validation: name must be at least 3 characters */
	test('shows a validation error for a short name', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods/new')

		await page.getByLabel('Kode').fill('TEST')
		await page.getByLabel('Nama', { exact: true }).fill('ab')
		await page.getByLabel('Nama', { exact: true }).press('Tab')

		await expect(page.getByText('Nama minimal 3 karakter')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Buat' })).toBeDisabled()
	})
})
