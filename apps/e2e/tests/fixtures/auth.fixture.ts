import { test as base, expect as baseExpect } from '@playwright/test'

import { SEED, TEST_CREDENTIALS } from '../helpers/test-data'

export type AuthFixture = {
	/** Login as a seeded user. Defaults to owner, then activates the seed store. */
	login: (username?: string, password?: string) => Promise<void>
	/** Switch the active location through the header switcher. */
	selectLocation: (name: string) => Promise<void>
}

/**
 * Extended test with a `login` fixture that authenticates via the UI.
 * Import this instead of raw `@playwright/test` in all authenticated specs.
 */
const test = base.extend<AuthFixture>({
	selectLocation: async ({ page }, use) => {
		const selectFn = async (name: string) => {
			await page
				.getByRole('button', { name: new RegExp(SEED.storeName, 'u') })
				.or(page.getByRole('button', { name: /semua lokasi/i }))
				.click()
			await page.getByRole('menuitem', { name }).click()
			await baseExpect(page.getByRole('button', { name })).toBeVisible()
		}

		await use(selectFn)
	},

	login: async ({ page, selectLocation }, use) => {
		const loginFn = async (username?: string, password?: string) => {
			await page.goto('/login')

			await page.locator('input[name="username"]').fill(username ?? TEST_CREDENTIALS.owner.username)
			await page.locator('input[name="password"]').fill(password ?? TEST_CREDENTIALS.owner.password)
			await page.getByRole('button', { name: 'Masuk' }).click()

			// Wait until redirected away from login
			await baseExpect(page).not.toHaveURL(/\/login/)

			// Location-scoped pages need a concrete location; the default view is
			// the consolidated "Semua Lokasi", which renders empty states.
			await selectLocation(SEED.storeName)
		}

		await use(loginFn)
	},
})

const expect = baseExpect

export { test, expect }
