import { loginAs } from '../helpers/auth.ts'
import {
	createAssignedMaterial,
	createLocation,
	createMaterial,
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
 * Production: a recipe turns input materials into a semi-finished output.
 * Confirming an order consumes inputs and books the output at the rolled-up
 * input cost. Each test owns its materials at a dedicated warehouse.
 */
describe('production', () => {
	let token: string
	let uom: Record<UomCode, number>
	let locationId: number

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
		uom = await uomIds(token)
		locationId = await createLocation(token, 'warehouse')
	})

	/**
	 * Input (kg, 5 kg @ 10,000/kg in stock) and semi-finished output (kg).
	 * Recipe: 500 g input → 2 kg output.
	 */
	async function productionSetup(opts: { assignOutput?: boolean } = {}) {
		const inputId = await createAssignedMaterial(token, {
			baseUomId: uom.kg,
			locationIds: [locationId],
		})
		await receiveStock(token, {
			locationId,
			materialId: inputId,
			uomId: uom.kg,
			qty: '5',
			unitCost: '10000',
		})
		const outputId = await createAssignedMaterial(token, {
			baseUomId: uom.kg,
			type: 'semi_finished',
			locationIds: opts.assignOutput === false ? [] : [locationId],
		})

		const recipe = await POST('/production/recipe/create', {
			token,
			body: {
				outputMaterialId: outputId,
				name: 'Test production recipe',
				yieldQty: '2',
				yieldUomId: uom.kg,
				lines: [{ materialId: inputId, qty: '500', uomId: uom.g }],
			},
		})
		expect(recipe.status).toBe(200)
		return { inputId, outputId, recipeId: (await json(recipe)).data.id as number }
	}

	async function createOrder(recipeId: number, multiplier: number): Promise<number> {
		const res = await POST('/production/order/create', {
			token,
			body: { recipeId, locationId, multiplier },
		})
		expect(res.status).toBe(200)
		return (await json(res)).data.id
	}

	test('confirm consumes inputs and books output at rolled-up input cost', async () => {
		const { inputId, outputId, recipeId } = await productionSetup()
		const orderId = await createOrder(recipeId, 2)

		const confirmed = await POST('/production/order/confirm', { token, body: { orderId } })
		expect(confirmed.status).toBe(200)

		// 2 × 500 g = 1 kg consumed; 2 × 2 kg = 4 kg produced at 10,000 / 4 = 2,500/kg.
		expect((await stockBalance(token, inputId, locationId))?.quantity).toBe(4)
		expect(await stockBalance(token, outputId, locationId)).toEqual({
			quantity: 4,
			costPrice: 2500,
		})

		const detail = await GET('/production/order/detail', { token, query: { id: String(orderId) } })
		const order = (await json(detail)).data
		expect({ status: order.status, actualQty: Number(order.actualQty) }).toEqual({
			status: 'completed',
			actualQty: 4,
		})
	})

	test('confirming twice is rejected and does not move stock again', async () => {
		const { inputId, outputId, recipeId } = await productionSetup()
		const orderId = await createOrder(recipeId, 1)

		await POST('/production/order/confirm', { token, body: { orderId } })
		const again = await POST('/production/order/confirm', { token, body: { orderId } })
		await expectError(again, 400, 'PRODUCTION_ALREADY_CONFIRMED')

		expect((await stockBalance(token, inputId, locationId))?.quantity).toBe(4.5)
		expect((await stockBalance(token, outputId, locationId))?.quantity).toBe(2)
	})

	test('a failed confirm rolls back input consumption', async () => {
		// Output not assigned at the location → booking the output fails after
		// inputs were already deducted inside the same transaction.
		const { inputId, recipeId } = await productionSetup({ assignOutput: false })
		const orderId = await createOrder(recipeId, 1)

		const res = await POST('/production/order/confirm', { token, body: { orderId } })
		await expectError(res, 400, 'STOCK_MATERIAL_NOT_ASSIGNED')

		expect((await stockBalance(token, inputId, locationId))?.quantity).toBe(5)
		const detail = await GET('/production/order/detail', { token, query: { id: String(orderId) } })
		expect((await json(detail)).data.status).toBe('draft')
	})

	test('recipe output must be a semi-finished material', async () => {
		const rawId = await createMaterial(token, { baseUomId: uom.kg })
		const res = await POST('/production/recipe/create', {
			token,
			body: {
				outputMaterialId: rawId,
				name: 'Raw output',
				yieldQty: '1',
				yieldUomId: uom.kg,
				lines: [{ materialId: rawId, qty: '1', uomId: uom.kg }],
			},
		})
		await expectError(res, 400, 'PRODUCTION_NOT_SEMI_FINISHED')
	})

	test('recipe lines must be convertible to the input base UoM', async () => {
		const inputId = await createMaterial(token, { baseUomId: uom.kg })
		const outputId = await createMaterial(token, { baseUomId: uom.kg, type: 'semi_finished' })
		const res = await POST('/production/recipe/create', {
			token,
			body: {
				outputMaterialId: outputId,
				name: 'Bad UoM',
				yieldQty: '1',
				yieldUomId: uom.kg,
				lines: [{ materialId: inputId, qty: '1', uomId: uom.ml }],
			},
		})
		await expectError(res, 400, 'PRODUCTION_UOM_NOT_CONVERTIBLE')
	})

	test('unknown recipe and order return 404', async () => {
		const order = await POST('/production/order/create', {
			token,
			body: { recipeId: 2_000_000_000, locationId, multiplier: 1 },
		})
		await expectError(order, 404, 'PRODUCTION_RECIPE_NOT_FOUND')

		const confirm = await POST('/production/order/confirm', {
			token,
			body: { orderId: 2_000_000_000 },
		})
		await expectError(confirm, 404, 'PRODUCTION_ORDER_NOT_FOUND')
	})

	test('cashier cannot create production orders', async () => {
		const cashier = await loginAs(SEED_USERS.cashier.username)
		const res = await POST('/production/order/create', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			body: { recipeId: 1, locationId: SEED_LOCATION_ID, multiplier: 1 },
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})
})
