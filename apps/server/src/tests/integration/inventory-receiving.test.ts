import { loginAs } from '../helpers/auth.ts'
import {
	SEED_SUPPLIER_ID,
	createAssignedMaterial,
	createLocation,
	createMaterial,
	expectError,
	stockBalance,
	uomIds,
} from '../helpers/fixtures.ts'
import type { UomCode } from '../helpers/fixtures.ts'
import { GET, POST, PUT, json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

/**
 * Receiving lifecycle: draft → confirmed, with stock inbound on confirm.
 * Every test uses its own material at a dedicated warehouse so stock
 * assertions are exact despite concurrent test execution.
 */
describe('inventory/receiving', () => {
	let token: string
	let uom: Record<UomCode, number>
	let locationId: number

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
		uom = await uomIds(token)
		locationId = await createLocation(token, 'warehouse')
	})

	async function createDraft(
		lines: Array<{ materialId: number; qty: string; unitCost: string; uomId: number }>,
	) {
		const res = await POST('/inventory/receiving/create', {
			token,
			body: { locationId, supplierId: SEED_SUPPLIER_ID, lines },
		})
		expect(res.status).toBe(200)
		return (await json(res)).data.id as number
	}

	test('confirm converts purchase UoM to base qty/cost and averages cost across receipts', async () => {
		const materialId = await createAssignedMaterial(token, {
			baseUomId: uom.g,
			locationIds: [locationId],
		})

		// 2 kg @ 50,000/kg → 2,000 g @ 50/g
		const first = await createDraft([{ materialId, qty: '2', unitCost: '50000', uomId: uom.kg }])
		expect(await stockBalance(token, materialId, locationId)).toBeUndefined()

		const confirmed = await POST('/inventory/receiving/confirm', {
			token,
			body: { receivingId: first },
		})
		expect(confirmed.status).toBe(200)
		expect(await stockBalance(token, materialId, locationId)).toEqual({
			quantity: 2000,
			costPrice: 50,
		})

		// 1,000 g @ 80/g → (2000·50 + 1000·80) / 3000 = 60/g
		const second = await createDraft([{ materialId, qty: '1000', unitCost: '80', uomId: uom.g }])
		await POST('/inventory/receiving/confirm', { token, body: { receivingId: second } })
		expect(await stockBalance(token, materialId, locationId)).toEqual({
			quantity: 3000,
			costPrice: 60,
		})

		const detail = await GET('/inventory/receiving/detail', { token, query: { id: String(first) } })
		expect((await json(detail)).data.status).toBe('confirmed')
	})

	test('confirming twice is rejected and does not add stock again', async () => {
		const materialId = await createAssignedMaterial(token, {
			baseUomId: uom.pcs,
			locationIds: [locationId],
		})
		const receivingId = await createDraft([
			{ materialId, qty: '10', unitCost: '1000', uomId: uom.pcs },
		])

		await POST('/inventory/receiving/confirm', { token, body: { receivingId } })
		const again = await POST('/inventory/receiving/confirm', { token, body: { receivingId } })
		await expectError(again, 400, 'RECEIVING_ALREADY_CONFIRMED')

		expect((await stockBalance(token, materialId, locationId))?.quantity).toBe(10)
	})

	test('a confirmed receiving can no longer be edited', async () => {
		const materialId = await createAssignedMaterial(token, {
			baseUomId: uom.pcs,
			locationIds: [locationId],
		})
		const receivingId = await createDraft([
			{ materialId, qty: '1', unitCost: '1000', uomId: uom.pcs },
		])
		await POST('/inventory/receiving/confirm', { token, body: { receivingId } })

		const res = await PUT('/inventory/receiving/update', {
			token,
			body: { receivingId, lines: [{ materialId, qty: '99', unitCost: '1000', uomId: uom.pcs }] },
		})
		await expectError(res, 400, 'RECEIVING_NOT_DRAFT')
		expect((await stockBalance(token, materialId, locationId))?.quantity).toBe(1)
	})

	test('draft line edits replace the lines that confirm books into stock', async () => {
		const materialId = await createAssignedMaterial(token, {
			baseUomId: uom.pcs,
			locationIds: [locationId],
		})
		const receivingId = await createDraft([
			{ materialId, qty: '5', unitCost: '1000', uomId: uom.pcs },
		])

		const updated = await PUT('/inventory/receiving/update', {
			token,
			body: { receivingId, lines: [{ materialId, qty: '8', unitCost: '1500', uomId: uom.pcs }] },
		})
		expect(updated.status).toBe(200)

		await POST('/inventory/receiving/confirm', { token, body: { receivingId } })
		expect(await stockBalance(token, materialId, locationId)).toEqual({
			quantity: 8,
			costPrice: 1500,
		})
	})

	test('create rejects a material not assigned to the location', async () => {
		const materialId = await createMaterial(token, { baseUomId: uom.pcs })
		const res = await POST('/inventory/receiving/create', {
			token,
			body: {
				locationId,
				supplierId: SEED_SUPPLIER_ID,
				lines: [{ materialId, qty: '1', unitCost: '1', uomId: uom.pcs }],
			},
		})
		await expectError(res, 400, 'RECEIVING_MATERIAL_NOT_ASSIGNED')
	})

	test('create rejects a UoM with no conversion path to the material base UoM', async () => {
		const materialId = await createAssignedMaterial(token, {
			baseUomId: uom.g,
			locationIds: [locationId],
		})
		const res = await POST('/inventory/receiving/create', {
			token,
			body: {
				locationId,
				supplierId: SEED_SUPPLIER_ID,
				lines: [{ materialId, qty: '1', unitCost: '1', uomId: uom.ml }],
			},
		})
		await expectError(res, 400, 'RECEIVING_UOM_NOT_CONVERTIBLE')
	})

	test('confirming an unknown receiving returns 404', async () => {
		const res = await POST('/inventory/receiving/confirm', {
			token,
			body: { receivingId: 2_000_000_000 },
		})
		await expectError(res, 404, 'RECEIVING_NOT_FOUND')
	})

	test('cashier cannot create receivings', async () => {
		const cashier = await loginAs(SEED_USERS.cashier.username)
		const res = await POST('/inventory/receiving/create', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			body: {
				locationId: SEED_LOCATION_ID,
				supplierId: SEED_SUPPLIER_ID,
				lines: [{ materialId: 1, qty: '1', unitCost: '1', uomId: uom.kg }],
			},
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})
})
