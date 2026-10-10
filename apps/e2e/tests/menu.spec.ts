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

		await expect(page.getByRole('button', { name: /menu items/iu })).toBeVisible()
		await expect(page.getByRole('button', { name: /modifier groups/iu })).toBeVisible()
	})

	/** Action buttons are visible in header */
	test('shows action buttons in header', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await expect(page.getByRole('button', { name: /kategori/iu })).toBeVisible()
		await expect(page.getByRole('button', { name: /modifier/iu })).toBeVisible()
		await expect(page.getByRole('button', { name: /menu item/iu })).toBeVisible()
	})
})

test.describe('Menu - Category CRUD', () => {
	/** Create a new category */
	test('can create a new category', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /kategori/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/tambah kategori/iu)).toBeVisible()

		await page.getByLabel(/nama kategori/iu).fill('Minuman E2E')
		await page.getByRole('button', { name: /simpan/iu }).click()

		await expect(page.getByText(/berhasil dibuat/iu)).toBeVisible()
	})

	/** Edit an existing category */
	test('can edit a category', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const categoryRow = page.locator('div').filter({ hasText: 'Minuman E2E' }).first()
		await categoryRow
			.getByRole('button')
			.filter({ has: page.locator('svg') })
			.first()
			.click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/edit kategori/iu)).toBeVisible()

		const nameField = page.getByLabel(/nama kategori/iu)
		await nameField.clear()
		await nameField.fill('Minuman Updated')

		await page.getByRole('button', { name: /simpan/iu }).click()

		await expect(page.getByText(/berhasil diperbarui/iu)).toBeVisible()
	})

	/** Delete a category */
	test('can delete a category', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const categoryRow = page.locator('div').filter({ hasText: 'Minuman Updated' }).first()
		const deleteBtn = categoryRow
			.getByRole('button')
			.filter({ has: page.locator('svg') })
			.last()
		await deleteBtn.click()

		await expect(page.getByText(/hapus kategori/iu)).toBeVisible()
		await page.getByRole('button', { name: /hapus/iu }).click()

		await expect(page.getByText(/berhasil dihapus/iu)).toBeVisible()
	})
})

test.describe('Menu - Item CRUD', () => {
	/** Open create dialog for menu item */
	test('opens create dialog when clicking Menu Item button', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /menu item/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/tambah menu item/iu)).toBeVisible()
	})

	/** Create a new menu item */
	test('can create a new menu item', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /menu item/iu }).click()

		await page.getByLabel(/sku/iu).fill('MNU-E2E-001')
		await page.getByLabel(/nama/iu).fill('Es Kopi E2E')
		await page.getByLabel(/harga dasar/iu).fill('25000')

		await page.getByRole('button', { name: /simpan/iu }).click()

		await expect(page.getByText(/berhasil dibuat/iu)).toBeVisible()
	})

	/** Validation error shown for empty required fields */
	test('shows validation errors for empty fields', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /menu item/iu }).click()
		await page.getByRole('button', { name: /simpan/iu }).click()

		await expect(page.getByText(/mohon perbaiki/iu)).toBeVisible()
	})

	/** Edit a menu item via action menu */
	test('can edit a menu item via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText(/edit menu item/iu)).toBeVisible()

		const nameField = page.getByLabel(/nama/iu)
		await nameField.clear()
		await nameField.fill('Es Kopi Updated')

		await page.getByRole('button', { name: /simpan/iu }).click()

		await expect(page.getByText(/berhasil diperbarui/iu)).toBeVisible()
	})

	/** Delete a menu item via action menu */
	test('can delete a menu item via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: /hapus/iu }).click()

		await expect(page.getByText(/hapus menu item/iu)).toBeVisible()
		await page.getByRole('button', { name: /hapus/iu }).click()

		await expect(page.getByText(/berhasil dihapus/iu)).toBeVisible()
	})
})

test.describe('Menu - Modifier Group CRUD', () => {
	/** Switch to modifier tab */
	test('can switch to modifier groups tab', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /modifier groups/iu }).click()

		await expect(page.getByText(/belum ada modifier group|modifier group/iu)).toBeVisible()
	})

	/** Create a modifier group with options */
	test('can create a modifier group with options', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /^modifier$/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText(/tambah modifier group/iu)).toBeVisible()

		await page.getByLabel(/nama group/iu).fill('Level Gula E2E')

		// Fill first option
		const optionInputs = page.getByPlaceholder(/e\.g\. reguler/iu)
		await optionInputs.first().fill('Normal')

		// Add second option
		await page.getByRole('button', { name: /tambah opsi/iu }).click()
		await optionInputs.nth(1).fill('Less Sugar')

		await page.getByRole('button', { name: /simpan/iu }).click()

		await expect(page.getByText(/berhasil dibuat/iu)).toBeVisible()
	})

	/** Edit a modifier group */
	test('can edit a modifier group', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /modifier groups/iu }).click()

		const groupRow = page.locator('div').filter({ hasText: 'Level Gula E2E' }).first()
		await groupRow
			.getByRole('button')
			.filter({ has: page.locator('svg') })
			.first()
			.click()

		await expect(page.getByRole('dialog')).toBeVisible()

		const nameField = page.getByLabel(/nama group/iu)
		await nameField.clear()
		await nameField.fill('Level Gula Updated')

		await page.getByRole('button', { name: /simpan/iu }).click()

		await expect(page.getByText(/berhasil diperbarui/iu)).toBeVisible()
	})

	/** Delete a modifier group */
	test('can delete a modifier group', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')

		await page.getByRole('button', { name: /modifier groups/iu }).click()

		const groupRow = page.locator('div').filter({ hasText: 'Level Gula Updated' }).first()
		const deleteBtn = groupRow
			.getByRole('button')
			.filter({ has: page.locator('svg') })
			.last()
		await deleteBtn.click()

		await expect(page.getByText(/hapus modifier group/iu)).toBeVisible()
		await page.getByRole('button', { name: /hapus/iu }).click()

		await expect(page.getByText(/berhasil dihapus/iu)).toBeVisible()
	})
})
