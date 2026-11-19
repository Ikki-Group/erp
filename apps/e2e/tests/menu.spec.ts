import { test, expect } from './fixtures/auth.fixture'
import { uniqueSuffix } from './helpers/test-data'

/** Pins the row for `text` by typing it into the list search box. */
async function searchRow(page: import('@playwright/test').Page, placeholder: string, text: string) {
	await page.getByPlaceholder(placeholder).fill(text)
	await expect(page).toHaveURL(/[?&]q=/u)
	const row = page.getByRole('row').filter({ hasText: text })
	await expect(row).toBeVisible()
	return row
}

/** Creates a category through the dialog on the menu page and waits for the toast. */
async function createCategory(page: import('@playwright/test').Page, name: string) {
	await page.goto('/master/menu')
	await page.getByRole('button', { name: 'Tambah Kategori' }).click()

	const dialog = page.getByRole('dialog')
	await expect(dialog.getByText('Tambah Kategori')).toBeVisible()
	await dialog.getByLabel('Nama Kategori').fill(name)
	await dialog.getByRole('button', { name: 'Simpan' }).click()

	await expect(page.getByText('Kategori berhasil dibuat.')).toBeVisible()
}

/** Creates a menu item through its full-page form and waits for the toast. */
async function createMenuItem(page: import('@playwright/test').Page, sku: string, name: string) {
	await page.goto('/master/menu')
	await page.getByRole('button', { name: 'Item Menu' }).click()
	await expect(page.getByRole('heading', { name: 'Tambah Item Menu' })).toBeVisible()

	await page.getByLabel('SKU').fill(sku)
	await page.getByLabel('Nama', { exact: true }).fill(name)
	await page.getByLabel('Harga Dasar').fill('25000')
	await page.getByRole('button', { name: 'Simpan' }).click()

	await expect(page.getByText('Item menu berhasil dibuat.')).toBeVisible()
}

/** Creates a modifier group with two options through its full-page form. */
async function createModifierGroup(page: import('@playwright/test').Page, name: string) {
	await page.goto('/master/menu')
	await page.getByRole('tab', { name: 'Grup Modifier' }).click()
	await page.getByRole('button', { name: 'Tambah Grup Modifier' }).click()
	await expect(page.getByRole('heading', { name: 'Tambah Grup Modifier' })).toBeVisible()

	await page.getByLabel('Nama Grup').fill(name)
	await page.getByLabel('Nama', { exact: true }).first().fill('Reguler')
	await page.getByRole('button', { name: 'Tambah Opsi' }).click()
	await page.getByLabel('Nama', { exact: true }).nth(1).fill('Large')
	await page.getByRole('button', { name: 'Simpan' }).click()

	await expect(page.getByText('Grup modifier berhasil dibuat.')).toBeVisible()
}

test.describe('Menu - Page Load & Location Guard', () => {
	/** Menu page loads and shows header when location is active */
	test('displays menu page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible()
	})

	/** Tab switcher is visible with items and modifiers tabs */
	test('shows tab switcher for items and modifiers', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await expect(page.getByRole('tab', { name: 'Item Menu' })).toBeVisible()
		await expect(page.getByRole('tab', { name: 'Grup Modifier' })).toBeVisible()
	})

	/** Create actions are visible for the active tab */
	test('shows action buttons in header', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await expect(page.getByRole('button', { name: 'Item Menu' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Tambah Kategori' })).toBeVisible()

		await page.getByRole('tab', { name: 'Grup Modifier' }).click()
		await expect(page.getByRole('button', { name: 'Tambah Grup Modifier' })).toBeVisible()
	})
})

