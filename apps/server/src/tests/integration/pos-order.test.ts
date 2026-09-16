import { loginAs } from '../helpers/auth.ts'
import { GET, POST } from '../helpers/request.ts'
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
	let cookie: string

	beforeAll(async () => {
		cookie = await loginAs(SEED_USERS.cashier.username)

		// Ensure shift is open (ignore error if already open)
		await POST('/pos/shift/open', {
			cookie,
			locationId: SEED_LOCATION_ID,
			headers: { 'x-location-id': String(SEED_LOCATION_ID) },
			body: { locationId: SEED_LOCATION_ID, openingCash: 500000 },
		})
	})

	// ─── Full Lifecycle in a single test (sequential guarantee) ───

	test('create → sync lines → payment → complete', async () => {
		// 1. Create order
		const createRes = await POST('/pos/order/create', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { locationId: SEED_LOCATION_ID, type: 'dine_in' },
		})
		expect(createRes.status).toBe(200)
		const createBody: Json = await createRes.json()
		const orderId = createBody.data.id
		expect(orderId).toBeGreaterThan(0)

		// 2. Sync lines
		const syncRes = await POST('/pos/order/lines/sync', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 2 }] },
		})
		expect(syncRes.status).toBe(200)

		// 3. Get detail to verify lines and total
		const detailRes = await GET('/pos/order/detail', {
			cookie,
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
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total },
		})
		expect(payRes.status).toBe(200)

		// 5. Complete order
		const completeRes = await POST('/pos/order/complete', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId },
		})
		expect(completeRes.status).toBe(200)

		// 6. Verify final state
		const finalRes = await GET('/pos/order/detail', {
			cookie,
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
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId: 999999, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 1 }] },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('complete already completed order returns error', async () => {
		// Create and complete an order first
		const createRes = await POST('/pos/order/create', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { locationId: SEED_LOCATION_ID, type: 'takeaway' },
		})
		const createBody: Json = await createRes.json()

		await POST('/pos/order/lines/sync', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 1 }] },
		})

		const detailRes = await GET('/pos/order/detail', {
			cookie,
			locationId: SEED_LOCATION_ID,
			query: { id: String(createBody.data.id) },
		})
		const detail: Json = await detailRes.json()
		const total = Number(detail.data.total)

		await POST('/pos/order/payment', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total },
		})
		await POST('/pos/order/complete', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id },
		})

		// Try to complete again
		const res = await POST('/pos/order/complete', {
			cookie,
			locationId: SEED_LOCATION_ID,
			body: { orderId: createBody.data.id },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	// ─── Date-range filter (server-side) ───

	test('order list date range includes orders in range and excludes those outside', async () => {
		// Create an order — it lands at "now" (orderedAt).
		const createRes = await POST('/pos/order/create', {
			cookie,
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
			cookie,
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
			cookie,
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

	// ─── Known Gaps (future tests) ───

	test.todo('void order reverses stock deductions', () => {})
	test.todo('partial payment prevents order completion', () => {})
	test.todo('order with modifiers calculates correct total', () => {})
	test.todo('voucher discount applies to order total', () => {})
	test.todo('concurrent order payments are serialized correctly', () => {})
})
