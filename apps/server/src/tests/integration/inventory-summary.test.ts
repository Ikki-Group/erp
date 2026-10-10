import { loginAs } from '../helpers/auth.ts'
import { GET, json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS, SEED_WAREHOUSE_ID } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

type Summary = {
	id: number
	code: string
	name: string
	type: string
	lowStockCount: number
	negativeStockCount: number
	transfersInTransit: number
	activeOpname: number
	draftReceivings: number
}

const COUNT_KEYS = [
	'lowStockCount',
	'negativeStockCount',
	'transfersInTransit',
	'activeOpname',
	'draftReceivings',
] as const

describe('inventory/summary', () => {
	test('owner sees every active location with numeric counts', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const res = await GET('/inventory/summary', { token })
		expect(res.status).toBe(200)
		const { data } = await json<{ data: Summary[] }>(res)
		const ids = data.map((row) => row.id)
		expect(ids).toContain(SEED_LOCATION_ID)
		expect(ids).toContain(SEED_WAREHOUSE_ID)
		for (const row of data) {
			expect(typeof row.code).toBe('string')
			expect(typeof row.name).toBe('string')
			expect(['store', 'warehouse']).toContain(row.type)
			for (const key of COUNT_KEYS) {
				expect(Number.isInteger(row[key])).toBe(true)
				expect(row[key]).toBeGreaterThanOrEqual(0)
			}
		}
	})

	test('cashier only sees their own location', async () => {
		const token = await loginAs(SEED_USERS.cashier.username)
		const res = await GET('/inventory/summary', { token, locationId: SEED_LOCATION_ID })
		expect(res.status).toBe(200)
		const { data } = await json<{ data: Summary[] }>(res)
		expect(data.map((row) => row.id)).toEqual([SEED_LOCATION_ID])
	})
})
