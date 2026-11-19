import { loginAs } from '../helpers/auth.ts'
import { createOrderWithLines, createStoreFixture, uniqueSuffix } from '../helpers/fixtures.ts'
import { GET, POST, json } from '../helpers/request.ts'
import {
	SEED_LOCATION_ID,
	SEED_MENU_ITEM_ID,
	SEED_PAYMENT_METHOD_ID,
	SEED_USERS,
} from '../helpers/seed.ts'
import { describe, expect, test, beforeAll } from 'bun:test'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test assertions on untyped JSON
type Json = any

describe('pos/order lifecycle', () => {
	let token: string
	// Owner token for the fixtures that create their own location and menu item.
	let ownerToken: string

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.cashier.username)
		ownerToken = await loginAs(SEED_USERS.owner.username)

		// Ensure shift is open (ignore error if already open)
		await POST('/pos/shift/open', {
			token,
			locationId: SEED_LOCATION_ID,
			headers: { 'x-location-id': String(SEED_LOCATION_ID) },
			body: { locationId: SEED_LOCATION_ID, openingCash: 500000 },
		})
	})

	// ─── Full Lifecycle in a single test (sequential guarantee) ───

	test('create → sync lines → payment → complete', async () => {
		// 1. Create order
		const createRes = await POST('/pos/order/create', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { locationId: SEED_LOCATION_ID, type: 'dine_in' },
		})
		expect(createRes.status).toBe(200)
		const createBody: Json = await createRes.json()
		const orderId = createBody.data.id
		expect(orderId).toBeGreaterThan(0)

		// 2. Sync lines
		const syncRes = await POST('/pos/order/lines/sync', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 2 }] },
		})
		expect(syncRes.status).toBe(200)

		// 3. Get detail to verify lines and total
		const detailRes = await GET('/pos/order/detail', {
			token,
			locationId: SEED_LOCATION_ID,
			query: { id: String(orderId) },
		})
		expect(detailRes.status).toBe(200)
		const detail: Json = await detailRes.json()
		expect(detail.data.lines.length).toBeGreaterThanOrEqual(1)
		expect(Number(detail.data.lines[0].quantity)).toBe(2)
		const total = Number(detail.data.total)
		expect(total).toBeGreaterThan(0)

		// 4. Record payment
		const payRes = await POST('/pos/order/payment', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total },
		})
		expect(payRes.status).toBe(200)

		// 5. Complete order
		const completeRes = await POST('/pos/order/complete', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId },
		})
		expect(completeRes.status).toBe(200)

		// 6. Verify final state
		const finalRes = await GET('/pos/order/detail', {
			token,
			locationId: SEED_LOCATION_ID,
			query: { id: String(orderId) },
		})
		const finalDetail: Json = await finalRes.json()
		expect(finalDetail.data.status).toBe('completed')
		expect(finalDetail.data.completedAt).toBeTruthy()
	})

	// ─── Negative Cases ───

	test('create order without auth rejects', async () => {
		const res = await POST('/pos/order/create', {
			body: { locationId: SEED_LOCATION_ID, type: 'dine_in' },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('sync lines with invalid orderId returns error', async () => {
		const res = await POST('/pos/order/lines/sync', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId: 999999, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 1 }] },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('complete already completed order returns error', async () => {
		// Create and complete an order first
		const createRes = await POST('/pos/order/create', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { locationId: SEED_LOCATION_ID, type: 'takeaway' },
		})
		const createBody: Json = await createRes.json()

		await POST('/pos/order/lines/sync', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 1 }] },
		})

		const detailRes = await GET('/pos/order/detail', {
			token,
			locationId: SEED_LOCATION_ID,
			query: { id: String(createBody.data.id) },
		})
		const detail: Json = await detailRes.json()
		const total = Number(detail.data.total)

		await POST('/pos/order/payment', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total },
		})
		await POST('/pos/order/complete', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id },
		})

		// Try to complete again
		const res = await POST('/pos/order/complete', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	// ─── Date-range filter (server-side) ───

	test('order list date range includes orders in range and excludes those outside', async () => {
		// Create an order — it lands at "now" (orderedAt).
		const createRes = await POST('/pos/order/create', {
			token,
			locationId: SEED_LOCATION_ID,
			body: { locationId: SEED_LOCATION_ID, type: 'takeaway' },
		})
		const createBody: Json = await createRes.json()
		const orderId = createBody.data.id as number

		const now = Date.now()
		const hour = 60 * 60 * 1000
		const iso = (ms: number) => new Date(ms).toISOString()

		// A range straddling now must include the just-created order.
		const inRange = await GET('/pos/order/list', {
			token,
			locationId: SEED_LOCATION_ID,
			query: {
				locationId: String(SEED_LOCATION_ID),
				page: '1',
				limit: '100',
				dateFrom: iso(now - hour),
				dateTo: iso(now + hour),
			},
		})
		expect(inRange.status).toBe(200)
		const inBody: Json = await inRange.json()
		expect((inBody.data as Array<{ id: number }>).some((o) => o.id === orderId)).toBe(true)

		// A range entirely in the past must exclude it, and the count must honor
		// the range (this is the bug the client-side filter hid: total reflected
		// the unfiltered set).
		const pastRange = await GET('/pos/order/list', {
			token,
			locationId: SEED_LOCATION_ID,
			query: {
				locationId: String(SEED_LOCATION_ID),
				page: '1',
				limit: '100',
				dateFrom: iso(now - 48 * hour),
				dateTo: iso(now - 24 * hour),
			},
		})
		expect(pastRange.status).toBe(200)
		const pastBody: Json = await pastRange.json()
		expect((pastBody.data as Array<{ id: number }>).some((o) => o.id === orderId)).toBe(false)
		// Every returned row (if any) must fall within the past window.
		for (const o of pastBody.data as Array<{ orderedAt: string }>) {
			const t = new Date(o.orderedAt).getTime()
			expect(t).toBeLessThanOrEqual(now - 24 * hour)
			expect(t).toBeGreaterThanOrEqual(now - 48 * hour)
		}
	})

	// ─── Payments ───

	test('partial payment prevents order completion', async () => {
		const store = await createStoreFixture(ownerToken, { basePrice: '10000' })
		const { orderId, total } = await createOrderWithLines(ownerToken, {
			locationId: store.locationId,
			lines: [{ menuItemId: store.menuItemId, qty: 1 }],
		})

		const partial = await POST('/pos/order/payment', {
			token: ownerToken,
			locationId: store.locationId,
			body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total / 2 },
		})
		expect(partial.status).toBe(200)

		const blocked = await POST('/pos/order/complete', {
			token: ownerToken,
			locationId: store.locationId,
			body: { orderId },
		})
		expect(blocked.status).toBe(400)
		expect((await json(blocked)).error.code).toBe('ORDER_NOT_FULLY_PAID')

		const rest = await POST('/pos/order/payment', {
			token: ownerToken,
			locationId: store.locationId,
			body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total - total / 2 },
		})
		expect(rest.status).toBe(200)
		const completed = await POST('/pos/order/complete', {
			token: ownerToken,
			locationId: store.locationId,
			body: { orderId },
		})
		expect(completed.status).toBe(200)
	})

	test('concurrent payments are serialized so the total is never overpaid', async () => {
		const store = await createStoreFixture(ownerToken, { basePrice: '10000' })
		const { orderId, total } = await createOrderWithLines(ownerToken, {
			locationId: store.locationId,
			lines: [{ menuItemId: store.menuItemId, qty: 1 }],
		})

		const pay = () =>
			POST('/pos/order/payment', {
				token: ownerToken,
				locationId: store.locationId,
				body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total },
			})
		const statuses = (await Promise.all([pay(), pay()]))
			.map((res) => res.status)
			.sort((a, b) => a - b)
		expect(statuses).toEqual([200, 400])

		const detail = await GET('/pos/order/detail', {
			token: ownerToken,
			locationId: store.locationId,
			query: { id: String(orderId) },
		})
		const data = (await json(detail)).data
		expect(data.payments).toHaveLength(1)
		const completed = await POST('/pos/order/complete', {
			token: ownerToken,
			locationId: store.locationId,
			body: { orderId },
		})
		expect(completed.status).toBe(200)
	})

	test('order lines with modifiers add the price adjustment to the line total', async () => {
		const store = await createStoreFixture(ownerToken, { basePrice: '20000' })
		const group = await POST('/menu/modifier/create', {
			token: ownerToken,
			body: {
				locationId: store.locationId,
				name: `Ukuran ${uniqueSuffix()}`,
				selectionType: 'single',
				isRequired: false,
				minSelect: 0,
				maxSelect: 1,
				options: [{ name: 'Large', priceAdjustment: '5000' }],
			},
		})
		const groupId = (await json(group)).data.id as number
		const detail = await GET('/menu/modifier/detail', {
			token: ownerToken,
			query: { id: String(groupId) },
		})
		const optionId = (await json(detail)).data.options[0].id as number

		await POST('/menu/item/modifiers/sync', {
			token: ownerToken,
			body: { menuItemId: store.menuItemId, groups: [{ groupId }] },
		})

		const created = await POST('/pos/order/create', {
			token: ownerToken,
			locationId: store.locationId,
			body: { locationId: store.locationId, type: 'takeaway' },
		})
		const orderId = (await json(created)).data.id as number
		await POST('/pos/order/lines/sync', {
			token: ownerToken,
			locationId: store.locationId,
			body: {
				orderId,
				lines: [{ menuItemId: store.menuItemId, qty: 2, modifierOptionIds: [optionId] }],
			},
		})

		const order = await GET('/pos/order/detail', {
			token: ownerToken,
			locationId: store.locationId,
			query: { id: String(orderId) },
		})
		const line = (await json(order)).data.lines[0]
		expect({ modifierTotal: line.modifierTotal, lineTotal: line.lineTotal }).toEqual({
			modifierTotal: '10000',
			lineTotal: '50000',
		})
	})
})
