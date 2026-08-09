import { test, expect } from './fixtures/auth.fixture'

test.describe('Menu - Page Load & Location Guard', () => {
	/** Menu page loads and shows header when location is active */
	test('displays menu page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible()
	})

	/** Tab switcher is visible with Items and Modifiers tabs */
	test('shows tab switcher for items and modifiers', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await expect(page.getByRole('button', { name: /menu items/i })).toBeVisible()
		await expect(page.getByRole('button', { name: /modifier groups/i })).toBeVisible()
	})

	/** Action buttons are visible in header */
	test('shows action buttons in header', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await expect(page.getByRole('button', { name: /kategori/i })).toBeVisible()
		await expect(page.getByRole('button', { name: /modifier/i })).toBeVisible()
		await expect(page.getByRole('button', { name: /menu item/i })).toBeVisible()
	})
})

test.describe('Menu - Category CRUD', () => {
	/** Create a new category */
	test('can create a new category', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /kategori/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/tambah kategori/i)).toBeVisible()

		await page.getByLabel(/nama kategori/i).fill('Minuman E2E')
		await page.getByRole('button', { name: /simpan/i }).click()

		await expect(page.getByText(/berhasil dibuat/i)).toBeVisible()
	})

	/** Edit an existing category */
	test('can edit a category', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const categoryRow = page.locator('div').filter({ hasText: 'Minuman E2E' }).first()
		await categoryRow.getByRole('button').filter({ has: page.locator('svg') }).first().click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/edit kategori/i)).toBeVisible()

		const nameField = page.getByLabel(/nama kategori/i)
		await nameField.clear()
		await nameField.fill('Minuman Updated')

		await page.getByRole('button', { name: /simpan/i }).click()

		await expect(page.getByText(/berhasil diperbarui/i)).toBeVisible()
	})

	/** Delete a category */
	test('can delete a category', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const categoryRow = page.locator('div').filter({ hasText: 'Minuman Updated' }).first()
		const deleteBtn = categoryRow.getByRole('button').filter({ has: page.locator('svg') }).last()
		await deleteBtn.click()

		await expect(page.getByText(/hapus kategori/i)).toBeVisible()
		await page.getByRole('button', { name: /hapus/i }).click()

		await expect(page.getByText(/berhasil dihapus/i)).toBeVisible()
	})
})

test.describe('Menu - Item CRUD', () => {
	/** Open create dialog for menu item */
	test('opens create dialog when clicking Menu Item button', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /menu item/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/tambah menu item/i)).toBeVisible()
	})

	/** Create a new menu item */
	test('can create a new menu item', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /menu item/i }).click()

		await page.getByLabel(/sku/i).fill('MNU-E2E-001')
		await page.getByLabel(/nama/i).fill('Es Kopi E2E')
		await page.getByLabel(/harga dasar/i).fill('25000')

		await page.getByRole('button', { name: /simpan/i }).click()

		await expect(page.getByText(/berhasil dibuat/i)).toBeVisible()
	})

	/** Validation error shown for empty required fields */
	test('shows validation errors for empty fields', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /menu item/i }).click()
		await page.getByRole('button', { name: /simpan/i }).click()

		await expect(page.getByText(/mohon perbaiki/i)).toBeVisible()
	})

	/** Edit a menu item via action menu */
	test('can edit a menu item via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText(/edit menu item/i)).toBeVisible()

		const nameField = page.getByLabel(/nama/i)
		await nameField.clear()
		await nameField.fill('Es Kopi Updated')

		await page.getByRole('button', { name: /simpan/i }).click()

		await expect(page.getByText(/berhasil diperbarui/i)).toBeVisible()
	})

	/** Delete a menu item via action menu */
	test('can delete a menu item via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: /hapus/i }).click()

		await expect(page.getByText(/hapus menu item/i)).toBeVisible()
		await page.getByRole('button', { name: /hapus/i }).click()

		await expect(page.getByText(/berhasil dihapus/i)).toBeVisible()
	})
})

test.describe('Menu - Modifier Group CRUD', () => {
	/** Switch to modifier tab */
	test('can switch to modifier groups tab', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /modifier groups/i }).click()

		await expect(page.getByText(/belum ada modifier group|modifier group/i)).toBeVisible()
	})

	/** Create a modifier group with options */
	test('can create a modifier group with options', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /^modifier$/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/tambah modifier group/i)).toBeVisible()

		await page.getByLabel(/nama group/i).fill('Level Gula E2E')

		// Fill first option
		const optionInputs = page.getByPlaceholder(/e\.g\. reguler/i)
		await optionInputs.first().fill('Normal')

		// Add second option
		await page.getByRole('button', { name: /tambah opsi/i }).click()
		await optionInputs.nth(1).fill('Less Sugar')

		await page.getByRole('button', { name: /simpan/i }).click()

		await expect(page.getByText(/berhasil dibuat/i)).toBeVisible()
	})

	/** Edit a modifier group */
	test('can edit a modifier group', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /modifier groups/i }).click()

		const groupRow = page.locator('div').filter({ hasText: 'Level Gula E2E' }).first()
		await groupRow.getByRole('button').filter({ has: page.locator('svg') }).first().click()

		await expect(page.getByRole('dialog')).toBeVisible()

		const nameField = page.getByLabel(/nama group/i)
		await nameField.clear()
		await nameField.fill('Level Gula Updated')

		await page.getByRole('button', { name: /simpan/i }).click()

		await expect(page.getByText(/berhasil diperbarui/i)).toBeVisible()
	})

	/** Delete a modifier group */
	test('can delete a modifier group', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /modifier groups/i }).click()

		const groupRow = page.locator('div').filter({ hasText: 'Level Gula Updated' }).first()
		const deleteBtn = groupRow.getByRole('button').filter({ has: page.locator('svg') }).last()
		await deleteBtn.click()

		await expect(page.getByText(/hapus modifier group/i)).toBeVisible()
		await page.getByRole('button', { name: /hapus/i }).click()

		await expect(page.getByText(/berhasil dihapus/i)).toBeVisible()
	})
})
