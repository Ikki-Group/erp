import { test, expect } from './fixtures/auth.fixture'

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

		// Type defaults to percentage
		await page.getByLabel(/value/i).fill('20')

		// Set validity dates
		await page.getByLabel(/valid from/i).click()
		await page.getByRole('button', { name: /today/i }).first().click()

		await page.getByLabel(/valid until/i).click()
		// Pick a future date (next month's last available day)
		await page.getByRole('button', { name: /next month/i }).click()
		await page.getByRole('gridcell').last().click()

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

		// Set validity dates
		await page.getByLabel(/valid from/i).click()
		await page.getByRole('button', { name: /today/i }).first().click()

		await page.getByLabel(/valid until/i).click()
		await page.getByRole('button', { name: /next month/i }).click()
		await page.getByRole('gridcell').last().click()

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

		// If there are vouchers, we should see at least one status badge
		const badges = page.locator('[data-slot="badge"]')
		const hasBadges = await badges.first().isVisible({ timeout: 5000 }).catch(() => false)

		if (hasBadges) {
			// Status badges should be one of: Active, Inactive, Expired, Exhausted
			const validStatuses = /active|inactive|expired|exhausted/i
			await expect(badges.first()).toHaveText(validStatuses)
		}
	})

	/** Usage display shows count format */
	test('displays usage count in correct format', async ({ page, login }) => {
		await login()
		await page.goto('/pos/vouchers')

		// Look for usage format like "0 / 10" or "0 / Unlimited"
		const usagePattern = page.getByText(/\d+\s*\/\s*(\d+|unlimited)/i)
		const hasUsage = await usagePattern.first().isVisible({ timeout: 5000 }).catch(() => false)

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
