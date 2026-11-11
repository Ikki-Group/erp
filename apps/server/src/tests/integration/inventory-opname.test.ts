import { loginAs } from '../helpers/auth.ts'
import {
	createAssignedMaterial,
	createLocation,
	expectError,
	receiveStock,
	stockBalance,
	uomIds,
} from '../helpers/fixtures.ts'
import type { StockMovement, UomCode } from '../helpers/fixtures.ts'
import { GET, POST, PUT, json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

/**
 * Stock opname lifecycle: create snapshots every material assigned to the
 * location, counts update draft lines, complete books the variance. Each test
 * uses its own location because an opname covers the whole location.
 */
describe('inventory/opname', () => {
	let token: string
	let uom: Record<UomCode, number>

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
		uom = await uomIds(token)
	})

	/** Fresh location holding one pcs material per entry of `quantities` (null = no stock). */
	async function locationWithStock(
		quantities: Array<string | null>,
	): Promise<{ locationId: number; materialIds: number[] }> {
		const locationId = await createLocation(token, 'warehouse')
		const materialIds: number[] = []
		for (const qty of quantities) {
			const materialId = await createAssignedMaterial(token, {
				baseUomId: uom.pcs,
				locationIds: [locationId],
			})
			if (qty !== null) {
				await receiveStock(token, { locationId, materialId, uomId: uom.pcs, qty, unitCost: '100' })
			}
			materialIds.push(materialId)
		}
		return { locationId, materialIds }
	}

	async function createOpname(locationId: number): Promise<number> {
		const res = await POST('/inventory/opname/create', { token, body: { locationId } })
		expect(res.status).toBe(200)
		return (await json(res)).data.id
	}

	async function opnameDetail(opnameId: number) {
		const res = await GET('/inventory/opname/detail', { token, query: { id: String(opnameId) } })
		expect(res.status).toBe(200)
		type Detail = { status: string; lines: Array<{ materialId: number; systemQty: string }> }
		return (await json<{ data: Detail }>(res)).data
	}

	test('complete adjusts each counted material to its counted quantity', async () => {
		const {
			locationId,
			materialIds: [shrunk, grown, empty],
		} = await locationWithStock(['10', '5', null])
		if (shrunk === undefined || grown === undefined || empty === undefined) throw new Error('setup')

		const opnameId = await createOpname(locationId)
		const snapshot = await opnameDetail(opnameId)
		const systemQtyOf = (materialId: number) =>
			Number(snapshot.lines.find((l) => l.materialId === materialId)?.systemQty)
		expect([systemQtyOf(shrunk), systemQtyOf(grown), systemQtyOf(empty)]).toEqual([10, 5, 0])

		const counted = await PUT('/inventory/opname/counts', {
			token,
			body: {
				opnameId,
				lines: [
					{ materialId: shrunk, countedQty: '7', reason: 'Spillage' },
					{ materialId: grown, countedQty: '8' },
				],
			},
		})
		expect(counted.status).toBe(200)
		// Counting alone does not touch stock.
		expect((await stockBalance(token, shrunk, locationId))?.quantity).toBe(10)

		const completed = await POST('/inventory/opname/complete', { token, body: { opnameId } })
		expect(completed.status).toBe(200)

		expect((await stockBalance(token, shrunk, locationId))?.quantity).toBe(7)
		expect((await stockBalance(token, grown, locationId))?.quantity).toBe(8)
		// Uncounted material keeps its snapshot (zero variance) — no movement recorded.
		expect(await stockBalance(token, empty, locationId)).toBeUndefined()

		const movements = await GET('/inventory/stock/movements', {
			token,
			query: {
				materialId: String(shrunk),
				locationId: String(locationId),
				page: '1',
				limit: '100',
			},
		})
		const adjustment = (await json<{ data: StockMovement[] }>(movements)).data.find(
			(m) => m.referenceType === 'opname' && m.referenceId === opnameId,
		)
		expect({ type: adjustment?.type, quantity: Number(adjustment?.quantity) }).toEqual({
			type: 'adjustment_out',
			quantity: 3,
		})

		expect((await opnameDetail(opnameId)).status).toBe('completed')
	})

	test('a completed opname cannot be completed again or recounted', async () => {
		const {
			locationId,
			materialIds: [materialId],
		} = await locationWithStock(['4'])
		if (materialId === undefined) throw new Error('setup')
		const opnameId = await createOpname(locationId)
		await PUT('/inventory/opname/counts', {
			token,
			body: { opnameId, lines: [{ materialId, countedQty: '1' }] },
		})
		await POST('/inventory/opname/complete', { token, body: { opnameId } })

		const again = await POST('/inventory/opname/complete', { token, body: { opnameId } })
		await expectError(again, 400, 'OPNAME_ALREADY_COMPLETED')

		const recount = await PUT('/inventory/opname/counts', {
			token,
			body: { opnameId, lines: [{ materialId, countedQty: '4' }] },
		})
		await expectError(recount, 400, 'OPNAME_ALREADY_COMPLETED')

		expect((await stockBalance(token, materialId, locationId))?.quantity).toBe(1)
	})

	test('counts for a material outside the opname are rejected', async () => {
		const { locationId } = await locationWithStock(['1'])
		const outsider = await createAssignedMaterial(token, {
			baseUomId: uom.pcs,
			locationIds: [await createLocation(token, 'warehouse')],
		})
		const opnameId = await createOpname(locationId)

		const res = await PUT('/inventory/opname/counts', {
			token,
			body: { opnameId, lines: [{ materialId: outsider, countedQty: '1' }] },
		})
		await expectError(res, 400, 'OPNAME_LINE_NOT_FOUND')
	})

	test('create rejects a location with no assigned materials', async () => {
		const locationId = await createLocation(token, 'warehouse')
		const res = await POST('/inventory/opname/create', { token, body: { locationId } })
		await expectError(res, 400, 'OPNAME_NO_MATERIALS_AT_LOCATION')
	})

	test('completing an unknown opname returns 404', async () => {
		const res = await POST('/inventory/opname/complete', {
			token,
			body: { opnameId: 2_000_000_000 },
		})
		await expectError(res, 404, 'OPNAME_NOT_FOUND')
	})

	test('cashier cannot start an opname', async () => {
		const cashier = await loginAs(SEED_USERS.cashier.username)
		const res = await POST('/inventory/opname/create', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			body: { locationId: SEED_LOCATION_ID },
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})
})
