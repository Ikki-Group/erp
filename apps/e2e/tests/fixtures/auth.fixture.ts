import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { TEST_CREDENTIALS } from '../helpers/test-data'

/** Sign in through the real login form and wait until the app shell is up. */
export async function loginViaUi(
	page: Page,
	username: string = TEST_CREDENTIALS.owner.username,
	password: string = TEST_CREDENTIALS.owner.password,
): Promise<void> {
	await page.goto('/login')
	await page.getByLabel('Nama pengguna').fill(username)
	await page.getByLabel('Kata sandi', { exact: true }).fill(password)
	await page.getByRole('button', { name: 'Masuk ke ruang kerja' }).click()
	// Login = bcrypt (cost 12) + several round-trips to the remote test DB.
	await expect(page).not.toHaveURL(/\/login/u, { timeout: 20_000 })
	// The header (with the location picker) only renders once /auth/me resolved.
	await expect(page.getByText(/^Lokasi aktif: /u)).toBeAttached({ timeout: 20_000 })
}

export type AuthFixture = {
	/** Login as a seeded user (defaults to owner). */
	login: (username?: string, password?: string) => Promise<void>
}

/**
 * Extended test with a `login` fixture that authenticates via the UI.
 * Import this instead of raw `@playwright/test` in all specs.
 */
const test = base.extend<AuthFixture>({
	login: async ({ page }, use) => {
		await use((username, password) => loginViaUi(page, username, password))
	},
})

export { test, expect }
