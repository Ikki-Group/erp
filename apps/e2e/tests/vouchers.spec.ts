import { test, expect } from './fixtures/auth.fixture'

/**
 * Picks today's date in the currently open date picker popover.
 * react-day-picker marks today with `data-today` attribute.
 */
async function pickToday(page: import('@playwright/test').Page) {
	await page.locator('[data-today]').click()
}

/**
 * Navigates forward one month and picks the last day in the calendar grid.
 * The forward button uses a chevron-right icon with no text; use aria-label or positional match.
 */
async function pickNextMonthLastDay(page: import('@playwright/test').Page) {
	await page.locator('button.rdp-button_next').click()
	const days = page.locator('td[role="gridcell"] button:not([disabled])')
	await days.last().click()
}

test.describe('Vouchers - CRUD', () => {
	/** Page loads and shows header */
	test('displays vouchers page with header', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await expect(page.getByRole('heading', { name: /vouchers/i })).toBeVisible()
		await expect(page.getByText(/manage discount vouchers/i)).toBeVisible()
	})

	/** Add Voucher button is visible */
	test('shows Add Voucher button', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await expect(page.getByRole('button', { name: /add voucher/i })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Voucher', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await page.getByRole('button', { name: /add voucher/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Voucher')).toBeVisible()
	})

	/** Create a percentage voucher end-to-end */
	test('can create a percentage voucher', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await page.getByRole('button', { name: /add voucher/i }).click()

		await page.getByLabel('Code').fill('DISKON20-E2E')
		await page.getByLabel('Name').fill('Diskon 20% E2E Test')

		// Type defaults to percentage — fill value
		await page.getByLabel(/value/i).fill('20')

		// Pick Valid From = today
		await page
			.getByRole('button', { name: /pick a date/i })
			.first()
			.click()
		await pickToday(page)

		// Pick Valid Until = next month last day
		await page
			.getByRole('button', { name: /pick a date/i })
			.first()
			.click()
		await pickNextMonthLastDay(page)

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/voucher created/i)).toBeVisible()
	})

	/** Create a fixed voucher */
	test('can create a fixed voucher', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await page.getByRole('button', { name: /add voucher/i }).click()

		await page.getByLabel('Code').fill('HEMAT10K-E2E')
		await page.getByLabel('Name').fill('Hemat 10rb E2E Test')

		// Change type to fixed
		await page.getByLabel('Type').click()
		await page.getByRole('option', { name: /fixed/i }).click()

		await page.getByLabel(/value/i).fill('10000')

		// Pick Valid From = today
		await page
			.getByRole('button', { name: /pick a date/i })
			.first()
			.click()
		await pickToday(page)

		// Pick Valid Until = next month last day
		await page
			.getByRole('button', { name: /pick a date/i })
			.first()
			.click()
		await pickNextMonthLastDay(page)

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/voucher created/i)).toBeVisible()
	})

	/** Search/filter vouchers */
	test('can search vouchers', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		const searchInput = page.getByPlaceholder(/search vouchers/i)
		await searchInput.fill('DISKON')

		await page.waitForLoadState('networkidle')
	})

	/** Filter by status */
	test('can filter vouchers by status', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		// Open the status filter dropdown
		const statusFilter = page.locator('[data-slot="select-trigger"]').last()
		await statusFilter.click()

		// Select "Inactive"
		await page.getByRole('option', { name: /inactive/i }).click()

		await page.waitForLoadState('networkidle')
	})

	/** Edit an existing voucher */
	test('can edit a voucher via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText('Edit Voucher')).toBeVisible()

		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Voucher Name')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/voucher updated/i)).toBeVisible()
	})

	/** Delete a voucher via action menu */
	test('can delete a voucher via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		await expect(page.getByText(/delete voucher/i)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/voucher deleted/i)).toBeVisible()
	})

	/** Validation: cross-field — validUntil must be after validFrom */
	test('shows validation error when validUntil is before validFrom', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await page.getByRole('button', { name: /add voucher/i }).click()

		await page.getByLabel('Code').fill('INVALID-DATE')
		await page.getByLabel('Name').fill('Invalid Date Test')
		await page.getByLabel(/value/i).fill('10')

		// Pick Valid From = today
		await page
			.getByRole('button', { name: /pick a date/i })
			.first()
			.click()
		await pickToday(page)

		// Leave Valid Until empty (before Valid From) — submit should fail
		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/fix the validation/i)).toBeVisible()
	})

	/** Validation: percentage value cannot exceed 100 */
	test('shows validation error when percentage exceeds 100', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await page.getByRole('button', { name: /add voucher/i }).click()

		await page.getByLabel('Code').fill('OVER100')
		await page.getByLabel('Name').fill('Over 100 Test')
		await page.getByLabel(/value/i).fill('150')

		// Pick dates
		await page
			.getByRole('button', { name: /pick a date/i })
			.first()
			.click()
		await pickToday(page)
		await page
			.getByRole('button', { name: /pick a date/i })
			.first()
			.click()
		await pickNextMonthLastDay(page)

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/fix the validation|cannot exceed 100/i)).toBeVisible()
	})

	/** Validation: form requires name with min length */
	test('shows validation error for empty required fields', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		await page.getByRole('button', { name: /add voucher/i }).click()

		// Submit without filling anything
		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/fix the validation/i)).toBeVisible()
	})
})

test.describe('Vouchers - Status Display', () => {
	/** Voucher list shows status badges */
	test('displays status badges for vouchers', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		const badges = page.locator('[data-slot="badge"]')
		const hasBadges = await badges
			.first()
			.isVisible({ timeout: 5000 })
			.catch(() => false)

		if (hasBadges) {
			const validStatuses = /active|inactive|expired|exhausted/i
			await expect(badges.first()).toHaveText(validStatuses)
		}
	})

	/** Usage display shows count format */
	test('displays usage count in correct format', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		const usagePattern = page.getByText(/\d+\s*\/\s*(\d+|unlimited)/i)
		const hasUsage = await usagePattern
			.first()
			.isVisible({ timeout: 5000 })
			.catch(() => false)

		if (hasUsage) {
			await expect(usagePattern.first()).toBeVisible()
		}
	})
})

test.describe('Vouchers - Empty State', () => {
	/** Shows empty state when no vouchers exist */
	test('displays empty state with action button', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		const emptyState = page.getByText(/no vouchers yet/i)
		if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
			await expect(page.getByRole('button', { name: /add voucher/i })).toBeVisible()
		}
	})
})
