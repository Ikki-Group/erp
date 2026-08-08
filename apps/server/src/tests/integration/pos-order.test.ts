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
		// Login as cashier and switch to location
		cookie = await loginAs(SEED_USERS.cashier.username)
		await POST('/auth/switch-location', {
			cookie,
			body: { locationId: SEED_LOCATION_ID },
		})

		// Ensure shift is open (ignore error if already open)
		await POST('/pos/shift/open', {
			cookie,
			body: { locationId: SEED_LOCATION_ID, openingCash: 500000 },
		})
	})

	// ─── Full Lifecycle in a single test (sequential guarantee) ───

	test('create → sync lines → payment → complete', async () => {
		// 1. Create order
		const createRes = await POST('/pos/order/create', {
			cookie,
			body: { locationId: SEED_LOCATION_ID, type: 'dine_in' },
		})
		expect(createRes.status).toBe(200)
		const createBody: Json = await createRes.json()
		const orderId = createBody.data.id
		expect(orderId).toBeGreaterThan(0)

		// 2. Sync lines
		const syncRes = await POST('/pos/order/lines/sync', {
			cookie,
			body: { orderId, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 2 }] },
		})
		expect(syncRes.status).toBe(200)

		// 3. Get detail to verify lines and total
		const detailRes = await GET('/pos/order/detail', {
			cookie,
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
			body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total },
		})
		expect(payRes.status).toBe(200)

		// 5. Complete order
		const completeRes = await POST('/pos/order/complete', {
			cookie,
			body: { orderId },
		})
		expect(completeRes.status).toBe(200)

		// 6. Verify final state
		const finalRes = await GET('/pos/order/detail', {
			cookie,
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
			body: { orderId: 999999, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 1 }] },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('complete already completed order returns error', async () => {
		// Create and complete an order first
		const createRes = await POST('/pos/order/create', {
			cookie,
			body: { locationId: SEED_LOCATION_ID, type: 'takeaway' },
		})
		const createBody: Json = await createRes.json()

		await POST('/pos/order/lines/sync', {
			cookie,
			body: { orderId: createBody.data.id, lines: [{ menuItemId: SEED_MENU_ITEM_ID, qty: 1 }] },
		})

		const detailRes = await GET('/pos/order/detail', {
			cookie,
			query: { id: String(createBody.data.id) },
		})
		const detail: Json = await detailRes.json()
		const total = Number(detail.data.total)

		await POST('/pos/order/payment', {
			cookie,
			body: { orderId: createBody.data.id, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: total },
		})
		await POST('/pos/order/complete', { cookie, body: { orderId: createBody.data.id } })

		// Try to complete again
		const res = await POST('/pos/order/complete', {
			cookie,
			body: { orderId: createBody.data.id },
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	// ─── Known Gaps (future tests) ───

	test.todo('void order reverses stock deductions', () => {})
	test.todo('partial payment prevents order completion', () => {})
	test.todo('order with modifiers calculates correct total', () => {})
	test.todo('voucher discount applies to order total', () => {})
	test.todo('concurrent order payments are serialized correctly', () => {})
})
