import { test, expect } from './fixtures/auth.fixture'

import { uniqueSuffix } from './helpers/test-data'

/** Users live under the tabbed access-control page; the Pengguna tab is the default. */
test.describe('Users - CRUD', () => {
	/** Page loads and shows header */
	test('displays users page with header', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control')

		await expect(page.getByRole('heading', { name: 'Kontrol Akses' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Pengguna' })).toBeVisible()
		await expect(page.getByText('Kelola akun pengguna dan penugasan perannya.')).toBeVisible()
	})

	/** Add User button is visible for authorized users */
	test('shows Add User button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control')

		await expect(page.getByRole('button', { name: 'Tambah Pengguna' })).toBeVisible()
	})

	/** Create is a full-page route, not a dialog */
	test('navigates to the create page when clicking Add User', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control')

		await page.getByRole('button', { name: 'Tambah Pengguna' }).click()

		await expect(page).toHaveURL(/\/settings\/users\/new$/)
		await expect(page.getByRole('heading', { name: 'Tambah Pengguna' })).toBeVisible()
	})

	/** Create a new user end-to-end */
	test('can create a new user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/users/new')

		const username = `e2e_${uniqueSuffix()}`

		await page.getByLabel('Nama pengguna').fill(username)
		await page.getByLabel('Email').fill(`${username}@contoh.com`)
		await page.getByLabel('Nama lengkap').fill('E2E Test User')
		await page.getByLabel('Kata sandi').fill('rahasia123')

		await page.getByRole('button', { name: 'Buat' }).click()

		await expect(page.getByText('Pengguna berhasil dibuat.')).toBeVisible()
		await expect(page).toHaveURL(/\/settings\/access-control/)
	})

	/** Search/filter users (URL-driven) */
	test('can search users by name', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control')

		await page.getByPlaceholder('Cari berdasarkan nama pengguna, nama, atau email...').fill('owner')

		await expect(page).toHaveURL(/[?&]q=owner/)
		await expect(page.getByRole('row').filter({ hasText: 'owner@kedaikopi.id' })).toBeVisible()
	})

	/** View user details via action menu */
	test('can view user details via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control')

		await page.getByPlaceholder('Cari berdasarkan nama pengguna, nama, atau email...').fill('Budi')
		await expect(page).toHaveURL(/[?&]q=Budi/u)

		const row = page.getByRole('row').filter({ hasText: 'Budi Santoso' })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Lihat' }).click()

		await expect(page).toHaveURL(/\/settings\/users\/\d+$/)
		await expect(page.getByRole('heading', { name: 'Budi Santoso' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Ubah Pengguna' })).toBeVisible()
	})

	/** Edit an existing user via action menu */
	test('can edit a user via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control')

		await page
			.getByPlaceholder('Cari berdasarkan nama pengguna, nama, atau email...')
			.fill('warehouse@kedaikopi.id')
		await expect(page).toHaveURL(/[?&]q=warehouse/u)

		const row = page.getByRole('row').filter({ hasText: 'warehouse@kedaikopi.id' })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page).toHaveURL(/\/settings\/users\/\d+\?mode=edit$/)
		await expect(page.getByRole('heading', { name: 'Ubah Pengguna' })).toBeVisible()

		const nameField = page.getByLabel('Nama lengkap')
		await nameField.clear()
		await nameField.fill('Dian Kusuma E2E')

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Pengguna berhasil diperbarui.')).toBeVisible()
	})

	/** Reset a user's password via action menu */
	test('can reset a user password via action menu', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control')

		await page
			.getByPlaceholder('Cari berdasarkan nama pengguna, nama, atau email...')
			.fill('warehouse@kedaikopi.id')
		await expect(page).toHaveURL(/[?&]q=warehouse/u)

		const row = page.getByRole('row').filter({ hasText: 'warehouse@kedaikopi.id' })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Reset Kata Sandi' }).click()

		await expect(page.getByRole('dialog')).toBeVisible()
		await page.getByLabel('Kata sandi baru').fill('rahasia456')

		await page.getByRole('dialog').getByRole('button', { name: 'Reset kata sandi' }).click()

		await expect(page.getByText('Kata sandi berhasil direset.')).toBeVisible()
	})

	/** Deactivate a freshly created user via action menu */
	test('can deactivate a user via action menu', async ({ page, login }) => {
		await login()

		const username = `e2e_${uniqueSuffix()}`
		await page.goto('/settings/users/new')
		await page.getByLabel('Nama pengguna').fill(username)
		await page.getByLabel('Email').fill(`${username}@contoh.com`)
		await page.getByLabel('Nama lengkap').fill('E2E User Nonaktif')
		await page.getByLabel('Kata sandi').fill('rahasia123')
		await page.getByRole('button', { name: 'Buat' }).click()
		await expect(page.getByText('Pengguna berhasil dibuat.')).toBeVisible()
		await expect(page).toHaveURL(/\/settings\/access-control/)

		await page
			.getByPlaceholder('Cari berdasarkan nama pengguna, nama, atau email...')
			.fill(username)
		await expect(page).toHaveURL(new RegExp(`[?&]q=${username}`))

		const row = page.getByRole('row').filter({ hasText: username })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Nonaktifkan' }).click()

		// Confirm dialog
		const dialog = page.locator('[data-slot="dialog-content"]')
		await expect(dialog).toBeVisible()
		await dialog.getByRole('button', { name: 'Nonaktifkan' }).click()

		await expect(page.getByText('Pengguna berhasil dinonaktifkan.')).toBeVisible()
	})
})
