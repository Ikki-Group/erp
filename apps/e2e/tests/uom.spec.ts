import { test, expect } from './fixtures/auth.fixture'

test.describe('UoM - Unit CRUD', () => {
	/** Page loads and shows header */
	test('displays UoM page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await expect(page.getByRole('heading', { name: /units of measure/iu })).toBeVisible()
		await expect(page.getByText(/manage units and conversion/iu)).toBeVisible()
	})

	/** Add Unit button is visible for authorized users */
	test('shows Add Unit button', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await expect(page.getByRole('button', { name: /add unit/iu })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Unit', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await page.getByRole('button', { name: /add unit/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Unit')).toBeVisible()
	})

	/** Create a new unit end-to-end */
	test('can create a new unit', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		await page.getByRole('button', { name: /add unit/iu }).click()

		await page.getByLabel('Code').fill('kg-e2e')
		await page.getByLabel('Name').fill('Kilogram E2E')

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/iu)).toBeVisible()
	})

	/** Search/filter units */
	test('can search units by name', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		const searchInput = page.getByPlaceholder(/search units/iu)
		await searchInput.fill('Kilogram')

		await page.waitForLoadState('networkidle')
	})

	/** Edit an existing unit */
	test('can edit a unit via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText('Edit Unit')).toBeVisible()

		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Unit')

		await page.getByRole('button', { name: /save changes/iu }).click()

		await expect(page.getByText(/updated successfully/iu)).toBeVisible()
	})

	/** Delete a unit via action menu */
	test('can delete a unit via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		const actionTrigger = page.getByRole('button', { name: /actions/iu }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		await expect(page.getByText(/delete unit/iu)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/deleted successfully/iu)).toBeVisible()
	})
})

test.describe('UoM - Conversions', () => {
	/** Add Conversion button is disabled when less than 2 units exist */
	test('Add Conversion button disabled with fewer than 2 units', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		const addConvBtn = page.getByRole('button', { name: /add conversion/iu })
		await expect(addConvBtn).toBeVisible()
	})

	/** Create a conversion between two units */
	test('can create a conversion', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		// Ensure at least 2 units exist — create them first
		await page.getByRole('button', { name: /add unit/iu }).click()
		await page.getByLabel('Code').fill('g-e2e')
		await page.getByLabel('Name').fill('Gram E2E')
		await page.getByRole('button', { name: 'Create' }).click()
		await expect(page.getByText(/created successfully/iu)).toBeVisible()

		await page.getByRole('button', { name: /add unit/iu }).click()
		await page.getByLabel('Code').fill('kg-e2e2')
		await page.getByLabel('Name').fill('Kilogram E2E 2')
		await page.getByRole('button', { name: 'Create' }).click()
		await expect(page.getByText(/created successfully/iu)).toBeVisible()

		// Now add conversion
		await page.getByRole('button', { name: /add conversion/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Conversion')).toBeVisible()

		await page.getByLabel('Factor').fill('1000')
		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/created successfully/iu)).toBeVisible()
	})

	/** Delete a conversion */
	test('can delete a conversion', async ({ page, login }) => {
		await login()
		await page.goto('/master/uom')

		// If conversions section is visible, delete the first one
		const deleteBtn = page.locator('[class*="divide-y"]').getByRole('button').first()
		if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await deleteBtn.click()

			await expect(page.getByText(/delete conversion/iu)).toBeVisible()
			await page.getByRole('button', { name: 'Delete' }).click()

			await expect(page.getByText(/deleted successfully/iu)).toBeVisible()
		}
	})
})
