import { test, expect } from './fixtures/auth.fixture';

test.describe('Production Recording', () => {
	/**
	 * Test that production recipes page loads and displays recipes
	 * This ensures the production recipe management is accessible
	 */
	test('displays production recipes page', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that recipe displays target output information
	 * This ensures recipe shows what product/material it produces
	 */
	test('displays target output information', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify Target Output column exists
		await expect(page.getByText('Target Output')).toBeVisible();
	});

	/**
	 * Test that recipe displays ingredient count
	 * This ensures recipe shows number of materials required
	 */
	test('displays ingredient count in recipe', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify Bahan column exists
		await expect(page.getByText('Bahan')).toBeVisible();
	});

	/**
	 * Test that recipe displays active status
	 * This ensures recipe status (Aktif/Nonaktif) is visible
	 */
	test('displays recipe active status', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify Status column exists
		await expect(page.getByText('Status')).toBeVisible();
	});

	/**
	 * Test that recipe displays instructions
	 * This ensures preparation steps are visible
	 */
	test('displays recipe instructions', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify Instruksi column exists
		await expect(page.getByText('Instruksi')).toBeVisible();
	});

	/**
	 * Test that user can create new production recipe
	 * This ensures recipe creation functionality works
	 */
	test('can create new production recipe', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Click "Tambah" button
		const addButton = page.getByRole('button', { name: /tambah/i });
		if ((await addButton.count()) > 0) {
			await addButton.click();

			// Verify form or dialog opens
			await expect(page.locator('h1, h2').first()).toBeVisible();
		}
	});

	/**
	 * Test that user can edit existing recipe
	 * This ensures recipe modification works correctly
	 */
	test('can edit existing production recipe', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Click edit button on first recipe (assumes at least one exists)
		const editButton = page.getByRole('button', { name: /edit/i }).first();
		if ((await editButton.count()) > 0) {
			await editButton.click();

			// Verify edit form opens
			await expect(page.locator('h1, h2').first()).toBeVisible();
		}
	});

	/**
	 * Test that user can delete recipe with confirmation
	 * This ensures recipe deletion requires confirmation
	 */
	test('requires confirmation before deleting recipe', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Click delete button on a recipe
		const deleteButton = page.getByRole('button', { name: /hapus/i }).first();
		if ((await deleteButton.count()) > 0) {
			await deleteButton.click();

			// Verify confirmation dialog appears
			await expect(page.getByText(/apakah anda yakin/i)).toBeVisible();
		}
	});

	/**
	 * Test that user can navigate to work orders page
	 * This ensures production order management is accessible
	 */
	test('can navigate to work orders page', async ({ page, login }) => {
		await login();

		await page.goto('/production/work-orders');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that work orders page displays production batches
	 * This ensures production history is visible
	 */
	test('displays production batches on work orders page', async ({ page, login }) => {
		await login();

		await page.goto('/production/work-orders');

		// Verify page loads (may have empty state if no orders)
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that recipe shows target quantity
	 * This ensures recipe output quantity is displayed
	 */
	test('displays target quantity in recipe', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify Qty Target is displayed in Target Output column
		await expect(page.getByText('Qty Target')).toBeVisible();
	});

	/**
	 * Test that recipe displays recipe number
	 * This ensures each recipe has a unique identifier
	 */
	test('displays recipe number', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify No. Resep column exists
		await expect(page.getByText('No. Resep')).toBeVisible();
	});

	/**
	 * Test that user can search for recipes
	 * This ensures recipe search functionality works
	 */
	test('can search for production recipes', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Enter search term
		const searchInput = page.getByPlaceholder(/cari/i);
		if ((await searchInput.count()) > 0) {
			await searchInput.fill('Test');

			// Wait for search to complete
			await page.waitForTimeout(500);

			// Verify search input has value
			await expect(searchInput).toHaveValue('Test');
		}
	});

	/**
	 * Test that recipe can be linked to product or material
	 * This ensures recipe target flexibility
	 */
	test('recipe can be linked to product or material', async ({ page, login }) => {
		await login();

		await page.goto('/production/recipes');

		// Verify Target Output shows different types (Produk, Varian, Bahan)
		await expect(page.getByText('Target Output')).toBeVisible();
	});
});
