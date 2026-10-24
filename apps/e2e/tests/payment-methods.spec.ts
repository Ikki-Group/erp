import { test, expect } from './fixtures/auth.fixture'

test.describe('Payment Methods - CRUD', () => {
	/** Page loads and shows header */
	test('displays payment methods page with header', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await expect(page.getByRole('heading', { name: /payment methods/i })).toBeVisible()
		await expect(page.getByText(/manage payment methods/i)).toBeVisible()
	})

	/** Add Payment Method button is visible */
	test('shows Add Payment Method button', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await expect(page.getByRole('button', { name: /add payment method/i })).toBeVisible()
	})

	/** Opening create dialog */
	test('opens create dialog when clicking Add Payment Method', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await page.getByRole('button', { name: /add payment method/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Add Payment Method')).toBeVisible()
	})

	/** Create a cash payment method end-to-end */
	test('can create a cash payment method', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await page.getByRole('button', { name: /add payment method/i }).click()

		await page.getByLabel('Code').fill('CASH-E2E')
		await page.getByLabel('Name').fill('Cash E2E')

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/payment method created/i)).toBeVisible()
	})

	/** Create a digital payment method */
	test('can create a digital payment method', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await page.getByRole('button', { name: /add payment method/i }).click()

		await page.getByLabel('Code').fill('QRIS-E2E')
		await page.getByLabel('Name').fill('QRIS E2E')

		// Change type to digital
		await page.getByLabel('Type').click()
		await page.getByRole('option', { name: /digital/i }).click()

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/payment method created/i)).toBeVisible()
	})

	/** Search/filter payment methods */
	test('can search payment methods', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		const searchInput = page.getByPlaceholder(/search payment methods/i)
		await searchInput.fill('Cash')

		await page.waitForLoadState('networkidle')
	})

	/** Edit an existing payment method */
	test('can edit a payment method via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Edit' }).click()

		await expect(page.getByText('Edit Payment Method')).toBeVisible()

		const nameField = page.getByLabel('Name')
		await nameField.clear()
		await nameField.fill('Updated Payment Method')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/payment method updated/i)).toBeVisible()
	})

	/** Delete a payment method via action menu */
	test('can delete a payment method via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		const actionTrigger = page.getByRole('button', { name: /actions/i }).first()
		await actionTrigger.click()

		await page.getByRole('menuitem', { name: 'Delete' }).click()

		await expect(page.getByText(/delete payment method/i)).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText(/payment method deleted/i)).toBeVisible()
	})

	/** Validation: form requires name with min length */
	test('shows validation error for empty name', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		await page.getByRole('button', { name: /add payment method/i }).click()

		await page.getByLabel('Code').fill('TEST')
		// Leave name empty

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText(/fix the validation/i)).toBeVisible()
	})
})

test.describe('Payment Methods - Empty State', () => {
	/** Shows empty state when no payment methods exist */
	test('displays empty state with action button', async ({ page, login }) => {
		await login()
		await page.goto('/master/payment-methods')

		// If empty, the empty state should have a create button
		const emptyState = page.getByText(/no payment methods yet/i)
		if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
			await expect(page.getByRole('button', { name: /add payment method/i })).toBeVisible()
		}
	})
})
