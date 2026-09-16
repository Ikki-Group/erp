import { loginAs } from '../helpers/auth.ts'
import { GET, POST } from '../helpers/request.ts'
import {
	SEED_LOCATION_ID,
	SEED_MATERIAL_ID,
	SEED_USERS,
	SEED_WAREHOUSE_ID,
} from '../helpers/seed.ts'
import { describe, expect, test, beforeAll } from 'bun:test'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test assertions on untyped JSON
type Json = any

/**
 * Server-side date-range filtering on the inventory list endpoints
 * (transfer / opname / receiving). Each list filters on `createdAt`.
 *
 * The suite runs concurrently against a shared seeded DB, so assertions are
 * self-contained: a freshly-created record lands at "now", so a range that
 * straddles now must include it and a range wholly in the past must exclude it.
 * The past-range case is the one that proves the fix — the old client-only
 * filter left pagination/count reflecting the unfiltered set.
 */
describe('inventory list date-range filter', () => {
	let cookie: string

	const SEED_SUPPLIER_ID = 1
	const SEED_UOM_ID = 1

	const hour = 60 * 60 * 1000
	const iso = (ms: number) => new Date(ms).toISOString()

	beforeAll(async () => {
		cookie = await loginAs(SEED_USERS.owner.username)
	})

	/** Given a list path and a just-created id, assert include/exclude by range. */
	async function assertRangeFiltering(
		path: string,
		createdId: number,
		extraQuery: Record<string, string> = {},
	) {
		const now = Date.now()

		const inRange: Json = await (
			await GET(path, {
				cookie,
				locationId: SEED_LOCATION_ID,
				query: {
					page: '1',
					limit: '100',
					dateFrom: iso(now - hour),
					dateTo: iso(now + hour),
					...extraQuery,
				},
			})
		).json()
		expect((inRange.data as Array<{ id: number }>).some((r) => r.id === createdId)).toBe(true)

		const pastRes = await GET(path, {
			cookie,
			locationId: SEED_LOCATION_ID,
			query: {
				page: '1',
				limit: '100',
				dateFrom: iso(now - 48 * hour),
				dateTo: iso(now - 24 * hour),
				...extraQuery,
			},
		})
		expect(pastRes.status).toBe(200)
		const past: Json = await pastRes.json()
		expect((past.data as Array<{ id: number }>).some((r) => r.id === createdId)).toBe(false)
		for (const row of past.data as Array<{ createdAt: string }>) {
			const t = new Date(row.createdAt).getTime()
			expect(t).toBeLessThanOrEqual(now - 24 * hour)
			expect(t).toBeGreaterThanOrEqual(now - 48 * hour)
		}
	}

	test('receiving list filters by createdAt range', async () => {
		const createRes = await POST('/inventory/receiving/create', {
			cookie,
			body: {
				locationId: SEED_LOCATION_ID,
				supplierId: SEED_SUPPLIER_ID,
				lines: [
					{
						materialId: SEED_MATERIAL_ID,
						qty: '1.000000',
						unitCost: '5000.0000',
						uomId: SEED_UOM_ID,
					},
				],
			},
		})
		expect(createRes.status).toBe(200)
		const createBody: Json = await createRes.json()
		const id = createBody.data.id as number
		await assertRangeFiltering('/inventory/receiving/list', id)
	})

	test('transfer list filters by createdAt range', async () => {
		const createRes = await POST('/inventory/transfer/create', {
			cookie,
			body: {
				fromLocationId: SEED_LOCATION_ID,
				toLocationId: SEED_WAREHOUSE_ID,
				lines: [{ materialId: SEED_MATERIAL_ID, qty: '1.000000', uomId: SEED_UOM_ID }],
			},
		})
		expect(createRes.status).toBe(200)
		const createBody: Json = await createRes.json()
		const id = createBody.data.id as number
		await assertRangeFiltering('/inventory/transfer/list', id)
	})

	test('opname list filters by createdAt range', async () => {
		const createRes = await POST('/inventory/opname/create', {
			cookie,
			body: { locationId: SEED_LOCATION_ID },
		})
		expect(createRes.status).toBe(200)
		const createBody: Json = await createRes.json()
		const id = createBody.data.id as number
		await assertRangeFiltering('/inventory/opname/list', id, {
			locationId: String(SEED_LOCATION_ID),
		})
	})
})
