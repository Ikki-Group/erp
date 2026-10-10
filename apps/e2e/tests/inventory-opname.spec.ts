import { test, expect } from './fixtures/auth.fixture'
import { SEED } from './helpers/test-data'
import { switchLocation } from './helpers/ui'

test.describe('Stock opname', () => {
	test('snapshot → enter a count → complete with a summary', async ({ page, login }) => {
		await login()
		await switchLocation(page, SEED.store.name)
		await page.goto('/inventory/opname')

		await page.getByRole('button', { name: 'Buat Opname' }).first().click()
		const snapshot = page.getByRole('dialog', {
			name: `Snapshot stok ${SEED.store.name} sekarang?`,
		})
		await snapshot.getByRole('button', { name: 'Buat snapshot' }).click()

		await expect(page).toHaveURL(/\/inventory\/opname\/\d+$/u)
		const heading = page.getByRole('heading', { level: 1, name: /^OPN-/u })
		await expect(heading).toBeVisible()
		const number = (await heading.textContent()) ?? ''

		await page.getByRole('spinbutton', { name: 'Stok aktual Biji Kopi Arabica' }).fill('3')
		await expect(page.getByText(/1 belum disimpan/u)).toBeVisible()
		await page.getByRole('button', { name: 'Simpan', exact: true }).click()
		await expect(page.getByText(/1 belum disimpan/u)).toBeHidden()

		await page.getByRole('button', { name: 'Selesaikan opname' }).click()
		const dialog = page.getByRole('dialog', { name: `Selesaikan ${number}?` })
		await expect(dialog.getByRole('term').getByText('Dihitung', { exact: true })).toBeVisible()
		await expect(dialog.getByRole('definition').filter({ hasText: /^1 \/ \d+$/u })).toBeVisible()

		await dialog.getByRole('button', { name: 'Selesaikan & sesuaikan stok' }).click()
		await expect(page.getByText('Selesai', { exact: true }).first()).toBeVisible()
		await expect(page.getByRole('heading', { level: 3, name: 'Completed' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Selesaikan opname' })).toBeHidden()
	})
})
