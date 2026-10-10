import { loginAs } from '../helpers/auth.ts'
import { createId, createLocation } from '../helpers/fixtures.ts'
import { DELETE, GET, POST, json } from '../helpers/request.ts'
import {
	SEED_LOCATION_ID,
	SEED_MATERIAL_ID,
	SEED_USERS,
	SEED_WAREHOUSE_ID,
} from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

// Seed: cashier works at the store only; multi-location is cashier at the store and
// warehouse staff at the warehouse, with no global role.
describe('location-scoped authorization', () => {
	let cashier: string
	let multi: string

	beforeAll(async () => {
		cashier = await loginAs(SEED_USERS.cashier.username)
		multi = await loginAs(SEED_USERS.multiLocation.username)
	})

	test('a query locationId cannot widen access beyond the active-location header', async () => {
		const res = await GET('/inventory/stock/list', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			query: { page: '1', limit: '5', locationId: String(SEED_WAREHOUSE_ID) },
		})
		expect(res.status).toBe(403)
		expect((await json(res)).error.code).toBe('PERMISSION_DENIED')
	})

	test('the same request for an accessible location passes', async () => {
		const res = await GET('/inventory/stock/list', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			query: { page: '1', limit: '5', locationId: String(SEED_LOCATION_ID) },
		})
		expect(res.status).toBe(200)
	})

	test('a multi-location user without a global role gets the consolidated summary', async () => {
		const res = await GET('/inventory/summary', { token: multi })
		expect(res.status).toBe(200)
		const ids = (await json<{ data: { id: number }[] }>(res)).data
			.map((row) => row.id)
			.toSorted((a, b) => a - b)
		expect(ids).toEqual([SEED_LOCATION_ID, SEED_WAREHOUSE_ID].toSorted((a, b) => a - b))
	})

	// ─── Documents addressed by id carry their own location ───

	describe('documents addressed by id', () => {
		const SEED_SUPPLIER_ID = 1
		const SEED_UOM_ID = 1
		let owner: string
		/** A third location neither cashier nor multi-location can access. */
		let otherStore: number

		beforeAll(async () => {
			owner = await loginAs(SEED_USERS.owner.username)
			otherStore = await createLocation(owner, 'store')
			const assigned = await POST('/material/assignment/assign', {
				token: owner,
				body: { materialId: SEED_MATERIAL_ID, locationId: otherStore },
			})
			expect(assigned.status).toBe(200)
		})

		test('a receiving at the store is hidden from a warehouse-only reader', async () => {
			const receivingId = await createId('/inventory/receiving/create', owner, {
				locationId: SEED_LOCATION_ID,
				supplierId: SEED_SUPPLIER_ID,
				lines: [{ materialId: SEED_MATERIAL_ID, qty: '1', unitCost: '1000', uomId: SEED_UOM_ID }],
			})
			// multi-location holds receiving.* only at the warehouse.
			const detail = await GET('/inventory/receiving/detail', {
				token: multi,
				locationId: SEED_WAREHOUSE_ID,
				query: { id: String(receivingId) },
			})
			expect(detail.status).toBe(403)
			expect((await json(detail)).error.code).toBe('PERMISSION_DENIED')

			const confirm = await POST('/inventory/receiving/confirm', {
				token: multi,
				locationId: SEED_WAREHOUSE_ID,
				body: { receivingId },
			})
			expect(confirm.status).toBe(403)

			const ownerDetail = await GET('/inventory/receiving/detail', {
				token: owner,
				query: { id: String(receivingId) },
			})
			expect((await json(ownerDetail)).data.status).toBe('draft')
		})

		test('cashier cannot read or remove another location’s menu item and table', async () => {
			const itemId = await createId('/menu/item/create', owner, {
				locationId: otherStore,
				sku: `SKU-${crypto.randomUUID().slice(0, 8)}`,
				name: 'Other store item',
				basePrice: '10000',
			})
			const item = await GET('/menu/item/detail', {
				token: cashier,
				locationId: SEED_LOCATION_ID,
				query: { id: String(itemId) },
			})
			expect(item.status).toBe(403)

			const tableId = await createId('/pos/table/create', owner, {
				locationId: otherStore,
				number: 'T-OTHER',
			})
			const remove = await DELETE('/pos/table/remove', {
				token: cashier,
				locationId: SEED_LOCATION_ID,
				query: { id: String(tableId) },
			})
			expect(remove.status).toBe(403)
			const still = await GET('/pos/table/detail', { token: owner, query: { id: String(tableId) } })
			expect(still.status).toBe(200)
		})

		test('transfer list and detail only expose transfers touching an allowed location', async () => {
			const line = { materialId: SEED_MATERIAL_ID, qty: '1', uomId: SEED_UOM_ID }
			const toWarehouse = await createId('/inventory/transfer/create', owner, {
				fromLocationId: SEED_LOCATION_ID,
				toLocationId: SEED_WAREHOUSE_ID,
				lines: [line],
			})
			const elsewhere = await createId('/inventory/transfer/create', owner, {
				fromLocationId: SEED_LOCATION_ID,
				toLocationId: otherStore,
				lines: [line],
			})

			// multi-location reads transfers only at the warehouse; no locationId in the query.
			const list = await GET('/inventory/transfer/list', {
				token: multi,
				locationId: SEED_WAREHOUSE_ID,
				query: { page: '1', limit: '100' },
			})
			expect(list.status).toBe(200)
			const rows = (
				await json<{ data: { id: number; fromLocationId: number; toLocationId: number }[] }>(list)
			).data
			for (const row of rows) {
				expect([row.fromLocationId, row.toLocationId]).toContain(SEED_WAREHOUSE_ID)
			}
			const ids = rows.map((row) => row.id)
			expect(ids).toContain(toWarehouse)
			expect(ids).not.toContain(elsewhere)

			const readable = await GET('/inventory/transfer/detail', {
				token: multi,
				locationId: SEED_WAREHOUSE_ID,
				query: { id: String(toWarehouse) },
			})
			expect(readable.status).toBe(200)
			const hidden = await GET('/inventory/transfer/detail', {
				token: multi,
				locationId: SEED_WAREHOUSE_ID,
				query: { id: String(elsewhere) },
			})
			expect(hidden.status).toBe(403)

			// Shipping is checked at the source: the store, where multi-location has no transfer.ship.
			const ship = await POST('/inventory/transfer/ship', {
				token: multi,
				locationId: SEED_WAREHOUSE_ID,
				body: { transferId: toWarehouse },
			})
			expect(ship.status).toBe(403)
		})
	})
})
