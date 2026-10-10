import { test, expect } from './fixtures/auth.fixture'
import { SEED } from './helpers/test-data'
import { searchList, switchLocation } from './helpers/ui'

test.describe('Inventory stock', () => {
	test('consolidated view asks for a location', async ({ page, login }) => {
		await login()
		await page.goto('/inventory/stock')
		await expect(page.getByText('Pilih lokasi aktif untuk melihat data stok.')).toBeVisible()
	})

	test('balance list for a location can be searched and drills into movement history', async ({
		page,
		login,
	}) => {
		await login()
		await switchLocation(page, SEED.store.name)
		await page.getByRole('link', { name: 'Stock', exact: true }).click()

		await expect(page.getByText(`Saldo stok di ${SEED.store.name}`)).toBeVisible()
		await expect(page.getByRole('tab', { name: 'Saldo Stok' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
		const rows = page.getByRole('table').getByRole('button')
		await expect(rows.filter({ hasText: 'Fresh Milk' })).toBeVisible()

		await searchList(page, 'Cari material...', 'Arabica')
		await expect(rows).toHaveCount(1)
		await rows.first().click()

		await expect(page.getByRole('tab', { name: 'Riwayat Pergerakan' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
		await expect(page.getByText('Riwayat pergerakan — Biji Kopi Arabica (MAT-001)')).toBeVisible()
		await expect(page.getByRole('columnheader', { name: 'Arah' })).toBeVisible()
	})
})
