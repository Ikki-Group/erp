import { test, expect } from './fixtures/auth.fixture'
import { uid } from './helpers/test-data'
import { expectToast } from './helpers/ui'

test.describe('Company settings', () => {
	test('edit the company profile and it persists', async ({ page, login }) => {
		const phone = `021-${uid().slice(-6)}`
		await login()
		await page.getByRole('link', { name: 'Company' }).click()
		await expect(page.getByRole('heading', { level: 1, name: 'Company Settings' })).toBeVisible()
		await expect(page.getByRole('textbox', { name: 'Company Name' })).toHaveValue(
			'Kedai Kopi Nusantara',
		)

		await page.getByRole('textbox', { name: 'Phone' }).fill(phone)
		await page.getByRole('button', { name: 'Save Changes' }).click()
		await expectToast(page, /updated|saved/iu)

		await page.reload()
		await expect(page.getByRole('textbox', { name: 'Phone' })).toHaveValue(phone)
	})
})
