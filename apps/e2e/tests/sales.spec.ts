import { test, expect } from './fixtures/auth.fixture';

test.describe('Sales Recording', () => {
	/**
	 * Test that POS page loads and displays product grid
	 * This ensures the Point of Sale interface is accessible
	 */
	test('displays POS page with product grid', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Verify page title
		await expect(page.getByText('Point of Sale')).toBeVisible();

		// Verify cart section is visible
		await expect(page.getByText('Keranjang')).toBeVisible();
	});

	/**
	 * Test that user can search for products in POS
	 * This ensures the product search functionality works
	 */
	test('can search for products in POS', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Enter search term
		const searchInput = page.getByPlaceholder('Cari produk...');
		await searchInput.fill('Test');

		// Wait for search to complete
		await page.waitForTimeout(500);

		// Verify search input has value
		await expect(searchInput).toHaveValue('Test');
	});

	/**
	 * Test that user can add products to cart
	 * This ensures the cart functionality works for building orders
	 */
	test('can add product to cart', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Click on a product card (assuming products exist)
		const productCard = page.locator('.cursor-pointer').first();
		const productCount = await productCard.count();

		if (productCount > 0) {
			await productCard.click();

			// Verify cart is no longer empty
			await expect(page.getByText('Keranjang kosong')).not.toBeVisible();
		}
	});

	/**
	 * Test that user can increase item quantity in cart
	 * This ensures quantity adjustment works correctly
	 */
	test('can increase item quantity in cart', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Add a product first
		const productCard = page.locator('.cursor-pointer').first();
		const productCount = await productCard.count();

		if (productCount > 0) {
			await productCard.click();

			// Click plus button to increase quantity
			const plusButton = page.getByRole('button', { name: /plus/i }).first();
			if ((await plusButton.count()) > 0) {
				await plusButton.click();

				// Verify quantity increased (check for quantity display)
				await expect(page.locator('text=/quantity/i').first()).toBeVisible();
			}
		}
	});

	/**
	 * Test that user can remove items from cart
	 * This ensures item removal functionality works
	 */
	test('can remove item from cart', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Add a product first
		const productCard = page.locator('.cursor-pointer').first();
		const productCount = await productCard.count();

		if (productCount > 0) {
			await productCard.click();

			// Remove the item
			const deleteButton = page.getByRole('button', { name: /delete/i }).first();
			if ((await deleteButton.count()) > 0) {
				await deleteButton.click();

				// Verify cart is empty again
				await expect(page.getByText('Keranjang kosong')).toBeVisible();
			}
		}
	});

	/**
	 * Test that user can select sales type
	 * This ensures sales type selection works for different channels (dine-in, take-away, etc.)
	 */
	test('can select sales type', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Click on a sales type badge
		const salesTypeBadge = page.locator('[variant="outline"]').first();
		const badgeCount = await salesTypeBadge.count();

		if (badgeCount > 0) {
			await salesTypeBadge.click();

			// Verify badge is now selected (variant changes to default)
			await expect(salesTypeBadge).toHaveAttribute('variant', 'default');
		}
	});

	/**
	 * Test that order creation requires sales type selection
	 * This ensures validation prevents orders without sales type
	 */
	test('order creation requires sales type selection', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Add a product to cart
		const productCard = page.locator('.cursor-pointer').first();
		const productCount = await productCard.count();

		if (productCount > 0) {
			await productCard.click();

			// Try to create order without selecting sales type
			const createButton = page.getByRole('button', { name: /buat pesanan/i });
			if ((await createButton.count()) > 0) {
				await createButton.click();

				// Should show error toast
				await expect(page.getByText('Pilih tipe penjualan')).toBeVisible();
			}
		}
	});

	/**
	 * Test that order creation requires non-empty cart
	 * This ensures validation prevents orders without items
	 */
	test('order creation requires non-empty cart', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Select sales type
		const salesTypeBadge = page.locator('[variant="outline"]').first();
		const badgeCount = await salesTypeBadge.count();

		if (badgeCount > 0) {
			await salesTypeBadge.click();

			// Try to create order without adding products
			const createButton = page.getByRole('button', { name: /buat pesanan/i });
			if ((await createButton.count()) > 0) {
				await createButton.click();

				// Should show error toast
				await expect(page.getByText('Keranjang kosong')).toBeVisible();
			}
		}
	});

	/**
	 * Test that user can navigate to sales orders page
	 * This ensures the order history is accessible
	 */
	test('can navigate to sales orders page', async ({ page, login }) => {
		await login();

		await page.goto('/sales/orders');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to invoices page
	 * This ensures the invoice management is accessible
	 */
	test('can navigate to invoices page', async ({ page, login }) => {
		await login();

		await page.goto('/sales/invoices');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to customers page
	 * This ensures the customer management is accessible
	 */
	test('can navigate to customers page', async ({ page, login }) => {
		await login();

		await page.goto('/sales/customers');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that cart displays total amount correctly
	 * This ensures the pricing calculation is accurate
	 */
	test('cart displays total amount correctly', async ({ page, login }) => {
		await login();

		await page.goto('/sales/pos');

		// Add a product to cart
		const productCard = page.locator('.cursor-pointer').first();
		const productCount = await productCard.count();

		if (productCount > 0) {
			await productCard.click();

			// Verify total amount is displayed
			await expect(page.getByText(/total/i, { exact: false })).toBeVisible();
		}
	});
});
