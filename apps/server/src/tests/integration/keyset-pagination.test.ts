import { auditLogs } from '@/db/schema/audit.ts'
import { stockMovements } from '@/db/schema/inventory.ts'
import { orders } from '@/db/schema/pos.ts'

import { db, sql } from '@/infra/database/index.ts'

import { loginAs } from '../helpers/auth.ts'
import {
	createLocation,
	createMaterial,
	createStoreFixture,
	expectError,
	uniqueSuffix,
	uomIds,
} from '../helpers/fixtures.ts'
import { GET, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

/**
 * Keyset (cursor) list endpoints: every page walk must return exactly the rows of the offset
 * list for the same filter, in the same order, with `(timestamp desc, id desc)` tiebreaking.
 *
 * Rows are inserted directly so several share a timestamp (tiebreaker) and two differ only
 * below the millisecond (cursor must keep Postgres microsecond precision).
 */

// Microsecond UTC timestamps; groups share a value to exercise the id tiebreaker.
const TIMESTAMPS = [
	'2024-03-01T10:00:00.000000Z',
	'2024-03-01T10:00:00.000000Z',
	'2024-03-01T10:00:00.000000Z',
	'2024-03-02T08:30:00.123456Z',
	'2024-03-02T08:30:00.123789Z',
	'2024-03-03T12:00:00.500000Z',
	'2024-03-03T12:00:00.500000Z',
] as const
const PAGE_LIMIT = 3

interface Inserted {
	id: number
	at: string
}

/** Expected list order: timestamp desc, id desc (fixed-width ISO strings sort lexically). */
function expectedOrder(rows: Inserted[]): number[] {
	return rows
		.toSorted((a, b) => (a.at === b.at ? b.id - a.id : a.at < b.at ? 1 : -1))
		.map((row) => row.id)
}

async function walkCursor(
	path: string,
	token: string,
	query: Record<string, string>,
): Promise<{ ids: number[]; pages: number[][] }> {
	const pages: number[][] = []
	let cursor: string | null = null
	do {
		const response = await GET(path, {
			token,
			query: { ...query, limit: String(PAGE_LIMIT), ...(cursor ? { cursor } : {}) },
		})
		const body = await json(response)
		expect(response.status).toBe(200)
		expect(body.meta.limit).toBe(PAGE_LIMIT)
		const ids = (body.data as Array<{ id: number }>).map((row) => row.id)
		expect(ids.length).toBeLessThanOrEqual(PAGE_LIMIT)
		pages.push(ids)
		cursor = body.meta.nextCursor
		if (cursor !== null) expect(ids.length).toBe(PAGE_LIMIT)
		expect(pages.length).toBeLessThanOrEqual(10)
	} while (cursor !== null)
	return { ids: pages.flat(), pages }
}

async function offsetIds(
	path: string,
	token: string,
	query: Record<string, string>,
): Promise<number[]> {
	const response = await GET(path, { token, query: { ...query, page: '1', limit: '100' } })
	expect(response.status).toBe(200)
	const body = await json(response)
	return (body.data as Array<{ id: number }>).map((row) => row.id)
}

function encode(value: unknown): string {
	return Buffer.from(JSON.stringify(value)).toString('base64url')
}

const GARBAGE_CURSORS = [
	'not-a-cursor',
	'',
	encode({ at: '2024-03-01T10:00:00.000000Z', id: 1 }),
	encode(['2024-03-01T10:00:00.000Z', 1]),
	encode(['2024-02-30T10:00:00.000000Z', 1]),
	encode(['2024-03-01T10:00:00.000000Z', -1]),
	encode(['2024-03-01T10:00:00.000000Z', 1.5]),
	encode(['2024-03-01T10:00:00.000000Z', 1, 2]),
]

async function expectInvalidCursors(path: string, token: string, query: Record<string, string>) {
	for (const cursor of GARBAGE_CURSORS) {
		await expectError(
			await GET(path, { token, query: { ...query, cursor } }),
			400,
			'INVALID_CURSOR',
		)
	}
}

describe('keyset pagination', () => {
	let owner: string
	let cashier: string

	beforeAll(async () => {
		owner = await loginAs(SEED_USERS.owner.username)
		cashier = await loginAs(SEED_USERS.cashier.username)
	})

	describe('GET /inventory/stock/movements/cursor', () => {
		const path = '/inventory/stock/movements/cursor'
		let query: Record<string, string>
		let inserted: Inserted[]

		beforeAll(async () => {
			const locationId = await createLocation(owner)
			const materialId = await createMaterial(owner, { baseUomId: (await uomIds(owner)).kg })
			query = { materialId: String(materialId), locationId: String(locationId) }
			inserted = []
			for (const at of TIMESTAMPS) {
				const [row] = await db
					.insert(stockMovements)
					.values({
						materialId,
						locationId,
						type: 'adjustment_in',
						direction: 'in',
						quantity: '1',
						costPrice: '1',
						createdAt: sql`${at}::timestamptz`,
					})
					.returning({ id: stockMovements.id })
				if (!row) throw new Error('movement insert returned no row')
				inserted.push({ id: row.id, at })
			}
		})

		test('walks every row once in offset-list order', async () => {
			const { ids, pages } = await walkCursor(path, owner, query)
			expect(pages.map((page) => page.length)).toEqual([3, 3, 1])
			expect(new Set(ids).size).toBe(ids.length)
			expect(ids).toEqual(expectedOrder(inserted))
			expect(ids).toEqual(await offsetIds('/inventory/stock/movements', owner, query))
		})

		test('applies the offset-list filters', async () => {
			const response = await GET(path, { token: owner, query: { ...query, direction: 'out' } })
			expect(response.status).toBe(200)
			const body = await json(response)
			expect(body.data).toEqual([])
			expect(body.meta.nextCursor).toBeNull()
		})

		test('rejects malformed cursors with 400 INVALID_CURSOR', async () => {
			await expectInvalidCursors(path, owner, query)
		})

		test('cashier gets the same access as on the offset list', async () => {
			const offset = await GET('/inventory/stock/movements', { token: cashier, query })
			const cursor = await GET(path, { token: cashier, query })
			expect(cursor.status).toBe(offset.status)
		})
	})

	describe('GET /audit/list/cursor', () => {
		const path = '/audit/list/cursor'
		let query: Record<string, string>
		let inserted: Inserted[]

		beforeAll(async () => {
			const module = `ks_${uniqueSuffix()}`
			query = { module }
			inserted = []
			for (const [index, at] of TIMESTAMPS.entries()) {
				const [row] = await db
					.insert(auditLogs)
					.values({
						timestamp: sql`${at}::timestamptz`,
						userId: 1,
						userName: 'keyset test',
						module,
						entity: 'keyset',
						entityId: index + 1,
						action: 'create',
						summary: `keyset row ${index}`,
					})
					.returning({ id: auditLogs.id })
				if (!row) throw new Error('audit insert returned no row')
				inserted.push({ id: row.id, at })
			}
		})

		test('walks every row once in offset-list order', async () => {
			const { ids, pages } = await walkCursor(path, owner, query)
			expect(pages.map((page) => page.length)).toEqual([3, 3, 1])
			expect(new Set(ids).size).toBe(ids.length)
			expect(ids).toEqual(expectedOrder(inserted))
			expect(ids).toEqual(await offsetIds('/audit/list', owner, query))
		})

		test('applies the date range filter like the offset list', async () => {
			const range = {
				...query,
				dateFrom: '2024-03-02T00:00:00.000Z',
				dateTo: '2024-03-02T23:59:59.999Z',
			}
			const { ids } = await walkCursor(path, owner, range)
			expect(ids).toEqual(expectedOrder(inserted.filter((row) => row.at.startsWith('2024-03-02'))))
			expect(ids).toEqual(await offsetIds('/audit/list', owner, range))
		})

		test('rejects malformed cursors with 400 INVALID_CURSOR', async () => {
			await expectInvalidCursors(path, owner, query)
		})

		test('cashier is denied like on the offset list', async () => {
			await expectError(
				await GET('/audit/list', { token: cashier, query }),
				403,
				'PERMISSION_DENIED',
			)
			await expectError(await GET(path, { token: cashier, query }), 403, 'PERMISSION_DENIED')
		})
	})

	describe('GET /pos/order/list/cursor', () => {
		const path = '/pos/order/list/cursor'
		let query: Record<string, string>
		let inserted: Inserted[]

		beforeAll(async () => {
			const store = await createStoreFixture(owner, { basePrice: '10000' })
			query = { locationId: String(store.locationId) }
			const suffix = uniqueSuffix()
			inserted = []
			// Six rows: an exact multiple of the page size, so the last full page must still end
			// the walk with `nextCursor: null`.
			for (const [index, at] of TIMESTAMPS.slice(0, 6).entries()) {
				const [row] = await db
					.insert(orders)
					.values({
						orderNo: `KS-${suffix}-${index}`,
						locationId: store.locationId,
						shiftId: store.shiftId,
						type: 'dine_in',
						status: index % 2 === 0 ? 'open' : 'voided',
						orderedAt: sql`${at}::timestamptz`,
					})
					.returning({ id: orders.id })
				if (!row) throw new Error('order insert returned no row')
				inserted.push({ id: row.id, at })
			}
		})

		test('walks every row once in offset-list order; full last page ends the walk', async () => {
			const { ids, pages } = await walkCursor(path, owner, query)
			expect(pages.map((page) => page.length)).toEqual([3, 3])
			expect(new Set(ids).size).toBe(ids.length)
			expect(ids).toEqual(expectedOrder(inserted))
			expect(ids).toEqual(await offsetIds('/pos/order/list', owner, query))
		})

		test('applies the status filter like the offset list', async () => {
			const open = { ...query, status: 'open' }
			const { ids } = await walkCursor(path, owner, open)
			expect(ids).toEqual(expectedOrder(inserted.filter((_, index) => index % 2 === 0)))
			expect(ids).toEqual(await offsetIds('/pos/order/list', owner, open))
		})

		test('rejects malformed cursors with 400 INVALID_CURSOR', async () => {
			await expectInvalidCursors(path, owner, query)
		})

		test('cashier gets the same access as on the offset list', async () => {
			const offset = await GET('/pos/order/list', { token: cashier, query })
			const cursor = await GET(path, { token: cashier, query })
			expect(cursor.status).toBe(offset.status)
		})
	})
})
