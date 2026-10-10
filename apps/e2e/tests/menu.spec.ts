import { test, expect } from './fixtures/auth.fixture'
import { SEED, uid } from './helpers/test-data'
import { expectToast, searchList, switchLocation } from './helpers/ui'

test.describe('Menu', () => {
	test('menu needs an active location', async ({ page, login }) => {
		await login()
		await page.goto('/master/menu')
		await expect(page.getByText('Pilih lokasi terlebih dahulu untuk mengelola menu.')).toBeVisible()
	})

	test('create a menu item → detail → edit price', async ({ page, login }) => {
		const sku = `MNU-${uid()}`
		const name = `E2E Kopi ${sku}`
		await login()
		await switchLocation(page, SEED.store.name)
		await page.goto('/master/menu')
		await expect(page.getByText(`Kelola menu item di ${SEED.store.name}.`)).toBeVisible()

		await page.getByRole('button', { name: 'Tambah Menu Item' }).click()
		await expect(page).toHaveURL(/\/master\/menu\/items\/new$/u)
		await page.getByRole('textbox', { name: 'SKU' }).fill(sku)
		await page.getByRole('textbox', { name: 'Nama' }).fill(name)
		await page.getByRole('textbox', { name: 'Harga Dasar' }).fill('25000')
		await page.getByRole('button', { name: 'Simpan' }).click()
		await expectToast(page, /dibuat|created/iu)

		await page.goto('/master/menu')
		await searchList(page, 'Cari menu item...', sku)
		const row = page.getByRole('button', { name: new RegExp(`^${sku} `, 'u') })
		await expect(row).toContainText('Rp 25.000')
		await row.click()
		await expect(page).toHaveURL(/\/master\/menu\/items\/\d+(\?|$)/u)
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

		await page.getByRole('button', { name: 'Edit', exact: true }).click()
		await expect(page).toHaveURL(/\/master\/menu\/items\/\d+\/edit/u)
		await page.getByRole('textbox', { name: 'Harga Dasar' }).fill('27000')
		await page.getByRole('button', { name: 'Simpan' }).click()
		await expectToast(page, /diperbarui|updated/iu)
		await expect(page.getByText('Rp 27.000').first()).toBeVisible()
	})
})
