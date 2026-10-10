import { test, expect } from './fixtures/auth.fixture'
import { SEED } from './helpers/test-data'
import { activeLocationStatus, createDraftReceiving, switchLocation } from './helpers/ui'

test.describe('Dashboard', () => {
	test('consolidated view shows one rollup row per accessible location', async ({
		page,
		login,
	}) => {
		await login()
		await expect(activeLocationStatus(page)).toHaveText('Lokasi aktif: Semua Lokasi')
		const rollup = page.getByRole('table')
		await expect(rollup.getByRole('columnheader', { name: 'Penerimaan draft' })).toBeVisible()
		await expect(rollup.getByRole('row', { name: new RegExp(SEED.store.name, 'u') })).toBeVisible()
		await expect(
			rollup.getByRole('row', { name: new RegExp(SEED.warehouse.name, 'u') }),
		).toBeVisible()
		await expect(rollup.getByRole('row', { name: /^Total/u })).toBeVisible()
	})

	test('a non-zero count drills in: switches location and opens the filtered list', async ({
		page,
		login,
	}) => {
		await login()
		await switchLocation(page, SEED.store.name)
		const number = await createDraftReceiving(page)

		await switchLocation(page, 'Semua Lokasi')
		await page.goto('/')
		await page
			.getByRole('link', { name: new RegExp(`^\\d+ penerimaan draft di ${SEED.store.name}$`, 'u') })
			.click()

		await expect(page).toHaveURL(/\/inventory\/receiving\?.*status=draft/u)
		await expect(activeLocationStatus(page)).toHaveText(`Lokasi aktif: ${SEED.store.name}`)
		await expect(page.getByRole('button', { name: new RegExp(number, 'u') })).toBeVisible()
	})
})
