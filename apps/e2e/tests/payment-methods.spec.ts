import { test, expect } from './fixtures/auth.fixture'
import { uid } from './helpers/test-data'
import { expectToast, pickOption, searchList } from './helpers/ui'

test.describe('Payment methods', () => {
	test('create → detail → edit (deactivate)', async ({ page, login }) => {
		const code = `PM${uid()}`
		const name = `E2E Pay ${code}`
		await login()
		await page.goto('/master/payment-methods')
		await page.getByRole('button', { name: 'Add Payment Method' }).click()
		await expect(page).toHaveURL(/\/master\/payment-methods\/new$/u)
		await page.getByRole('textbox', { name: 'Code' }).fill(code)
		await pickOption(page, 'Type', /Digital/iu)
		await page.getByRole('textbox', { name: 'Name' }).fill(name)
		await page.getByRole('button', { name: 'Create' }).click()
		await expectToast(page, /created/iu)

		await page.goto('/master/payment-methods')
		await searchList(page, 'Search payment methods...', code)
		const row = page.getByRole('button', { name: new RegExp(`^${code} `, 'u') })
		await expect(row).toContainText('Active')
		await row.click()
		await expect(page).toHaveURL(/\/master\/payment-methods\/\d+$/u)
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

		await page.getByRole('button', { name: 'Edit', exact: true }).click()
		await page.getByRole('switch', { name: 'Active' }).click()
		await page.getByRole('button', { name: 'Save Changes' }).click()
		await expectToast(page, /updated/iu)
		await expect(page).toHaveURL(/\/master\/payment-methods\/\d+$/u)
		await expect(page.getByText('Inactive', { exact: true })).toBeVisible()
	})
})
