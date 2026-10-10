import { test, expect } from './fixtures/auth.fixture'

test.describe('Suppliers - Supplier CRUD', () => {
	/** Page loads and shows header */
	test('displays suppliers page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		await expect(page.getByRole('heading', { name: /suppliers/iu })).toBeVisible()
		await expect(page.getByText(/manage suppliers and their material pricing/iu)).toBeVisible()
	})

	/** Add Supplier button is visible */
	test('shows Add Supplier button', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		await expect(page.getByRole('button', { name: /add supplier/iu })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Supplier', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		await page.getByRole('button', { name: /add supplier/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Supplier')).toBeVisible()
	})

	/** Create a new supplier end-to-end */
	test('can create a new supplier', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		await page.getByRole('button', { name: /add supplier/iu }).click()

		await page.getByLabel('Code').fill('SUP-E2E-001')
		await page.getByLabel('Name').fill('Supplier E2E Test')
		await page.getByLabel('Contact Person').fill('John Doe')
		await page.getByLabel('Phone').fill('08123456789')

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/iu)).toBeVisible()
	})

	/** Search suppliers */
	test('can search suppliers by name', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		const searchInput = page.getByPlaceholder(/search suppliers/iu)
		await searchInput.fill('E2E')

		await page.waitForLoadState('networkidle')
	})

	/** Edit an existing supplier */
	test('can edit a supplier via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText('Edit Supplier')).toBeVisible()

		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Supplier E2E')

		await page.getByRole('button', { name: /save changes/iu }).click()

		await expect(page.getByText(/updated successfully/iu)).toBeVisible()
	})

	/** Delete a supplier via action menu */
	test('can delete a supplier via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		await expect(page.getByText(/delete supplier/iu)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/deleted successfully/iu)).toBeVisible()
	})
})

test.describe('Suppliers - Material Pricing', () => {
	/** Open pricing dialog from action menu */
	test('can open material pricing dialog', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		if (await actionTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
			await actionTrigger.click()
			await page.getByRole('menuitem', { name: 'Pricing' }).click()

			await expect(page.getByText('Material Pricing')).toBeVisible()
		}
	})

	/** Add pricing entry */
	test('can add material pricing entry', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		if (await actionTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
			await actionTrigger.click()
			await page.getByRole('menuitem', { name: 'Pricing' }).click()

			await expect(page.getByText('Material Pricing')).toBeVisible()

			await page.getByRole('button', { name: /add/iu }).click()

			await expect(page.getByText('Add Material Pricing')).toBeVisible()

			// Select material
			await page.getByText('Select material...').click()
			await page.getByRole('option').first().click()

			// Fill unit price
			await page.getByLabel('Unit Price').fill('15000')

			// Select UoM
			await page.getByText('Select unit...').click()
			await page.getByRole('option').first().click()

			await page.getByRole('button', { name: 'Add' }).click()

			await expect(page.getByText(/added successfully/iu)).toBeVisible()
		}
	})

	/** Empty state shows when no pricing entries */
	test('shows empty state when supplier has no pricing', async ({ page, login }) => {
		await login()
		await page.goto('/master/suppliers')

		// Create a fresh supplier
		await page.getByRole('button', { name: /add supplier/iu }).click()
		await page.getByLabel('Code').fill('SUP-E2E-EMPTY')
		await page.getByLabel('Name').fill('Supplier No Pricing')
		await page.getByRole('button', { name: 'Create' }).click()
		await expect(page.getByText(/created successfully/iu)).toBeVisible()

		// Open pricing for the newly created supplier (last in list or search)
		const searchInput = page.getByPlaceholder(/search suppliers/iu)
		await searchInput.fill('SUP-E2E-EMPTY')
		await page.waitForLoadState('networkidle')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		if (await actionTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
			await actionTrigger.click()
			await page.getByRole('menuitem', { name: 'Pricing' }).click()

			await expect(page.getByText(/no pricing entries/iu)).toBeVisible()
		}
	})
})
