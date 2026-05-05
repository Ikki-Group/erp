import { test as base, expect as baseExpect } from '@playwright/test'

import { TEST_CREDENTIALS } from '../helpers/test-data'

export type AuthFixture = {
	login: (email?: string, password?: string) => Promise<void>
}

const test = base.extend<AuthFixture>({
	login: async ({ page }, use) => {
		const loginFn = async (email?: string, password?: string) => {
			await page.goto('/login')

			await page.getByLabel('Email').fill(email ?? TEST_CREDENTIALS.superadmin.email)
			await page.getByLabel('Password').fill(password ?? TEST_CREDENTIALS.superadmin.password)
			await page.getByRole('button', { name: 'Masuk' }).click()

			await baseExpect(page).not.toHaveURL(/\/login/)
		}

		await use(loginFn)
	},
})

const expect = baseExpect

export { test, expect }
