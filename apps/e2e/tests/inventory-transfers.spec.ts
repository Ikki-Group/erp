import { test, expect } from './fixtures/auth.fixture'
import { SEED } from './helpers/test-data'
import { pickOption, switchLocation } from './helpers/ui'

test.describe('Inventory transfers', () => {
	test('create → ship at origin → receive at destination', async ({ page, login }) => {
		await login()
		await switchLocation(page, SEED.store.name)
		await page.goto('/inventory/transfers/new')

		await expect(page.getByRole('combobox', { name: 'Lokasi Asal' })).toHaveText(
			new RegExp(SEED.store.name, 'u'),
		)
		await pickOption(page, 'Lokasi Tujuan', new RegExp(SEED.warehouse.name, 'u'))
		await page.getByRole('button', { name: 'Lanjut' }).click()
		await page.getByRole('button', { name: 'Tambah Baris' }).click()
		await pickOption(page, 'Material', new RegExp(SEED.pcsMaterial, 'u'))
		await page.getByRole('textbox', { name: 'Jumlah' }).fill('2')
		await pickOption(page, 'Satuan', /\(pcs\)/u)
		await page.getByRole('button', { name: 'Lanjut' }).click()
		await page.getByRole('button', { name: 'Buat Transfer' }).click()

		await expect(page).toHaveURL(/\/inventory\/transfers\/\d+$/u)
		const heading = page.getByRole('heading', { level: 1, name: /^TRF-/u })
		const number = (await heading.textContent()) ?? ''
		await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()

		await page.getByRole('button', { name: 'Kirim', exact: true }).click()
		await page
			.getByRole('dialog', { name: `Kirim ${number}?` })
			.getByRole('button', { name: 'Kirim & kurangi stok' })
			.click()
		await expect(page.getByText('Dalam Perjalanan', { exact: true })).toBeVisible()
		// Receiving happens at the destination.
		await expect(page.getByRole('button', { name: 'Terima', exact: true })).toBeHidden()

		await switchLocation(page, SEED.warehouse.name)
		await page.getByRole('button', { name: 'Terima', exact: true }).click()
		await page
			.getByRole('dialog', { name: `Terima ${number}?` })
			.getByRole('button', { name: 'Terima & tambah stok' })
			.click()
		await expect(page.getByText('Dalam Perjalanan', { exact: true })).toBeHidden()
		await expect(page.getByRole('heading', { level: 3, name: 'Received' })).toBeVisible()
	})
})
