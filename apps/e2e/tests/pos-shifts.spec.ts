import { test, expect } from './fixtures/auth.fixture'

test.describe('POS Shifts - Open/Close', () => {
	/** Page loads and shows header */
	test('displays shifts page with header', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await expect(page.getByRole('heading', { name: 'Shifts' })).toBeVisible()
		await expect(page.getByText(/manage cashier shifts/iu)).toBeVisible()
	})

	/** Open Shift button is visible when no active shift */
	test('shows Open Shift button when no active shift', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await expect(page.getByRole('button', { name: /open shift/iu })).toBeVisible()
	})

	/** Opening shift dialog */
	test('opens shift dialog when clicking Open Shift', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await page.getByRole('button', { name: /open shift/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Open Shift')).toBeVisible()
		await expect(page.getByLabel(/opening cash/iu)).toBeVisible()
	})

	/** Open a shift end-to-end */
	test('can open a shift with starting cash', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await page.getByRole('button', { name: /open shift/iu }).click()

		await page.getByLabel(/opening cash/iu).clear()
		await page.getByLabel(/opening cash/iu).fill('500000')

		await page.getByRole('button', { name: /open shift/iu }).click()

		await expect(page.getByText(/opened successfully/iu)).toBeVisible()
	})

	/** Status filter is reflected in the URL (URL-driven list state) */
	test('reflects the status filter in the URL', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		// Pick a status from the toolbar filter; the choice is pushed to the URL
		// as ?status=… and survives a reload (shareable, refresh-stable).
		await page.getByRole('button', { name: /all status/iu }).click()
		await page.getByRole('option', { name: 'Open' }).click()

		await expect(page).toHaveURL(/[?&]status=open/u)

		await page.reload()
		await expect(page).toHaveURL(/[?&]status=open/u)
	})

	/** Active shift indicator shown + close flow */
	test('shows active indicator and can close shift', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		// Open a shift first to ensure one is active
		const openButton = page.getByRole('button', { name: /open shift/iu })
		if (await openButton.isVisible().catch(() => false)) {
			await openButton.click()
			await page.getByLabel(/opening cash/iu).clear()
			await page.getByLabel(/opening cash/iu).fill('100000')
			await page.getByRole('button', { name: /open shift/iu }).click()
			await expect(page.getByText(/opened successfully/iu)).toBeVisible()
			await page.goto('/pos/shifts')
		}

		// Verify active indicator
		await expect(page.getByText(/shift active/iu)).toBeVisible()

		// Close the shift
		await page.getByRole('button', { name: /close shift/iu }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Close Shift')).toBeVisible()

		await page.getByLabel(/closing cash/iu).fill('100000')

		await page.getByRole('button', { name: /close shift/iu }).click()

		await expect(page.getByText(/closed successfully/iu)).toBeVisible()
	})
})
