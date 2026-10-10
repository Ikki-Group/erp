import { test, expect } from './fixtures/auth.fixture'
import { SEED, TEST_CREDENTIALS } from './helpers/test-data'
import { expectToast, switchLocation } from './helpers/ui'

// POS is out of product scope: one smoke test guards the money path only.
// Uses `manager` — the only seeded store user without an open shift.
test.describe('POS smoke', () => {
	test('open shift → order → pay → completed receipt', async ({ page, login }) => {
		await login(TEST_CREDENTIALS.manager.username, TEST_CREDENTIALS.manager.password)
		await switchLocation(page, SEED.store.name)

		await page.goto('/pos/shifts')
		await page.getByRole('button', { name: 'Open Shift' }).click()
		const shift = page.getByRole('dialog', { name: 'Open Shift' })
		await shift.getByRole('textbox', { name: 'Opening Cash' }).fill('100000')
		await shift.getByRole('button', { name: 'Open Shift' }).click()
		await expectToast(page, 'Shift opened successfully.')

		await page.goto('/pos/new-order')
		await page.getByRole('button', { name: /^Croissant /u }).click()
		await expect(page.getByText('Belum ada item')).toBeHidden()
		await page.getByRole('button', { name: 'Bayar' }).click()

		const payment = page.getByRole('dialog', { name: 'Pembayaran' })
		await payment.getByRole('button', { name: 'Cash' }).click()
		await expect(payment.getByRole('textbox', { name: 'Jumlah pembayaran Cash' })).not.toHaveValue(
			'',
		)
		await payment.getByRole('button', { name: 'Selesaikan Pembayaran' }).click()

		const receipt = page.getByRole('dialog', { name: 'Struk Pesanan' })
		await expect(receipt).toBeVisible()
		await expect(receipt.getByText(/^No: ORD-STORE-01-/u)).toBeVisible()
		await expect(receipt.getByText('Croissant', { exact: true })).toBeVisible()
		await receipt.getByRole('button', { name: 'Tutup' }).click()

		// Close the shift so the test can run again on the same database.
		await page.goto('/pos/shifts')
		await page.getByRole('button', { name: 'Close Shift' }).click()
		const close = page.getByRole('dialog', { name: 'Close Shift' })
		await close.getByRole('textbox', { name: 'Closing Cash' }).fill('119980')
		await close.getByRole('button', { name: 'Close Shift' }).click()
		await expectToast(page, 'Shift closed successfully.')
		await expect(page.getByRole('button', { name: 'Open Shift' })).toBeVisible()
	})
})
