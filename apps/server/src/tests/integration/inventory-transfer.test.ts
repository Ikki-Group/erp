import { loginAs } from '../helpers/auth.ts'
import {
	createAssignedMaterial,
	createLocation,
	expectError,
	receiveStock,
	stockBalance,
	uomIds,
} from '../helpers/fixtures.ts'
import type { UomCode } from '../helpers/fixtures.ts'
import { GET, POST, json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

/**
 * Transfer lifecycle: requested → in_transit (ship, source out) → received
 * (destination in). Each test owns its material at dedicated locations.
 */
describe('inventory/transfer', () => {
	let token: string
	let uom: Record<UomCode, number>
	let fromLocationId: number
	let toLocationId: number

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
		uom = await uomIds(token)
		fromLocationId = await createLocation(token, 'warehouse')
		toLocationId = await createLocation(token, 'store')
	})

	/** Material at both locations with `qty` pcs at 1,000 each in the source. */
	async function stockedMaterial(qty: string): Promise<number> {
		const materialId = await createAssignedMaterial(token, {
			baseUomId: uom.pcs,
			locationIds: [fromLocationId, toLocationId],
		})
		await receiveStock(token, {
			locationId: fromLocationId,
			materialId,
			uomId: uom.pcs,
			qty,
			unitCost: '1000',
		})
		return materialId
	}

	async function requestTransfer(materialId: number, qty: string): Promise<number> {
		const res = await POST('/inventory/transfer/create', {
			token,
			body: { fromLocationId, toLocationId, lines: [{ materialId, qty, uomId: uom.pcs }] },
		})
		expect(res.status).toBe(200)
		return (await json(res)).data.id
	}

	async function transferStatus(transferId: number): Promise<string> {
		const res = await GET('/inventory/transfer/detail', {
			token,
			query: { id: String(transferId) },
		})
		return (await json(res)).data.status
	}

	test('ship deducts the source and receive credits the destination at the source cost', async () => {
		const materialId = await stockedMaterial('10')
		const transferId = await requestTransfer(materialId, '4')

		const shipped = await POST('/inventory/transfer/ship', { token, body: { transferId } })
		expect(shipped.status).toBe(200)
		expect(await transferStatus(transferId)).toBe('in_transit')
		expect((await stockBalance(token, materialId, fromLocationId))?.quantity).toBe(6)
		expect(await stockBalance(token, materialId, toLocationId)).toBeUndefined()

		const received = await POST('/inventory/transfer/receive', {
			token,
			body: { transferId, lines: [{ materialId, receivedQty: '4' }] },
		})
		expect(received.status).toBe(200)
		expect(await transferStatus(transferId)).toBe('received')
		expect(await stockBalance(token, materialId, toLocationId)).toEqual({
			quantity: 4,
			costPrice: 1000,
		})
	})

	test('partial receipts keep the transfer in transit until fully received', async () => {
		const materialId = await stockedMaterial('5')
		const transferId = await requestTransfer(materialId, '5')
		await POST('/inventory/transfer/ship', { token, body: { transferId } })

		await POST('/inventory/transfer/receive', {
			token,
			body: { transferId, lines: [{ materialId, receivedQty: '2' }] },
		})
		expect(await transferStatus(transferId)).toBe('in_transit')
		expect((await stockBalance(token, materialId, toLocationId))?.quantity).toBe(2)

		await POST('/inventory/transfer/receive', {
			token,
			body: { transferId, lines: [{ materialId, receivedQty: '3' }] },
		})
		expect(await transferStatus(transferId)).toBe('received')
		expect((await stockBalance(token, materialId, toLocationId))?.quantity).toBe(5)

		const again = await POST('/inventory/transfer/receive', {
			token,
			body: { transferId, lines: [{ materialId, receivedQty: '1' }] },
		})
		await expectError(again, 400, 'TRANSFER_ALREADY_RECEIVED')
		expect((await stockBalance(token, materialId, toLocationId))?.quantity).toBe(5)
	})

	test('receiving more than requested is rejected without crediting stock', async () => {
		const materialId = await stockedMaterial('5')
		const transferId = await requestTransfer(materialId, '3')
		await POST('/inventory/transfer/ship', { token, body: { transferId } })

		const res = await POST('/inventory/transfer/receive', {
			token,
			body: { transferId, lines: [{ materialId, receivedQty: '4' }] },
		})
		await expectError(res, 400, 'TRANSFER_RECEIVED_EXCEEDS_REQUESTED')
		expect(await stockBalance(token, materialId, toLocationId)).toBeUndefined()
		expect(await transferStatus(transferId)).toBe('in_transit')
	})

	test('receiving a material that is not on the transfer is rejected', async () => {
		const materialId = await stockedMaterial('2')
		const otherMaterialId = await stockedMaterial('2')
		const transferId = await requestTransfer(materialId, '2')
		await POST('/inventory/transfer/ship', { token, body: { transferId } })

		const res = await POST('/inventory/transfer/receive', {
			token,
			body: { transferId, lines: [{ materialId: otherMaterialId, receivedQty: '1' }] },
		})
		await expectError(res, 400, 'TRANSFER_LINE_MATERIAL_MISMATCH')
	})

	test('a transfer cannot be received before it ships', async () => {
		const materialId = await stockedMaterial('2')
		const transferId = await requestTransfer(materialId, '2')

		const res = await POST('/inventory/transfer/receive', {
			token,
			body: { transferId, lines: [{ materialId, receivedQty: '2' }] },
		})
		await expectError(res, 400, 'TRANSFER_NOT_IN_TRANSIT')
		expect(await stockBalance(token, materialId, toLocationId)).toBeUndefined()
	})

	test('shipping twice is rejected and deducts the source only once', async () => {
		const materialId = await stockedMaterial('10')
		const transferId = await requestTransfer(materialId, '3')

		await POST('/inventory/transfer/ship', { token, body: { transferId } })
		const again = await POST('/inventory/transfer/ship', { token, body: { transferId } })
		await expectError(again, 400, 'TRANSFER_NOT_REQUESTED')
		expect((await stockBalance(token, materialId, fromLocationId))?.quantity).toBe(7)
	})

	test('shipping more than the source holds is rejected and leaves the transfer requested', async () => {
		const materialId = await stockedMaterial('2')
		const transferId = await requestTransfer(materialId, '3')

		const res = await POST('/inventory/transfer/ship', { token, body: { transferId } })
		await expectError(res, 400, 'STOCK_INSUFFICIENT')
		expect(await transferStatus(transferId)).toBe('requested')
		expect((await stockBalance(token, materialId, fromLocationId))?.quantity).toBe(2)
	})

	test('create rejects identical source and destination', async () => {
		const materialId = await stockedMaterial('1')
		const res = await POST('/inventory/transfer/create', {
			token,
			body: {
				fromLocationId,
				toLocationId: fromLocationId,
				lines: [{ materialId, qty: '1', uomId: uom.pcs }],
			},
		})
		await expectError(res, 400, 'TRANSFER_SAME_LOCATION')
	})

	test('create rejects a material not assigned at the destination', async () => {
		const materialId = await createAssignedMaterial(token, {
			baseUomId: uom.pcs,
			locationIds: [fromLocationId],
		})
		const res = await POST('/inventory/transfer/create', {
			token,
			body: { fromLocationId, toLocationId, lines: [{ materialId, qty: '1', uomId: uom.pcs }] },
		})
		await expectError(res, 400, 'TRANSFER_MATERIAL_NOT_ASSIGNED')
	})

	test('shipping an unknown transfer returns 404', async () => {
		const res = await POST('/inventory/transfer/ship', {
			token,
			body: { transferId: 2_000_000_000 },
		})
		await expectError(res, 404, 'TRANSFER_NOT_FOUND')
	})

	test('cashier cannot request transfers', async () => {
		const cashier = await loginAs(SEED_USERS.cashier.username)
		const res = await POST('/inventory/transfer/create', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			body: {
				fromLocationId: SEED_LOCATION_ID,
				toLocationId,
				lines: [{ materialId: 1, qty: '1', uomId: uom.pcs }],
			},
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})
})
