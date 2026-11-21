import { loginAs } from '../helpers/auth.ts'
import {
	createLocation,
	createOrderWithLines,
	createStoreFixture,
	expectError,
	payAndComplete,
} from '../helpers/fixtures.ts'
import { GET, POST, json } from '../helpers/request.ts'
import type { Json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

/**
 * Cashier shifts. Only one shift may be open per user and location, so every
 * test opens its shift at a fresh store location (createStoreFixture).
 */
describe('pos/shift', () => {
	let token: string

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
	})

	async function shiftDetail(shiftId: number): Promise<Json> {
		const res = await GET('/pos/shift/detail', { token, query: { id: String(shiftId) } })
		expect(res.status).toBe(200)
		return (await json(res)).data
	}

	test('close records expected cash as opening cash plus cash payments', async () => {
		const store = await createStoreFixture(token, { basePrice: '25000', openingCash: 100000 })
		const { orderId, total } = await createOrderWithLines(token, {
			locationId: store.locationId,
			lines: [{ menuItemId: store.menuItemId, qty: 2 }],
		})
		await payAndComplete(token, store.locationId, orderId)

		const closed = await POST('/pos/shift/close', {
			token,
			locationId: store.locationId,
			body: { shiftId: store.shiftId, closingCash: 150000, notes: 'End of day' },
		})
		expect(closed.status).toBe(200)

		const detail = await shiftDetail(store.shiftId)
		expect(detail.status).toBe('closed')
		expect(detail.closedAt).toBeTruthy()
		expect(Number(detail.expectedCash)).toBe(100000 + total)
		expect(Number(detail.closingCash)).toBe(150000)
	})

	test('active shift lookup follows open → close', async () => {
		const store = await createStoreFixture(token, { basePrice: '1000' })
		const activeOpts = { token, locationId: store.locationId }

		const before = await json(await GET('/pos/shift/active', activeOpts))
		expect(before.data?.id).toBe(store.shiftId)

		await POST('/pos/shift/close', {
			token,
			locationId: store.locationId,
			body: { shiftId: store.shiftId, closingCash: 0 },
		})
		const after = await json(await GET('/pos/shift/active', activeOpts))
		expect(after.data).toBeNull()
	})

	test('a second shift cannot be opened while one is open', async () => {
		const store = await createStoreFixture(token, { basePrice: '1000' })
		const res = await POST('/pos/shift/open', {
			token,
			locationId: store.locationId,
			body: { locationId: store.locationId, openingCash: 0 },
		})
		await expectError(res, 400, 'SHIFT_ALREADY_OPEN')
	})

	test('a closed shift cannot be closed again and blocks new orders', async () => {
		const store = await createStoreFixture(token, { basePrice: '1000' })
		const closeOpts = {
			token,
			locationId: store.locationId,
			body: { shiftId: store.shiftId, closingCash: 0 },
		}

		expect((await POST('/pos/shift/close', closeOpts)).status).toBe(200)
		await expectError(await POST('/pos/shift/close', closeOpts), 400, 'SHIFT_NOT_OPEN')

		const order = await POST('/pos/order/create', {
			token,
			locationId: store.locationId,
			body: { locationId: store.locationId, type: 'takeaway' },
		})
		await expectError(order, 400, 'NO_ACTIVE_SHIFT')
	})

	test('shifts can only be opened at store locations', async () => {
		const warehouseId = await createLocation(token, 'warehouse')
		const res = await POST('/pos/shift/open', {
			token,
			locationId: warehouseId,
			body: { locationId: warehouseId, openingCash: 0 },
		})
		await expectError(res, 400, 'SHIFT_NOT_STORE_LOCATION')
	})

	test("cashier cannot close another user's shift", async () => {
		const store = await createStoreFixture(token, { basePrice: '1000' })
		const cashier = await loginAs(SEED_USERS.cashier.username)

		const res = await POST('/pos/shift/close', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			body: { shiftId: store.shiftId, closingCash: 0 },
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
		expect((await shiftDetail(store.shiftId)).status).toBe('open')
	})

	test('closing an unknown shift returns 404', async () => {
		const res = await POST('/pos/shift/close', {
			token,
			body: { shiftId: 2_000_000_000, closingCash: 0 },
		})
		await expectError(res, 404, 'SHIFT_NOT_FOUND')
	})
})