test.describe('Menu - Category CRUD', () => {
	/** Create a new category */
	test('can create a new category', async ({ page, login }) => {
		await login()
		const name = `Minuman E2E ${uniqueSuffix()}`

		await createCategory(page, name)

		await expect(page.getByRole('button', { name: `Edit kategori ${name}` })).toBeVisible()
	})

	/** Edit an existing category */
	test('can edit a category', async ({ page, login }) => {
		await login()
		const name = `Minuman E2E ${uniqueSuffix()}`
		const updated = `Minuman Updated ${uniqueSuffix()}`

		await createCategory(page, name)
		await page.getByRole('button', { name: `Edit kategori ${name}` }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Ubah Kategori')).toBeVisible()
		await dialog.getByLabel('Nama Kategori').fill(updated)
		await dialog.getByRole('button', { name: 'Simpan' }).click()

		await expect(page.getByText('Kategori berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a category */
	test('can delete a category', async ({ page, login }) => {
		await login()
		const name = `Minuman E2E ${uniqueSuffix()}`

		await createCategory(page, name)
		await page.getByRole('button', { name: `Hapus kategori ${name}` }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Hapus kategori?')).toBeVisible()
		await dialog.getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Kategori berhasil dihapus.')).toBeVisible()
	})
})

test.describe('Menu - Item CRUD', () => {
	/** Menu Item button opens the full-page create form */
	test('opens create page when clicking Item Menu button', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: 'Item Menu' }).click()

		await expect(page).toHaveURL(/\/master\/menu\/items\/new/)
		await expect(page.getByRole('heading', { name: 'Tambah Item Menu' })).toBeVisible()
	})

	/** Create a new menu item */
	test('can create a new menu item', async ({ page, login }) => {
		await login()
		const sku = `MNU-E2E-${uniqueSuffix()}`

		await createMenuItem(page, sku, 'Es Kopi E2E')

		await searchRow(page, 'Cari item menu...', sku)
	})

	/** Validation errors are shown for empty required fields */
	test('shows validation errors for empty fields', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: 'Item Menu' }).click()
		await page.getByRole('button', { name: 'Simpan' }).click()

		await expect(page.getByText('SKU wajib diisi')).toBeVisible()
		await expect(page.getByText('Nama minimal 2 karakter')).toBeVisible()
	})

	/** Edit a menu item via action menu */
	test('can edit a menu item via action menu', async ({ page, login }) => {
		await login()
		const sku = `MNU-E2E-${uniqueSuffix()}`
		await createMenuItem(page, sku, 'Es Kopi E2E')

		const row = await searchRow(page, 'Cari item menu...', sku)
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page.getByRole('heading', { name: 'Ubah Item Menu' })).toBeVisible()
		const nameField = page.getByLabel('Nama', { exact: true })
		await nameField.fill('Es Kopi Updated')
		await page.getByRole('button', { name: 'Simpan' }).click()

		await expect(page.getByText('Item menu berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a menu item via action menu */
	test('can delete a menu item via action menu', async ({ page, login }) => {
		await login()
		const sku = `MNU-E2E-${uniqueSuffix()}`
		await createMenuItem(page, sku, 'Es Kopi E2E')

		const row = await searchRow(page, 'Cari item menu...', sku)
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Hapus item menu?')).toBeVisible()
		await dialog.getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Item menu berhasil dihapus.')).toBeVisible()
	})
})

test.describe('Menu - Modifier Group CRUD', () => {
	/** Switch to modifier tab */
	test('can switch to modifier groups tab', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('tab', { name: 'Grup Modifier' }).click()

		await expect(page.getByRole('heading', { name: 'Grup Modifier' })).toBeVisible()
	})

	/** Create a modifier group with options */
	test('can create a modifier group with options', async ({ page, login }) => {
		await login()
		const name = `Level Gula E2E ${uniqueSuffix()}`

		await createModifierGroup(page, name)

		await searchRow(page, 'Cari modifier group...', name)
	})

	/** Edit a modifier group */
	test('can edit a modifier group', async ({ page, login }) => {
		await login()
		const name = `Level Gula E2E ${uniqueSuffix()}`
		const updated = `Level Gula Updated ${uniqueSuffix()}`
		await createModifierGroup(page, name)

		const row = await searchRow(page, 'Cari modifier group...', name)
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page.getByRole('heading', { name: 'Ubah Grup Modifier' })).toBeVisible()
		await page.getByLabel('Nama Grup').fill(updated)
		await page.getByRole('button', { name: 'Simpan' }).click()

		await expect(page.getByText('Grup modifier berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a modifier group */
	test('can delete a modifier group', async ({ page, login }) => {
		await login()
		const name = `Level Gula E2E ${uniqueSuffix()}`
		await createModifierGroup(page, name)

		const row = await searchRow(page, 'Cari modifier group...', name)
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Hapus modifier group?')).toBeVisible()
		await dialog.getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Grup modifier berhasil dihapus.')).toBeVisible()
	})
})
