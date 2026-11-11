import { test as base, expect as baseExpect } from '@playwright/test'

import { TEST_CREDENTIALS } from '../helpers/test-data'

export type AuthFixture = {
	/** Login as a seeded user. Defaults to owner. */
	login: (username?: string, password?: string) => Promise<void>
}

/**
 * Extended test with a `login` fixture that authenticates via the UI.
 * Import this instead of raw `@playwright/test` in all authenticated specs.
 */
const test = base.extend<AuthFixture>({
	login: async ({ page }, use) => {
		const loginFn = async (username?: string, password?: string) => {
			await page.goto('/login')

			await page.getByLabel('Username').fill(username ?? TEST_CREDENTIALS.owner.username)
			await page.getByLabel('Password').fill(password ?? TEST_CREDENTIALS.owner.password)
			await page.getByRole('button', { name: 'Masuk' }).click()

			// Wait until redirected away from login
			await baseExpect(page).not.toHaveURL(/\/login/)
		}

		await use(loginFn)
	},
})

const expect = baseExpect

export { test, expect }
