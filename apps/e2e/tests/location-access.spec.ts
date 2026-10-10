import { test, expect } from './fixtures/auth.fixture'
import { API_URL, SEED, TEST_CREDENTIALS } from './helpers/test-data'
import { activeLocationStatus, presetLocation, switchLocation } from './helpers/ui'

test.describe('Location-scoped access', () => {
	test('cashier only sees their store; the warehouse is not selectable', async ({
		page,
		login,
	}) => {
		await login(TEST_CREDENTIALS.cashier.username, TEST_CREDENTIALS.cashier.password)

		// Dashboard rollup lists only the store.
		const rollup = page.getByRole('table')
		await expect(rollup.getByRole('row', { name: new RegExp(SEED.store.name, 'u') })).toBeVisible()
		await expect(
			rollup.getByRole('row', { name: new RegExp(SEED.warehouse.name, 'u') }),
		).toHaveCount(0)

		// Picker offers the store, not the warehouse.
		await page
			.getByRole('banner')
			.getByRole('button', { name: 'Semua Lokasi', exact: true })
			.click()
		await expect(page.getByRole('menuitem', { name: SEED.store.name })).toBeVisible()
		await expect(page.getByRole('menuitem', { name: SEED.warehouse.name })).toHaveCount(0)
		await page.keyboard.press('Escape')

		await switchLocation(page, SEED.store.name)
		await page.goto('/inventory/stock')
		await expect(page.getByText(`Saldo stok di ${SEED.store.name}`)).toBeVisible()
	})

	test("the API refuses the warehouse's stock to the cashier", async ({ page, login }) => {
		await login(TEST_CREDENTIALS.cashier.username, TEST_CREDENTIALS.cashier.password)
		const token = await page.evaluate(() => localStorage.getItem('ikki-session-token'))
		const res = await page.request.get(
			`${API_URL}/inventory/stock/list?page=1&limit=1&locationId=${SEED.warehouse.id}`,
			{ headers: { authorization: `Bearer ${token}`, 'x-location-id': String(SEED.warehouse.id) } },
		)
		expect(res.status()).toBe(403)
		expect((await res.json()).error.code).toBe('LOCATION_ACCESS_DENIED')
	})

	test('a persisted, inaccessible location falls back to consolidated', async ({ page, login }) => {
		await login(TEST_CREDENTIALS.cashier.username, TEST_CREDENTIALS.cashier.password)
		await presetLocation(page, SEED.warehouse.id)
		await page.goto('/inventory/stock')
		await expect(activeLocationStatus(page)).toHaveText('Lokasi aktif: Semua Lokasi')
		await expect(page.getByText('Pilih lokasi aktif untuk melihat data stok.')).toBeVisible()
	})
})
