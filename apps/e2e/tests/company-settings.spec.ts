import { test, expect } from './fixtures/auth.fixture'

test.describe('Company Settings - View & Edit', () => {
	/** Page loads and shows header */
	test('displays company settings page with header', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		await expect(page.getByRole('heading', { name: /company settings/i })).toBeVisible()
		await expect(page.getByText(/manage your company profile/i)).toBeVisible()
	})

	/** Save button is visible for authorized user */
	test('shows Save Changes button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible()
	})

	/** Form sections are rendered */
	test('renders company info, tax, and receipt sections', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		await expect(page.getByText('Company Info')).toBeVisible()
		await expect(page.getByText('Tax & Currency')).toBeVisible()
		await expect(page.getByText('Receipt')).toBeVisible()
	})

	/** Can fill and save company settings */
	test('can update company settings', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		// Wait for form to be ready
		await expect(page.getByLabel('Company Name')).toBeVisible()

		const nameField = page.getByLabel('Company Name')
		await nameField.clear()
		await nameField.fill('PT. Ikki Test')

		const emailField = page.getByLabel('Email')
		await emailField.clear()
		await emailField.fill('test@ikki.id')

		const taxRateField = page.getByLabel(/tax rate/i)
		await taxRateField.clear()
		await taxRateField.fill('11')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/settings (created|updated)/i)).toBeVisible()
	})

	/** Values persist after page reload */
	test('saved values persist on refresh', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		await expect(page.getByLabel('Company Name')).toBeVisible()

		const nameField = page.getByLabel('Company Name')
		await nameField.clear()
		await nameField.fill('PT. Persist Test')

		await page.getByRole('button', { name: /save changes/i }).click()
		await expect(page.getByText(/settings (created|updated)/i)).toBeVisible()

		await page.reload()

		await expect(page.getByLabel('Company Name')).toHaveValue('PT. Persist Test')
	})

	/** Validation prevents saving invalid tax rate */
	test('shows validation error for invalid tax rate', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		await expect(page.getByLabel('Company Name')).toBeVisible()

		const nameField = page.getByLabel('Company Name')
		await nameField.clear()
		await nameField.fill('PT. Valid Name')

		const taxRateField = page.getByLabel(/tax rate/i)
		await taxRateField.clear()
		await taxRateField.fill('-5')

		await page.getByRole('button', { name: /save changes/i }).click()

		await expect(page.getByText(/invalid/i)).toBeVisible()
	})
})
