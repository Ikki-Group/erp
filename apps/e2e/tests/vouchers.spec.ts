import { test, expect } from './fixtures/auth.fixture'
import type { Page } from '@playwright/test'
import { uniqueSuffix } from './helpers/test-data'

/** Local ISO date (YYYY-MM-DD) matching the calendar's `data-day` attribute. */
function isoDate(date: Date) {
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Opens the labelled date picker and clicks `date`, advancing month by month
 * until the day cell is rendered (react-day-picker keeps `data-day` on the cell).
 */
async function pickDate(page: Page, label: string, date: Date) {
	await page.getByLabel(label).click()
	const popover = page.locator('[data-slot="popover-content"]').filter({ visible: true })
	const cell = popover.locator(`[data-day="${isoDate(date)}"] button`)
	for (let i = 0; i < 12 && !(await cell.isVisible()); i++) {
		await popover
			.getByRole('button', { name: 'Bulan berikutnya' })
			.filter({ visible: true })
			.first()
			.click()
	}
	await cell.click()
}

/** Opens the create page and fills the voucher form, then submits it. */
async function createVoucher(
	page: Page,
	options: { code: string; name: string; type?: 'percentage' | 'fixed'; value?: string },
) {
	const { code, name, type = 'percentage', value = '20' } = options
	await page.goto('/pos/vouchers')
	await page.getByRole('button', { name: 'Tambah Voucher' }).first().click()
	await expect(page.getByRole('heading', { name: 'Tambah Voucher' })).toBeVisible()

	await page.getByLabel('Kode').fill(code)
	await page.getByLabel('Nama', { exact: true }).fill(name)

	if (type === 'fixed') {
		await page.getByLabel('Tipe').click()
		await page.getByRole('option', { name: 'Tetap (Rp)' }).click()
	}

	await page.getByLabel(type === 'percentage' ? 'Nilai (%)' : 'Nilai', { exact: true }).fill(value)

	const today = new Date()
	const future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
	await pickDate(page, 'Berlaku Dari', today)
	await pickDate(page, 'Berlaku Sampai', future)

	await page.getByRole('button', { name: 'Buat' }).click()
	await expect(page.getByText('Voucher berhasil dibuat.')).toBeVisible()
	await expect(page).toHaveURL(/\/pos\/vouchers(\?.*)?$/u)
}

/** Pins the voucher row by searching for its code. */
async function searchVoucher(page: Page, code: string) {
	// Reload the list so a still-committing post-create redirect can't wipe the
	// debounced search navigation.
	await page.goto('/pos/vouchers')
	await page.getByPlaceholder('Cari voucher...').fill(code)
	await expect(page).toHaveURL(/[?&]q=/u)
	const row = page.getByRole('row').filter({ hasText: code })
	await expect(row).toBeVisible()
	return row
}

test.describe('Vouchers - CRUD', () => {
	/** Page loads and shows header */
	test('displays vouchers page with header', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await expect(page.getByRole('heading', { name: 'Voucher' })).toBeVisible()
		await expect(page.getByText('Kelola voucher diskon untuk pembayaran POS.')).toBeVisible()
	})

	/** Tombol Tambah Voucher terlihat */
	test('shows Tambah Voucher button', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await expect(page.getByRole('button', { name: 'Tambah Voucher' }).first()).toBeVisible()
	})

	/** Opening the create page */
	test('opens create page when clicking Tambah Voucher', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await page.getByRole('button', { name: 'Tambah Voucher' }).first().click()

		await expect(page).toHaveURL(/\/pos\/vouchers\/new/)
		await expect(page.getByRole('heading', { name: 'Tambah Voucher' })).toBeVisible()
	})

	/** Create a percentage voucher end-to-end */
	test('can create a percentage voucher', async ({ page, login }) => {
		await login()
		const code = `DISC20-E2E-${uniqueSuffix()}`

		await createVoucher(page, { code, name: `Diskon 20% E2E ${uniqueSuffix()}` })

		await searchVoucher(page, code)
	})

	/** Create a fixed voucher */
	test('can create a fixed voucher', async ({ page, login }) => {
		await login()
		const code = `HEMAT-E2E-${uniqueSuffix()}`

		await createVoucher(page, {
			code,
			name: `Hemat 10rb E2E ${uniqueSuffix()}`,
			type: 'fixed',
			value: '10000',
		})

		await searchVoucher(page, code)
	})

	/** Search/filter vouchers */
	test('can search vouchers', async ({ page, login }) => {
		await login()
		const code = `CARI-E2E-${uniqueSuffix()}`
		await createVoucher(page, { code, name: `Cari Voucher E2E ${uniqueSuffix()}` })

		await searchVoucher(page, code)
	})

	/** Filter by status */
	test('can filter vouchers by status', async ({ page, login }) => {
		await login()
		const code = `FILTER-E2E-${uniqueSuffix()}`
		await createVoucher(page, { code, name: `Filter Voucher E2E ${uniqueSuffix()}` })

		const row = await searchVoucher(page, code)

		await page.getByRole('combobox', { name: 'Status' }).click()
		await page.getByRole('option', { name: 'Nonaktif' }).click()
		await expect(row).toBeHidden()

		await page.getByRole('combobox', { name: 'Status' }).click()
		await page.getByRole('option', { name: 'Aktif', exact: true }).click()
		await expect(row).toBeVisible()
	})

	/** Edit an existing voucher */
	test('can edit a voucher via action menu', async ({ page, login }) => {
		await login()
		const code = `UBAH-E2E-${uniqueSuffix()}`
		await createVoucher(page, { code, name: `Ubah Voucher E2E ${uniqueSuffix()}` })

		const row = await searchVoucher(page, code)
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page.getByRole('heading', { name: 'Ubah Voucher' })).toBeVisible()
		const nameField = page.getByLabel('Nama', { exact: true })
		await nameField.fill(`Voucher Diperbarui ${uniqueSuffix()}`)
		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Voucher berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a voucher via action menu */
	test('can delete a voucher via action menu', async ({ page, login }) => {
		await login()
		const code = `HAPUS-E2E-${uniqueSuffix()}`
		await createVoucher(page, { code, name: `Hapus Voucher E2E ${uniqueSuffix()}` })

		const row = await searchVoucher(page, code)
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Hapus voucher?')).toBeVisible()
		await dialog.getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Voucher berhasil dihapus.')).toBeVisible()
	})

	/** Validation: cross-field — validUntil must be after validFrom */
	test('shows validation error when validUntil is before validFrom', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')
		await page.getByRole('button', { name: 'Tambah Voucher' }).first().click()

		await page.getByLabel('Kode').fill(`INVALID-DATE-${uniqueSuffix()}`)
		await page.getByLabel('Nama', { exact: true }).fill('Uji Tanggal Tidak Valid')
		await page.getByLabel('Nilai (%)', { exact: true }).fill('10')

		const today = new Date()
		const future = new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000)
		await pickDate(page, 'Berlaku Dari', future)
		await pickDate(page, 'Berlaku Sampai', today)

		await page.getByLabel('Kode').click()

		await expect(page.getByText('Harus setelah Berlaku Dari')).toBeVisible()
	})

	/** Validation: percentage value cannot exceed 100 */
	test('shows validation error when percentage exceeds 100', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')
		await page.getByRole('button', { name: 'Tambah Voucher' }).first().click()

		await page.getByLabel('Kode').fill(`OVER100-${uniqueSuffix()}`)
		await page.getByLabel('Nama', { exact: true }).fill('Uji Persentase Berlebih')
		await page.getByLabel('Nilai (%)', { exact: true }).fill('150')

		const today = new Date()
		const future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
		await pickDate(page, 'Berlaku Dari', today)
		await pickDate(page, 'Berlaku Sampai', future)

		await page.getByLabel('Kode').click()

		await expect(page.getByText('Persentase tidak boleh melebihi 100')).toBeVisible()
	})

	/** Validation: form requires name with min length */
	test('shows validation error for empty required fields', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')
		await page.getByRole('button', { name: 'Tambah Voucher' }).first().click()

		await page.getByRole('button', { name: 'Buat' }).click()

		await expect(page.getByText('Kode wajib diisi')).toBeVisible()
		await expect(page.getByText('Nama minimal 3 karakter')).toBeVisible()
		await expect(page.getByText('Berlaku Sampai wajib diisi')).toBeVisible()
	})
})

test.describe('Vouchers - Status Display', () => {
	/** Voucher list shows status badges */
	test('displays status badges for vouchers', async ({ page, login }) => {
		await login()
		const code = `STATUS-E2E-${uniqueSuffix()}`
		await createVoucher(page, { code, name: `Status Voucher E2E ${uniqueSuffix()}` })

		const row = await searchVoucher(page, code)
		await expect(row.getByText('Aktif', { exact: true })).toBeVisible()
	})

	/** Usage display shows count format */
	test('displays usage count in correct format', async ({ page, login }) => {
		await login()
		const code = `USAGE-E2E-${uniqueSuffix()}`
		await createVoucher(page, { code, name: `Usage Voucher E2E ${uniqueSuffix()}` })

		const row = await searchVoucher(page, code)
		await expect(row.getByText('0 / Tanpa Batas')).toBeVisible()
	})
})

test.describe('Vouchers - Empty State', () => {
	/** Shows empty state when no vouchers exist */
	test('displays empty state with action button', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		const emptyState = page.getByText('Belum ada voucher')
		if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
			await expect(page.getByRole('button', { name: 'Tambah Voucher' }).first()).toBeVisible()
		}
	})
})
