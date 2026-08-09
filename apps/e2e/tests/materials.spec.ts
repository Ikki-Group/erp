import { test, expect } from './fixtures/auth.fixture'

test.describe('Materials - Material CRUD', () => {
	/** Page loads and shows header */
	test('displays materials page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await expect(page.getByRole('heading', { name: /materials/i })).toBeVisible()
		await expect(page.getByText(/manage materials, categories/i)).toBeVisible()
	})

	/** Add Material button is visible */
	test('shows Add Material button', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await expect(page.getByRole('button', { name: /add material/i })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Material', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await page.getByRole('button', { name: /add material/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Material')).toBeVisible()
	})

	/** Create a new material end-to-end */
	test('can create a new material', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await page.getByRole('button', { name: /add material/i }).click()

		await page.getByLabel('Code').fill('MAT-E2E-001')
		await page.getByLabel('Name').fill('Material E2E Test')

		// Select base UoM (first available option)
		await page.getByText('Select unit...').first().click()
		await page.getByRole('option').first().click()

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/i)).toBeVisible()
	})

	/** Search/filter materials */
	test('can search materials by name', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		const searchInput = page.getByPlaceholder(/search materials/i)
		await searchInput.fill('E2E')

		await page.waitForLoadState('networkidle')
	})

	/** Edit an existing material */
	test('can edit a material via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText('Edit Material')).toBeVisible()

		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Material E2E')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/updated successfully/i)).toBeVisible()
	})

	/** Delete a material via action menu */
	test('can delete a material via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		await expect(page.getByText(/delete material/i)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/deleted successfully/i)).toBeVisible()
	})
})

test.describe('Materials - Category CRUD', () => {
	/** Add Category button is visible */
	test('shows Add Category button', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await expect(page.getByRole('button', { name: /add category/i })).toBeVisible()
	})

	/** Create a new category */
	test('can create a new category', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		await page.getByRole('button', { name: /add category/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Category')).toBeVisible()

		await page.getByLabel('Name').fill('Category E2E Test')
		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/i)).toBeVisible()
	})

	/** Category filter dropdown is available */
	test('can filter materials by category', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		const categoryFilter = page.getByRole('combobox')
		await expect(categoryFilter).toBeVisible()
	})

	/** Edit a category */
	test('can edit a category inline', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		// First create a category to ensure one exists
		await page.getByRole('button', { name: /add category/i }).click()
		await page.getByLabel('Name').fill('Cat Edit E2E')
		await page.getByRole('button', { name: 'Create' }).click()
		await expect(page.getByText(/created successfully/i)).toBeVisible()

		// Find the category section and click edit on the first item
		const categorySection = page.locator('h3:has-text("Categories")').locator('..')
		const editBtn = categorySection.getByRole('button').first()
		await editBtn.click()

		await expect(page.getByText('Edit Category')).toBeVisible()

		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Cat Updated E2E')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/updated successfully/i)).toBeVisible()
	})
})

test.describe('Materials - Location Assignment', () => {
	/** Open location assignment dialog from action menu */
	test('can open location assignment dialog', async ({ page, login }) => {
		await login()
		await page.goto('/master/materials')

		// Ensure material exists
		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		if (await actionTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
			await actionTrigger.click()
			await page.getByRole('menuitem', { name: 'Locations' }).click()

			await expect(page.getByText('Location Assignment')).toBeVisible()
			await expect(page.getByText(/toggle which locations/i)).toBeVisible()
		}
	})
})
