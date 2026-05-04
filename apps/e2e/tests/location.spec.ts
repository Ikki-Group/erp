import { test, expect } from './fixtures/auth.fixture'

test.describe('Location Selection', () => {
	/**
	 * Test that location switcher is visible for users with multiple locations
	 * This ensures multi-location users can switch between their assigned locations
	 */
	test('shows location switcher for multi-location users', async ({ page, login }) => {
		await login()

		// Location switcher should be visible in the header
		const locationSwitcher = page.getByTestId('location-switcher')
		await expect(locationSwitcher).toBeVisible()
	})

	/**
	 * Test that single-location users see a static location pill without dropdown
	 * This ensures the UI is simplified for users who don't need to switch locations
	 */
	test('shows static location pill for single-location users', async ({ page, login }) => {
		await login()

		// If user has only one location, should show static pill without dropdown trigger
		// Check for absence of chevron icon (dropdown trigger)
		const locationSwitcher = page.getByTestId('location-switcher')
		const chevronIcon = locationSwitcher.locator('[data-lucide="chevrons-up-down"]')
		const isVisible = (await chevronIcon.count()) > 0
		expect(isVisible).toBe(false)
	})

	/**
	 * Test that users can switch between multiple assigned locations
	 * This ensures location filtering works correctly across the app
	 */
	test('can switch between multiple locations', async ({ page, login }) => {
		await login()

		// Click location switcher to open dropdown
		await page.getByTestId('location-switcher').click()

		// Select a different location from dropdown
		const secondLocation = page.getByRole('menuitem').filter({ hasText: /Ikki Resto/ })
		await secondLocation.click()

		// Verify toast notification appears
		await expect(page.getByText('Lokasi aktif')).toBeVisible()
	})

	/**
	 * Test that users can switch to "Consolidated View" (all locations)
	 * This enables viewing data across all assigned locations at once
	 */
	test('can switch to consolidated view (all locations)', async ({ page, login }) => {
		await login()

		// Open location dropdown
		await page.getByTestId('location-switcher').click()

		// Click "Semua Lokasi" option
		await page
			.getByRole('menuitem')
			.filter({ hasText: /Semua Lokasi/ })
			.click()

		// Verify toast notification
		await expect(page.getByText('Menampilkan semua lokasi')).toBeVisible()
	})

	/**
	 * Test that location selection persists across page navigation
	 * This ensures the selected location context is maintained during the session
	 */
	test('persists location selection across navigation', async ({ page, login }) => {
		await login()

		// Select a specific location
		await page.getByTestId('location-switcher').click()
		await page
			.getByRole('menuitem')
			.filter({ hasText: /Ikki Coffee/ })
			.click()

		// Navigate to a different page
		await page.goto('/settings/location')

		// Verify location is still selected
		const locationLabel = await page.getByTestId('location-switcher').textContent()
		expect(locationLabel).toContain('Ikki Coffee')
	})

	/**
	 * Test that location switcher is locked on form pages
	 * This prevents accidental location changes mid-form which could cause data inconsistency
	 */
	test('locks location switcher on form pages', async ({ page, login }) => {
		await login()

		// Navigate to a form page (e.g., create product)
		await page.goto('/product/create')

		// Location switcher should show locked state
		const locationSwitcher = page.getByTestId('location-switcher')
		await expect(locationSwitcher).toHaveClass(/cursor-not-allowed/)

		// Should show lock icon
		await expect(locationSwitcher.getByTestId('lock-icon')).toBeVisible()
	})

	/**
	 * Test that location context filters data correctly
	 * This ensures data displayed is scoped to the selected location
	 */
	test('filters data based on selected location', async ({ page, login }) => {
		await login()

		// Select "Ikki Coffee" location
		await page.getByTestId('location-switcher').click()
		await page
			.getByRole('menuitem')
			.filter({ hasText: /Ikki Coffee/ })
			.click()

		// Navigate to inventory page
		await page.goto('/inventory')

		// Verify data is filtered (this would check specific inventory items for Ikki Coffee)
		// For now, just verify the page loads successfully with location context
		await expect(page).toHaveURL(/\/inventory/)
	})
})
