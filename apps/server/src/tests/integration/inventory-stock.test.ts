import { loginAs } from '../helpers/auth.ts'
import { GET, POST } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_MATERIAL_ID, SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test, beforeAll } from 'bun:test'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test assertions on untyped JSON
type Json = any

/**
 * Stock integration tests via the receiving flow.
 *
 * NOTE: Integration tests run concurrently (bunfig concurrentTestGlob).
 * Each test is self-contained — verifies by reference ID, not absolute qty.
 */
describe('inventory/stock', () => {
	let cookie: string

	const SEED_SUPPLIER_ID = 1
	const SEED_UOM_ID = 1

	beforeAll(async () => {
		cookie = await loginAs(SEED_USERS.owner.username)
		await POST('/auth/switch-location', {
			cookie,
			body: { locationId: SEED_LOCATION_ID },
		})
	})

	// ─── Receiving → Stock Movement ───

	test('receiving creates stock inbound and updates balance', async () => {
		// Create receiving (draft)
		const createRes = await POST('/inventory/receiving/create', {
			cookie,
			body: {
				locationId: SEED_LOCATION_ID,
				supplierId: SEED_SUPPLIER_ID,
				notes: 'Test receiving',
				lines: [
					{
						materialId: SEED_MATERIAL_ID,
						qty: '7.000000',
						unitCost: '5000.0000',
						uomId: SEED_UOM_ID,
					},
				],
			},
		})
		expect(createRes.status).toBe(200)
		const createBody: Json = await createRes.json()
		const receivingId = createBody.data.id
		expect(receivingId).toBeGreaterThan(0)

		// Confirm receiving → triggers stock inbound
		const confirmRes = await POST('/inventory/receiving/confirm', {
			cookie,
			body: { receivingId },
		})
		expect(confirmRes.status).toBe(200)

		// Verify balance exists and is positive
		const afterRes = await GET('/inventory/stock/balance', {
			cookie,
			query: {
				materialId: String(SEED_MATERIAL_ID),
				locationId: String(SEED_LOCATION_ID),
			},
		})
		expect(afterRes.status).toBe(200)
		const afterBody: Json = await afterRes.json()
		expect(Number(afterBody.data.quantity)).toBeGreaterThan(0)
		expect(Number(afterBody.data.costPrice)).toBeGreaterThan(0)

		// Verify our specific movement was recorded
		const movRes = await GET('/inventory/stock/movements', {
			cookie,
			query: {
				materialId: String(SEED_MATERIAL_ID),
				locationId: String(SEED_LOCATION_ID),
				page: '1',
				limit: '100',
			},
		})
		expect(movRes.status).toBe(200)
		const movBody: Json = await movRes.json()
		const ourMovement = movBody.data.find(
			(m: { referenceId: number | null }) => m.referenceId === receivingId,
		)
		expect(ourMovement).toBeDefined()
		expect(ourMovement.direction).toBe('in')
		expect(Number(ourMovement.quantity)).toBe(7)
	})

	// ─── Weighted Average Cost ───

	test('receiving updates weighted avg cost correctly', async () => {
		// Get current balance
		const beforeRes = await GET('/inventory/stock/balance', {
			cookie,
			query: {
				materialId: String(SEED_MATERIAL_ID),
				locationId: String(SEED_LOCATION_ID),
			},
		})
		const before: Json = await beforeRes.json()
		const oldQty = Number(before.data.quantity)
		const oldCost = Number(before.data.costPrice)

		// Create + confirm a receiving with a different cost
		const inQty = 5
		const inCost = 8000
		const createRes = await POST('/inventory/receiving/create', {
			cookie,
			body: {
				locationId: SEED_LOCATION_ID,
				supplierId: SEED_SUPPLIER_ID,
				lines: [
					{
						materialId: SEED_MATERIAL_ID,
						qty: `${inQty}.000000`,
						unitCost: `${inCost}.0000`,
						uomId: SEED_UOM_ID,
					},
				],
			},
		})
		const createBody: Json = await createRes.json()
		await POST('/inventory/receiving/confirm', {
			cookie,
			body: { receivingId: createBody.data.id },
		})

		// Check new balance
		const afterRes = await GET('/inventory/stock/balance', {
			cookie,
			query: {
				materialId: String(SEED_MATERIAL_ID),
				locationId: String(SEED_LOCATION_ID),
			},
		})
		const after: Json = await afterRes.json()
		const newQty = Number(after.data.quantity)
		const newCost = Number(after.data.costPrice)

		// Qty should have increased (at least by inQty, potentially more from concurrency)
		expect(newQty - oldQty).toBeGreaterThanOrEqual(inQty)

		// Cost should be weighted average formula applied
		// Since concurrent tests may interfere, just verify cost is between old and new
		if (inCost > oldCost) {
			expect(newCost).toBeGreaterThanOrEqual(oldCost)
			expect(newCost).toBeLessThanOrEqual(inCost)
		} else {
			expect(newCost).toBeLessThanOrEqual(oldCost)
			expect(newCost).toBeGreaterThanOrEqual(inCost)
		}
	})

	// ─── Stock Movement Records ───

	test('stock movements are recorded', async () => {
		const res = await GET('/inventory/stock/movements', {
			cookie,
			query: {
				materialId: String(SEED_MATERIAL_ID),
				locationId: String(SEED_LOCATION_ID),
				page: '1',
				limit: '50',
			},
		})
		expect(res.status).toBe(200)
		const body: Json = await res.json()
		expect(body.data.length).toBeGreaterThanOrEqual(1)

		// All receiving movements should be inbound
		const receivingMovements = body.data.filter((m: { type: string }) => m.type === 'receiving')
		for (const m of receivingMovements) {
			expect(m.direction).toBe('in')
			expect(Number(m.quantity)).toBeGreaterThan(0)
		}
	})

	// ─── Read Endpoints ───

	test('balance list by location', async () => {
		const res = await GET('/inventory/stock/list', {
			cookie,
			query: {
				locationId: String(SEED_LOCATION_ID),
				page: '1',
				limit: '10',
			},
		})
		expect(res.status).toBe(200)

		const body: Json = await res.json()
		expect(body.data.length).toBeGreaterThanOrEqual(1)
		expect(body.meta).toBeDefined()
	})

	test('balance for non-existent material returns error', async () => {
		const res = await GET('/inventory/stock/balance', {
			cookie,
			query: {
				materialId: '99999',
				locationId: String(SEED_LOCATION_ID),
			},
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	test('movements without auth rejects', async () => {
		const res = await GET('/inventory/stock/movements', {
			query: {
				materialId: String(SEED_MATERIAL_ID),
				locationId: String(SEED_LOCATION_ID),
				page: '1',
				limit: '10',
			},
		})
		expect(res.status).toBeGreaterThanOrEqual(400)
	})

	// ─── Known Gaps (future tests) ───

	test.todo('negative stock is blocked on outbound movement', () => {})
	test.todo('stock transfer between locations updates both balances', () => {})
	test.todo('stock opname adjusts balance to counted qty', () => {})
})
