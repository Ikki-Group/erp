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

	/** Active shift indicator shown after opening */
	test('shows active shift indicator after opening', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await expect(page.getByText(/shift active/i)).toBeVisible()
	})

	/** Close shift dialog shows expected cash */
	test('can close an active shift', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await page.getByRole('button', { name: /close shift/i }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Close Shift')).toBeVisible()

		await page.getByLabel(/closing cash/i).fill('500000')

		await page.getByRole('button', { name: /close shift/i }).click()

		await expect(page.getByText(/closed successfully/i)).toBeVisible()
	})
})
