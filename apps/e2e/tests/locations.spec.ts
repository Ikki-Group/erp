import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'
import { uniqueSuffix } from './helpers/test-data'

/** Creates a location through the full-page form and waits for the list. */
async function createLocation(page: Page, code: string, name: string) {
	await page.goto('/settings/locations/new')
	await page.getByLabel('Nama').fill(name)
	await page.getByLabel('Kode').fill(code)
	await page.getByRole('button', { name: 'Buat Lokasi' }).click()
	await expect(page.getByText('Lokasi berhasil dibuat.')).toBeVisible()
}

test.describe('Locations - CRUD', () => {
	/** Page loads and shows header */
	test('displays locations page with header', async ({ page, login }) => {
		await login()
		await page.goto('/settings/locations')

		await expect(page.getByRole('heading', { name: 'Lokasi' })).toBeVisible()
		await expect(page.getByText('Kelola toko dan gudang.')).toBeVisible()
	})

	/** Add Location button is visible for authorized users */
	test('shows Tambah Lokasi button for authorized user', async ({ page, login }) => {
		await login()
		await page.goto('/settings/locations')

		await expect(page.getByRole('button', { name: 'Tambah Lokasi' })).toBeVisible()
	})

	/** Add Location navigates to the full-page create route */
	test('navigates to the create page when clicking Tambah Lokasi', async ({ page, login }) => {
		await login()
		await page.goto('/settings/locations')

		await page.getByRole('button', { name: 'Tambah Lokasi' }).click()

		await expect(page).toHaveURL(/\/settings\/locations\/new$/u)
		await expect(page.getByRole('heading', { name: 'Lokasi Baru' })).toBeVisible()
	})

	/** Create a new location end-to-end via the full-page form */
	test('can create a new location', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `LOC-${suffix}`
		await createLocation(page, code, `E2E Warehouse ${suffix}`)

		await expect(page).toHaveURL(/\/settings\/locations(\?.*)?$/u)

		await page.goto(`/settings/locations?q=${code}`)
		await expect(page.getByRole('row').filter({ hasText: code })).toBeVisible()
	})

	/** Searching writes the term to the URL and survives a reload (URL-driven list state) */
	test('reflects search in the URL and restores it on reload', async ({ page, login }) => {
		await login()
		await page.goto('/settings/locations')

		await page.getByPlaceholder('Cari lokasi...').fill('E2E')

		// The search term is pushed to the URL as ?q=...
		await expect(page).toHaveURL(/[?&]q=E2E/u)

		// A reload restores the same filtered view from the URL (refresh-stable).
		await page.reload()
		await expect(page).toHaveURL(/[?&]q=E2E/u)
		await expect(page.getByPlaceholder('Cari lokasi...')).toHaveValue('E2E')
	})

	/** A shared filtered URL reproduces the filtered view directly */
	test('opens a shared filtered URL directly', async ({ page, login }) => {
		await login()
		await page.goto('/settings/locations?q=E2E&page=1')

		await expect(page.getByPlaceholder('Cari lokasi...')).toHaveValue('E2E')
	})

	/** Edit navigates to the full-page edit route and saves */
	test('can edit a location via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `LOC-${suffix}`
		await createLocation(page, code, `E2E Edit ${suffix}`)

		await page.goto(`/settings/locations?q=${code}`)

		const row = page.getByRole('row').filter({ hasText: code })
		await expect(row).toBeVisible()
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Ubah' }).click()

		// Full-page edit route, not a dialog
		await expect(page).toHaveURL(/\/settings\/locations\/\d+\/edit$/u)
		await expect(page.getByRole('heading', { name: 'Ubah Lokasi' })).toBeVisible()

		const nameField = page.getByLabel('Nama')
		await nameField.clear()
		await nameField.fill(`E2E Updated ${suffix}`)

		await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

		await expect(page.getByText('Lokasi berhasil diperbarui.')).toBeVisible()
	})

	/** Deactivate a location via action menu (confirm dialog) */
	test('can deactivate a location via action menu', async ({ page, login }) => {
		await login()

		const suffix = uniqueSuffix()
		const code = `LOC-${suffix}`
		await createLocation(page, code, `E2E Delete ${suffix}`)

		await page.goto(`/settings/locations?q=${code}`)

		const row = page.getByRole('row').filter({ hasText: code })
		await expect(row).toBeVisible()
		await row.getByRole('button', { name: 'Tindakan' }).click()
		await page.getByRole('menuitem', { name: 'Nonaktifkan' }).click()

		await expect(page.getByRole('dialog').getByText('Nonaktifkan lokasi?')).toBeVisible()
		await page.getByRole('dialog').getByRole('button', { name: 'Nonaktifkan' }).click()

		await expect(page.getByText('Lokasi berhasil dinonaktifkan.')).toBeVisible()
	})
})
