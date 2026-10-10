import { test, expect, loginViaUi } from './fixtures/auth.fixture'
import { SEED, uid } from './helpers/test-data'
import { expectToast, pickOption } from './helpers/ui'

test.describe('Access control', () => {
	test('create a location-scoped user who can then sign in to that location only', async ({
		page,
		login,
		browser,
	}) => {
		const username = `e2e-${uid().toLowerCase()}`
		const password = 'password123'
		await login()
		await page.getByRole('link', { name: 'Access Control' }).click()
		await page.getByRole('button', { name: 'Add User' }).click()
		await expect(page).toHaveURL(/\/settings\/users\/new$/u)

		await page.getByRole('textbox', { name: 'Username' }).fill(username)
		await page.getByRole('textbox', { name: 'Email' }).fill(`${username}@example.test`)
		await page.getByRole('textbox', { name: 'Full name' }).fill('Uji Gudang')
		await page.getByRole('textbox', { name: 'Password' }).fill(password)
		await page.getByRole('radio', { name: /^Selected locations/u }).check()
		await page.getByRole('button', { name: 'Add location' }).click()
		await pickOption(page, 'Location', SEED.warehouse.name)
		await pickOption(page, 'Role', 'Warehouse Staff')
		await page.getByRole('button', { name: 'Create' }).click()
		await expectToast(page, /created/iu)

		await page.goto('/settings/access-control')
		await page
			.getByRole('searchbox', { name: 'Search by username, name, or email...' })
			.fill(username)
		await expect(
			page.getByRole('button', { name: new RegExp(`^${username} `, 'u') }),
		).toContainText('Warehouse Staff')

		// The new user signs in (separate session) and only gets the warehouse.
		const context = await browser.newContext()
		const userPage = await context.newPage()
		await loginViaUi(userPage, username, password)
		const rollup = userPage.getByRole('table')
		await expect(
			rollup.getByRole('row', { name: new RegExp(SEED.warehouse.name, 'u') }),
		).toBeVisible()
		await expect(rollup.getByRole('row', { name: new RegExp(SEED.store.name, 'u') })).toHaveCount(0)
		await context.close()
	})

	test('create a role with a permission group', async ({ page, login }) => {
		const code = `e2e_${uid().toLowerCase()}`
		const name = `E2E Role ${code}`
		await login()
		await page.goto('/settings/access-control')
		await page.getByRole('tab', { name: /^Roles/u }).click()
		await page.getByRole('button', { name: 'Add Role' }).click()
		await expect(page).toHaveURL(/\/settings\/roles\/new$/u)

		await page.getByRole('textbox', { name: 'Code' }).fill(code)
		await page.getByRole('textbox', { name: 'Name' }).fill(name)
		// Description looks optional but an empty one fails client-side DTO validation silently (app bug).
		await page.getByRole('textbox', { name: 'Description' }).fill('Created by E2E')
		await page.getByRole('checkbox', { name: 'Company', exact: true }).check()
		await expect(page.getByText('2/75 selected')).toBeVisible()
		await page.getByRole('button', { name: 'Create' }).click()
		await expectToast(page, /created/iu)

		await page.goto('/settings/access-control?tab=roles')
		await page.getByRole('button', { name: new RegExp(name, 'u') }).click()
		await expect(page).toHaveURL(/\/settings\/roles\/\d+(\?|$)/u)
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
	})
})
