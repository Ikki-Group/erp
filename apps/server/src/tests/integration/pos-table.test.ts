import { loginAs } from '../helpers/auth.ts'
import {
	createLocation,
	createOrderWithLines,
	createStoreFixture,
	expectError,
	payAndComplete,
	uniqueSuffix,
} from '../helpers/fixtures.ts'
import { GET, POST, PUT, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

describe('pos/table', () => {
	let token: string

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
	})

	async function createTable(locationId: number, number: string): Promise<number> {
		const res = await POST('/pos/table/create', { token, body: { locationId, number } })
		expect(res.status).toBe(200)
		return (await json(res)).data.id
	}

	async function tableStatus(id: number): Promise<string> {
		const res = await GET('/pos/table/detail', { token, query: { id: String(id) } })
		return (await json(res)).data.status
	}

	test('a dine-in order occupies its table until the order completes', async () => {
		const store = await createStoreFixture(token, { basePrice: '10000' })
		const tableId = await createTable(store.locationId, 'T1')
		expect(await tableStatus(tableId)).toBe('available')

		const { orderId } = await createOrderWithLines(token, {
			locationId: store.locationId,
			tableId,
			lines: [{ menuItemId: store.menuItemId, qty: 1 }],
		})
		expect(await tableStatus(tableId)).toBe('occupied')

		await payAndComplete(token, store.locationId, orderId)
		expect(await tableStatus(tableId)).toBe('available')
	})

	test('table numbers are unique per location, not globally', async () => {
		const number = `N-${uniqueSuffix()}`
		const firstStore = await createLocation(token, 'store')
		const secondStore = await createLocation(token, 'store')
		await createTable(firstStore, number)

		const duplicate = await POST('/pos/table/create', {
			token,
			body: { locationId: firstStore, number },
		})
		await expectError(duplicate, 409, 'TABLE_NUMBER_EXISTS')

		const elsewhere = await POST('/pos/table/create', {
			token,
			body: { locationId: secondStore, number },
		})
		expect(elsewhere.status).toBe(200)
	})

	test('renaming a table onto an existing number is rejected', async () => {
		const locationId = await createLocation(token, 'store')
		await createTable(locationId, 'A')
		const tableId = await createTable(locationId, 'B')

		const res = await PUT('/pos/table/update', {
			token,
			body: { id: tableId, locationId, number: 'A' },
		})
		await expectError(res, 409, 'TABLE_NUMBER_EXISTS')
	})

	test('tables can only be created at store locations', async () => {
		const warehouseId = await createLocation(token, 'warehouse')
		const res = await POST('/pos/table/create', {
			token,
			body: { locationId: warehouseId, number: 'W1' },
		})
		await expectError(res, 400, 'TABLE_NOT_STORE_LOCATION')
	})

	test('unknown table returns 404', async () => {
		const res = await GET('/pos/table/detail', { token, query: { id: '2000000000' } })
		await expectError(res, 404, 'TABLE_NOT_FOUND')
	})

	test('cashier cannot reach tables at a location they are not assigned to', async () => {
		const locationId = await createLocation(token, 'store')
		const cashier = await loginAs(SEED_USERS.cashier.username)

		const res = await GET('/pos/table/list', {
			token: cashier,
			locationId,
			query: { locationId: String(locationId) },
		})
		await expectError(res, 403, 'LOCATION_ACCESS_DENIED')
	})
})
