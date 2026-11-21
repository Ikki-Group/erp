import { test, expect } from './fixtures/auth.fixture'

import { uniqueSuffix } from './helpers/test-data'

/** Roles live under the tabbed access-control page. */
test.describe('Roles - CRUD', () => {
	/** Page loads and shows header */
	test('displays roles page with header', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control?tab=roles')

		await expect(page.getByRole('heading', { name: 'Kontrol Akses' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Peran' })).toBeVisible()
		await expect(page.getByText('Kelola peran dan kumpulan izinnya.')).toBeVisible()
	})

	/** Add Role button is visible for authorized users */
	test('shows Add Role button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control?tab=roles')

		await expect(page.getByRole('button', { name: 'Tambah Peran' })).toBeVisible()
	})

	/** Opening the full-page create form */
	test('opens create form when clicking Add Role', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control?tab=roles')

		await page.getByRole('button', { name: 'Tambah Peran' }).click()

		await expect(page).toHaveURL(/\/settings\/roles\/new$/)
		await expect(page.getByRole('heading', { name: 'Tambah Peran' })).toBeVisible()
	})

	/** Create a new role end-to-end */
	test('can create a new role', async ({ page, login }) => {
		await login()
		await page.goto('/settings/roles/new')

		const code = `e2e-role-${uniqueSuffix()}`

		await page.getByLabel('Kode').fill(code)
		await page.getByLabel('Nama', { exact: true }).fill('Peran E2E')
		await page.getByLabel('Deskripsi').fill('Peran dibuat oleh pengujian E2E.')

		await page.getByRole('button', { name: 'Buat' }).click()

		await expect(page.getByText('Peran berhasil dibuat.')).toBeVisible()
		await expect(page).toHaveURL(/\/settings\/access-control/)
	})

	/** Search/filter roles */
	test('can search roles by code', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control?tab=roles')

		await page.getByPlaceholder('Cari berdasarkan kode atau nama...').fill('owner')

		await expect(page).toHaveURL(/[?&]q=owner/)
		await expect(page.getByRole('row').filter({ hasText: 'owner' }).first()).toBeVisible()
	})

	/** Edit an existing role (non-system) */
	test('can edit a role via action menu', async ({ page, login }) => {
		await login()

		const code = `e2e-role-${uniqueSuffix()}`
		await page.goto('/settings/roles/new')
		await page.getByLabel('Kode').fill(code)
		await page.getByLabel('Nama', { exact: true }).fill('Peran E2E')
		await page.getByRole('button', { name: 'Buat' }).click()
		await expect(page.getByText('Peran berhasil dibuat.')).toBeVisible()
		await expect(page).toHaveURL(/\/settings\/access-control/)

		await page.getByPlaceholder('Cari berdasarkan kode atau nama...').fill(code)
		await expect(page).toHaveURL(new RegExp(`[?&]q=${code}`))

		const row = page.getByRole('row').filter({ hasText: code })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		await expect(page).toHaveURL(/\/settings\/roles\/\d+$/)
		await expect(page.getByRole('heading', { name: 'Ubah Peran' })).toBeVisible()

		const nameField = page.getByLabel('Nama', { exact: true })
		await nameField.clear()
		await nameField.fill('Peran E2E Diperbarui')

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Peran berhasil diperbarui.')).toBeVisible()
	})

	/** Delete a role via action menu */
	test('can delete a role via action menu', async ({ page, login }) => {
		await login()

		const code = `e2e-role-${uniqueSuffix()}`
		await page.goto('/settings/roles/new')
		await page.getByLabel('Kode').fill(code)
		await page.getByLabel('Nama', { exact: true }).fill('Peran E2E Hapus')
		await page.getByRole('button', { name: 'Buat' }).click()
		await expect(page.getByText('Peran berhasil dibuat.')).toBeVisible()
		await expect(page).toHaveURL(/\/settings\/access-control/)

		await page.getByPlaceholder('Cari berdasarkan kode atau nama...').fill(code)
		await expect(page).toHaveURL(new RegExp(`[?&]q=${code}`))

		const row = page.getByRole('row').filter({ hasText: code })
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Hapus' }).click()

		const dialog = page.locator('[data-slot="dialog-content"]')
		await expect(dialog).toBeVisible()
		await expect(dialog.getByRole('heading', { name: 'Hapus peran?' })).toBeVisible()
		await dialog.getByRole('button', { name: 'Hapus' }).click()

		await expect(page.getByText('Peran berhasil dihapus.')).toBeVisible()
	})

	/** System roles are viewable but remain immutable */
	test('system roles show view action without edit/delete', async ({ page, login }) => {
		await login()
		await page.goto('/settings/access-control?tab=roles')

		await page.getByPlaceholder('Cari berdasarkan kode atau nama...').fill('owner')
		await expect(page).toHaveURL(/[?&]q=owner/u)

		const ownerRow = page.getByRole('row').filter({ hasText: 'owner' })
		await expect(ownerRow).toBeVisible()

		await ownerRow.getByRole('button', { name: 'Tindakan' }).click()
		await expect(page.getByRole('menuitem', { name: 'Lihat' })).toBeVisible()
		await expect(page.getByRole('menuitem', { name: 'Ubah' })).toHaveCount(0)
		await expect(page.getByRole('menuitem', { name: 'Hapus' })).toHaveCount(0)
		await page.getByRole('menuitem', { name: 'Lihat' }).click()

		await expect(page).toHaveURL(/\/settings\/roles\/\d+$/)
		await expect(page.getByRole('heading', { name: 'Detail Peran Sistem' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Kembali' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Simpan Perubahan' })).toHaveCount(0)
	})
})
