import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/auth.fixture'

const openButton = (page: Page) => page.getByRole('button', { name: 'Buka Shift' })
const closeButton = (page: Page) => page.getByRole('button', { name: 'Tutup Shift' })
const dialog = (page: Page) => page.locator('[data-slot="dialog-content"]')

/** Navigate to the shifts page and wait for the active-shift query to resolve. */
async function gotoShifts(page: Page) {
	const activeShift = page.waitForResponse(
		(r) => r.url().includes('/pos/shift/active') && r.status() === 200,
	)
	await page.goto('/pos/shifts')
	await activeShift
}

/** Close the location's active shift so a test starts from a known state. */
async function ensureNoActiveShift(page: Page) {
	// Header action settles once the active-shift query resolves: a shift aktif
	// merender "Tutup Shift", lokasi tanpa shift aktif menampilkan "Buka Shift".
	await expect(openButton(page).or(closeButton(page)).first()).toBeVisible()
	if (!(await closeButton(page).isVisible())) {
		await expect(openButton(page)).toBeVisible()
		return
	}

	await closeButton(page).click()
	await page.getByLabel('Kas Penutupan').fill('0')
	await dialog(page).getByRole('button', { name: 'Tutup Shift' }).click()
	await expect(page.getByText('Shift berhasil ditutup.')).toBeVisible()
	// Let the dialog finish its exit animation so the next click cannot be
	// swallowed by the still-mounted overlay.
	await expect(dialog(page)).toBeHidden()
	await expect(openButton(page).first()).toBeVisible()
}

/** Open a shift with the given opening cash from the shifts page. */
async function openShift(page: Page, openingCash: string) {
	await openButton(page).first().click()
	await page.getByLabel('Kas Pembukaan').fill(openingCash)
	await dialog(page).getByRole('button', { name: 'Buka Shift' }).click()
	await expect(page.getByText('Shift berhasil dibuka.')).toBeVisible()
}

test.describe('POS Shifts - Open/Close', () => {
	// A shift is per-location state; keep this file's tests from racing each other.
	test.describe.configure({ mode: 'serial' })

	/** Page loads and shows header */
	test('displays shifts page with header', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		await expect(page.getByRole('heading', { name: 'Shift' })).toBeVisible()
		await expect(page.getByText('Kelola shift kasir untuk lokasi ini.')).toBeVisible()
	})

	/** Tombol Buka Shift terlihat saat tidak ada shift aktif */
	test('shows Buka Shift button when no active shift', async ({ page, login }) => {
		await login()
		await gotoShifts(page)

		await ensureNoActiveShift(page)

		await expect(page.getByRole('button', { name: 'Buka Shift' }).first()).toBeVisible()
	})

	/** Opening shift dialog */
	test('opens shift dialog when clicking Buka Shift', async ({ page, login }) => {
		await login()
		await gotoShifts(page)

		await ensureNoActiveShift(page)
		await page.getByRole('button', { name: 'Buka Shift' }).first().click()

		await expect(dialog(page)).toBeVisible()
		await expect(dialog(page).getByRole('heading', { name: 'Buka Shift' })).toBeVisible()
		await expect(page.getByLabel('Kas Pembukaan')).toBeVisible()

		await dialog(page).getByRole('button', { name: 'Batal' }).click()
	})

	/** Open a shift end-to-end */
	test('can open a shift with starting cash', async ({ page, login }) => {
		await login()
		await gotoShifts(page)

		await ensureNoActiveShift(page)
		await openShift(page, '500000')

		await expect(page.getByText('Shift aktif')).toBeVisible()
	})

	/** Status filter is reflected in the URL (URL-driven list state) */
	test('reflects the status filter in the URL', async ({ page, login }) => {
		await login()
		await page.goto('/pos/shifts')

		// Pick a status from the toolbar filter; the choice is pushed to the URL
		// as ?status=... and survives a reload (shareable, refresh-stable).
		await page.getByRole('combobox', { name: 'Status' }).click()
		await page.getByRole('option', { name: 'Buka' }).click()

		await expect(page).toHaveURL(/[?&]status=open/)

		await page.reload()
		await expect(page).toHaveURL(/[?&]status=open/)
	})

	/** Active shift indicator shown + close flow */
	test('shows active indicator and can close shift', async ({ page, login }) => {
		await login()
		await gotoShifts(page)

		await ensureNoActiveShift(page)
		await openShift(page, '100000')

		// Verify active indicator
		await expect(page.getByText('Shift aktif')).toBeVisible()

		// Close the shift
		await page.getByRole('button', { name: 'Tutup Shift' }).click()

		await expect(dialog(page)).toBeVisible()
		await expect(dialog(page).getByRole('heading', { name: 'Tutup Shift' })).toBeVisible()

		await page.getByLabel('Kas Penutupan').fill('100000')
		await dialog(page).getByRole('button', { name: 'Tutup Shift' }).click()

		await expect(page.getByText('Shift berhasil ditutup.')).toBeVisible()
	})
})
