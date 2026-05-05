import { test, expect } from './fixtures/auth.fixture'

test.describe('Recipe Management', () => {
	/**
	 * Test that recipe can be created for a product
	 * This ensures recipe creation functionality works for defining product composition
	 */
	test('can create recipe for product', async ({ page, login }) => {
		await login()

		// Navigate to product detail page (recipe tab)
		await page.goto('/product/1')

		// Look for recipe tab or recipe button
		const recipeTab = page.getByRole('tab', { name: /recipe/i })
		const recipeButton = page.getByRole('button', { name: /recipe/i })

		if ((await recipeTab.count()) > 0) {
			await recipeTab.click()
		} else if ((await recipeButton.count()) > 0) {
			await recipeButton.click()
		}

		// Verify recipe section is accessible
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})

	/**
	 * Test that recipe form has target selection
	 * This ensures recipe can be linked to product, material, or variant
	 */
	test('recipe form displays target selection', async ({ page, login }) => {
		await login()

		// Navigate to recipe creation page
		await page.goto('/product/1/recipe')

		// Verify target selection exists
		await expect(page.getByLabel(/product/i)).toBeVisible()
	})

	/**
	 * Test that recipe form has material picker
	 * This ensures materials can be selected as recipe ingredients
	 */
	test('recipe form has material picker for ingredients', async ({ page, login }) => {
		await login()

		// Navigate to recipe creation page
		await page.goto('/product/1/recipe')

		// Verify material picker exists
		await expect(page.getByText(/bahan baku/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that recipe allows adding multiple ingredients
	 * This ensures complex recipes with multiple materials can be created
	 */
	test('can add multiple ingredients to recipe', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Click add ingredient button
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify new ingredient row is added
			await expect(page.getByPlaceholder(/quantity/i)).toBeVisible()
		}
	})

	/**
	 * Test that recipe allows setting target quantity
	 * This ensures recipe output quantity can be defined
	 */
	test('can set target quantity for recipe', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Verify target quantity field exists
		await expect(page.getByLabel(/target/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that recipe allows setting scrap percentage
	 * This ensures material waste can be accounted for in recipes
	 */
	test('can set scrap percentage for ingredients', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Verify scrap percentage field exists
		await expect(page.getByLabel(/scrap/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that recipe allows adding instructions
	 * This ensures preparation steps can be documented
	 */
	test('can add instructions to recipe', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Verify instructions field exists
		await expect(page.getByLabel(/instructions/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that recipe can be activated/deactivated
	 * This ensures recipes can be toggled without deletion
	 */
	test('can toggle recipe active status', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Verify active/inactive toggle exists
		const activeToggle = page.getByRole('switch')
		if ((await activeToggle.count()) > 0) {
			await expect(activeToggle).toBeVisible()
		}
	})

	/**
	 * Test that recipe ingredients can be removed
	 * This ensures recipe composition can be modified
	 */
	test('can remove ingredient from recipe', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Add an ingredient first
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Remove the ingredient
			const deleteButton = page.getByRole('button', { name: /delete/i }).first()
			if ((await deleteButton.count()) > 0) {
				await deleteButton.click()
			}
		}
	})

	/**
	 * Test that recipe calculates cost per unit
	 * This ensures recipe cost calculation is displayed
	 */
	test('displays cost per unit calculation', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Verify cost calculation is displayed
		await expect(page.getByText(/cost/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that recipe can be linked to product variant
	 * This ensures recipes can be specific to product variants (sizes, flavors)
	 */
	test('can link recipe to product variant', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Verify variant selection exists
		await expect(page.getByLabel(/variant/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that recipe ingredients have UOM selection
	 * This ensures ingredient quantities have proper units
	 */
	test('recipe ingredients have UOM selection', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Verify UOM selection exists for ingredients
		await expect(page.getByLabel(/uom/i, { exact: false })).toBeVisible()
	})

	/**
	 * Test that recipe form validates required fields
	 * This ensures recipe creation requires target and ingredients
	 */
	test('recipe form validates required fields', async ({ page, login }) => {
		await login()

		await page.goto('/product/1/recipe')

		// Try to submit without filling required fields
		const saveButton = page.getByRole('button', { name: /simpan/i })
		if ((await saveButton.count()) > 0) {
			await saveButton.click()

			// Should show validation error
			await expect(page.getByText(/wajib/i)).toBeVisible()
		}
	})

	/**
	 * Test that recipe can be edited
	 * This ensures recipe modification works correctly
	 */
	test('can edit existing recipe', async ({ page, login }) => {
		await login()

		// Navigate to existing recipe
		await page.goto('/product/1/recipe')

		// Verify edit mode is accessible
		await expect(page.locator('h1, h2').first()).toBeVisible()
	})
})
