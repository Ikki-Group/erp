import { test, expect } from './fixtures/auth.fixture'
import { SEED } from './helpers/test-data'
import { createDraftReceiving, switchLocation } from './helpers/ui'

test.describe('Inventory receiving', () => {
	test('list asks for a location when consolidated', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/receiving')
		await expect(page.getByText('Pilih lokasi aktif untuk melihat data penerimaan.')).toBeVisible()
	})

	test('create draft → confirm dialog shows a summary → confirmed', async ({ page, login }) => {
		await login()
		await switchLocation(page, SEED.warehouse.name)
		const number = await createDraftReceiving(page, 12)
		await expect(page.getByText('Draft', { exact: true })).toBeVisible()
		// The confirm summary is a snapshot of the page's lookups at click time (it shows
		// "#<id>" / unit-less qty if clicked before they load — see report), so wait like a user would.
		await expect(page.getByText(`Penerimaan dari ${SEED.supplier}`)).toBeVisible()
		await expect(page.getByText('pcs', { exact: true })).toBeVisible()

		await page.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
		const dialog = page.getByRole('dialog', { name: `Konfirmasi ${number}?` })
		await expect(dialog).toBeVisible()
		// Summary rows (label → value)
		await expect(dialog.getByRole('term').filter({ hasText: 'Lokasi tujuan' })).toBeVisible()
		await expect(
			dialog.getByRole('definition').filter({ hasText: SEED.warehouse.name }),
		).toBeVisible()
		await expect(dialog.getByRole('definition').filter({ hasText: SEED.supplier })).toBeVisible()
		await expect(dialog.getByRole('definition').filter({ hasText: '12 pcs' })).toBeVisible()
		await expect(dialog.getByRole('definition').filter({ hasText: 'Rp 60.000' })).toBeVisible()

		await dialog.getByRole('button', { name: 'Konfirmasi & tambah stok' }).click()
		await expect(page.getByText('Dikonfirmasi', { exact: true })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Konfirmasi', exact: true })).toBeHidden()
		await expect(page.getByRole('heading', { level: 3, name: 'Confirmed' })).toBeVisible()
	})
})
