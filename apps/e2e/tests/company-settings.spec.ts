import { test, expect } from './fixtures/auth.fixture'

/** Stable name so the parallel update/persist tests don't race on the singleton. */
const COMPANY_NAME = 'PT. Ikki Test'

test.describe('Company Settings - View & Edit', () => {
	/** Overview page loads with the profile and sites sections */
	test('displays company settings overview', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		await expect(page.getByText('Ringkasan perusahaan')).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Profil perusahaan' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Lokasi Usaha' })).toBeVisible()
	})

	/** Edit action is visible for authorized user */
	test('shows Ubah button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company')

		await expect(page.getByRole('button', { name: 'Ubah' })).toBeVisible()
	})

	/** Edit form sections are rendered */
	test('renders company info, tax, and receipt sections', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company/edit')

		await expect(page.getByRole('heading', { name: 'Info Perusahaan' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Pajak & Mata Uang' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Struk' })).toBeVisible()
	})

	/** Can fill and save company settings */
	test('can update company settings', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company/edit')

		await expect(page.getByLabel('Nama Perusahaan')).toBeVisible()

		const nameField = page.getByLabel('Nama Perusahaan')
		await nameField.clear()
		await nameField.fill(COMPANY_NAME)

		const emailField = page.getByLabel('Email')
		await emailField.clear()
		await emailField.fill('test@ikki.id')

		const taxRateField = page.getByLabel(/tarif pajak/iu)
		await taxRateField.clear()
		await taxRateField.fill('11')

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Pengaturan perusahaan berhasil diperbarui.')).toBeVisible()
		await expect(page).toHaveURL(/\/settings\/company$/u)
	})

	/** Values persist after saving and reloading */
	test('saved values persist on refresh', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company/edit')

		await expect(page.getByLabel('Nama Perusahaan')).toBeVisible()

		const nameField = page.getByLabel('Nama Perusahaan')
		await nameField.clear()
		await nameField.fill(COMPANY_NAME)

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
		await expect(page.getByText('Pengaturan perusahaan berhasil diperbarui.')).toBeVisible()

		await page.reload()

		// Saving returns to the overview; reopen the edit form to check the stored value.
		await page.getByRole('button', { name: 'Ubah' }).click()
		await expect(page).toHaveURL(/\/settings\/company\/edit$/u)
		await expect(page.getByLabel('Nama Perusahaan')).toHaveValue(COMPANY_NAME)
	})

	/** Validation prevents saving a negative tax rate */
	test('shows validation error for invalid tax rate', async ({ page, login }) => {
		await login()
		await page.goto('/settings/company/edit')

		await expect(page.getByLabel('Nama Perusahaan')).toBeVisible()

		const nameField = page.getByLabel('Nama Perusahaan')
		await nameField.clear()
		await nameField.fill('PT. Valid Name')

		const taxRateField = page.getByLabel(/tarif pajak/iu)
		await taxRateField.clear()
		await taxRateField.fill('-5')
		await nameField.click()

		await expect(page.getByText(/harus berupa angka desimal positif/iu)).toBeVisible()

		await expect(page).toHaveURL(/\/settings\/company\/edit$/u)
	})
})
