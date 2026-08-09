import { test, expect } from './fixtures/auth.fixture'

test.describe('POS Shifts - Open/Close', () => {
	/** Page loads and shows header */
	test('displays shifts page with header', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await expect(page.getByRole('heading', { name: 'Shifts' })).toBeVisible()
		await expect(page.getByText(/manage cashier shifts/i)).toBeVisible()
	})

	/** Open Shift button is visible when no active shift */
	test('shows Open Shift button when no active shift', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await expect(page.getByRole('button', { name: /open shift/i })).toBeVisible()
	})

	/** Opening shift dialog */
	test('opens shift dialog when clicking Open Shift', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await page.getByRole('button', { name: /open shift/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Open Shift')).toBeVisible()
		await expect(page.getByLabel(/opening cash/i)).toBeVisible()
	})

	/** Open a shift end-to-end */
	test('can open a shift with starting cash', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await page.getByRole('button', { name: /open shift/i }).click()

		await page.getByLabel(/opening cash/i).clear()
		await page.getByLabel(/opening cash/i).fill('500000')

		await page.getByRole('button', { name: /open shift/i }).click()

		await expect(page.getByText(/opened successfully/i)).toBeVisible()
	})

	/** Active shift indicator shown + close flow */
	test('shows active indicator and can close shift', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		// Open a shift first to ensure one is active
		const openButton = page.getByRole('button', { name: /open shift/i })
		if (await openButton.isVisible().catch(() => false)) {
			await openButton.click()
			await page.getByLabel(/opening cash/i).clear()
			await page.getByLabel(/opening cash/i).fill('100000')
			await page.getByRole('button', { name: /open shift/i }).click()
			await expect(page.getByText(/opened successfully/i)).toBeVisible()
			await page.goto('/pos/shifts')
		}

		// Verify active indicator
		await expect(page.getByText(/shift active/i)).toBeVisible()

		// Close the shift
		await page.getByRole('button', { name: /close shift/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Close Shift')).toBeVisible()

		await page.getByLabel(/closing cash/i).fill('100000')

		await page.getByRole('button', { name: /close shift/i }).click()

		await expect(page.getByText(/closed successfully/i)).toBeVisible()
	})
})
