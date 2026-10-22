import { loginAs } from '../helpers/auth.ts'
import {
	SEED_SUPPLIER_ID,
	createAssignedMaterial,
	createLocation,
	createStoreFixture,
	expectError,
	uomIds,
} from '../helpers/fixtures.ts'
import { DELETE, GET, POST, json } from '../helpers/request.ts'
import {
	SEED_LOCATION_ID as STORE,
	SEED_USERS,
	SEED_WAREHOUSE_ID as WAREHOUSE,
} from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

// Seed: cashier works at the store only; warehouse staff at the warehouse only;
// nobody but the owner has a global assignment.
describe('location-scoped authorization', () => {
	let owner: string
	let cashier: string
	let warehouse: string
	let materialId: number
	let uomId: number

	beforeAll(async () => {
		;[owner, cashier, warehouse] = await Promise.all([
			loginAs(SEED_USERS.owner.username),
			loginAs(SEED_USERS.cashier.username),
			loginAs(SEED_USERS.warehouse.username),
		])
		uomId = (await uomIds(owner)).kg
		materialId = await createAssignedMaterial(owner, {
			baseUomId: uomId,
			locationIds: [STORE, WAREHOUSE],
		})
	})

	const page = { page: '1', limit: '100' }

	async function createReceiving(locationId: number): Promise<number> {
		const res = await POST('/inventory/receiving/create', {
			token: owner,
			body: {
				locationId,
				supplierId: SEED_SUPPLIER_ID,
				lines: [{ materialId, qty: '1', unitCost: '1000', uomId }],
			},
		})
		expect(res.status).toBe(200)
		return (await json<{ data: { id: number } }>(res)).data.id
	}

	async function createTransfer(fromLocationId: number, toLocationId: number): Promise<number> {
		const res = await POST('/inventory/transfer/create', {
			token: owner,
			body: { fromLocationId, toLocationId, lines: [{ materialId, qty: '1', uomId }] },
		})
		expect(res.status).toBe(200)
		return (await json<{ data: { id: number } }>(res)).data.id
	}

	// ─── Guard: locations named by the request ───

	test('a query locationId cannot widen access beyond the user’s grants', async () => {
		const other = await GET('/inventory/stock/list', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: { ...page, locationId: String(STORE) },
		})
		await expectError(other, 403, 'PERMISSION_DENIED')

		const own = await GET('/inventory/stock/list', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: { ...page, locationId: String(WAREHOUSE) },
		})
		expect(own.status).toBe(200)
	})

	test('a body locationId is authorized, not the header', async () => {
		const res = await POST('/inventory/opname/create', {
			token: warehouse,
			locationId: WAREHOUSE,
			body: { locationId: STORE },
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})

	test('per-location reference lists require access at that location', async () => {
		const res = await GET('/material/assignment/by-location', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: { locationId: String(STORE) },
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})

	// ─── Documents addressed by id carry their own location ───

	test('a store receiving is hidden from, and cannot be confirmed by, warehouse staff', async () => {
		const receivingId = await createReceiving(STORE)

		const detail = await GET('/inventory/receiving/detail', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: { id: String(receivingId) },
		})
		await expectError(detail, 403, 'PERMISSION_DENIED')

		const confirm = await POST('/inventory/receiving/confirm', {
			token: warehouse,
			locationId: WAREHOUSE,
			body: { receivingId },
		})
		await expectError(confirm, 403, 'PERMISSION_DENIED')

		const list = await GET('/inventory/receiving/list', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: page,
		})
		expect(list.status).toBe(200)
		const rows = (await json<{ data: { id: number; locationId: number }[] }>(list)).data
		expect(rows.map((row) => row.id)).not.toContain(receivingId)
		for (const row of rows) expect(row.locationId).toBe(WAREHOUSE)

		const ownerDetail = await GET('/inventory/receiving/detail', {
			token: owner,
			query: { id: String(receivingId) },
		})
		expect((await json(ownerDetail)).data.status).toBe('draft')
	})

	test('transfers: readable from either end, shipped only from the source', async () => {
		const otherStore = await createLocation(owner, 'store')
		const assigned = await POST('/material/assignment/assign', {
			token: owner,
			body: { materialId, locationId: otherStore },
		})
		expect(assigned.status).toBe(200)
		const toWarehouse = await createTransfer(STORE, WAREHOUSE)
		const elsewhere = await createTransfer(STORE, otherStore)

		const readable = await GET('/inventory/transfer/detail', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: { id: String(toWarehouse) },
		})
		expect(readable.status).toBe(200)

		const hidden = await GET('/inventory/transfer/detail', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: { id: String(elsewhere) },
		})
		await expectError(hidden, 403, 'PERMISSION_DENIED')

		const ship = await POST('/inventory/transfer/ship', {
			token: warehouse,
			locationId: WAREHOUSE,
			body: { transferId: toWarehouse },
		})
		await expectError(ship, 403, 'PERMISSION_DENIED')

		const list = await GET('/inventory/transfer/list', {
			token: warehouse,
			locationId: WAREHOUSE,
			query: page,
		})
		const rows = (
			await json<{ data: { id: number; fromLocationId: number; toLocationId: number }[] }>(list)
		).data
		const ids = rows.map((row) => row.id)
		expect(ids).toContain(toWarehouse)
		expect(ids).not.toContain(elsewhere)
		for (const row of rows) expect([row.fromLocationId, row.toLocationId]).toContain(WAREHOUSE)
	})

	test('transfers are created at the source and may target any destination', async () => {
		const body = (fromLocationId: number, toLocationId: number) => ({
			fromLocationId,
			toLocationId,
			lines: [{ materialId, qty: '1', uomId }],
		})

		const outbound = await POST('/inventory/transfer/create', {
			token: warehouse,
			locationId: WAREHOUSE,
			body: body(WAREHOUSE, STORE),
		})
		expect(outbound.status).toBe(200)

		const inbound = await POST('/inventory/transfer/create', {
			token: warehouse,
			locationId: WAREHOUSE,
			body: body(STORE, WAREHOUSE),
		})
		await expectError(inbound, 403, 'PERMISSION_DENIED')
	})

	test('a cashier cannot read another store’s menu item or remove its table', async () => {
		const other = await createStoreFixture(owner, { basePrice: '10000' })

		const item = await GET('/menu/item/detail', {
			token: cashier,
			locationId: STORE,
			query: { id: String(other.menuItemId) },
		})
		await expectError(item, 403, 'PERMISSION_DENIED')

		const table = await POST('/pos/table/create', {
			token: owner,
			body: { locationId: other.locationId, number: 'T-OTHER' },
		})
		const tableId = (await json<{ data: { id: number } }>(table)).data.id
		const remove = await DELETE('/pos/table/remove', {
			token: cashier,
			locationId: STORE,
			query: { id: String(tableId) },
		})
		await expectError(remove, 403, 'PERMISSION_DENIED')

		const still = await GET('/pos/table/detail', { token: owner, query: { id: String(tableId) } })
		expect(still.status).toBe(200)
	})

	test('an order cannot seat a table from another location', async () => {
		const [here, there] = await Promise.all([
			createStoreFixture(owner, { basePrice: '10000' }),
			createStoreFixture(owner, { basePrice: '10000' }),
		])
		const table = await POST('/pos/table/create', {
			token: owner,
			body: { locationId: there.locationId, number: 'T-THERE' },
		})
		const tableId = (await json<{ data: { id: number } }>(table)).data.id

		const order = await POST('/pos/order/create', {
			token: owner,
			locationId: here.locationId,
			body: { locationId: here.locationId, type: 'dine_in', tableId },
		})
		expect(order.status).toBeGreaterThanOrEqual(400)
		expect(order.status).toBeLessThan(500)
	})
})
