import { loginAs } from '../helpers/auth.ts'
import {
	createAssignedMaterial,
	createMaterial,
	createOrderWithLines,
	createStoreFixture,
	expectError,
	payAndComplete,
	receiveStock,
	stockBalance,
	uomIds,
} from '../helpers/fixtures.ts'
import type { StockMovement, StoreFixture, UomCode } from '../helpers/fixtures.ts'
import { DELETE, GET, POST, json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

/**
 * Menu recipes: HPP (cost of goods) from current stock cost, and stock
 * deduction when an order with recipe-backed items completes. Each test owns
 * its store, menu item and materials.
 */
describe('recipe', () => {
	let token: string
	let uom: Record<UomCode, number>

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
		uom = await uomIds(token)
	})

	/**
	 * Store with coffee (base g, 2,000 g @ 50/g) and cups (pcs, 10 @ 2,000).
	 * The menu item's recipe uses 0.25 kg coffee + 1 cup per `yieldQty` servings.
	 */
	async function recipeSetup(yieldQty = '1') {
		const store = await createStoreFixture(token, { basePrice: '30000' })
		const coffeeId = await createAssignedMaterial(token, {
			baseUomId: uom.g,
			locationIds: [store.locationId],
		})
		const cupId = await createAssignedMaterial(token, {
			baseUomId: uom.pcs,
			locationIds: [store.locationId],
		})
		await receiveStock(token, {
			locationId: store.locationId,
			materialId: coffeeId,
			uomId: uom.kg,
			qty: '2',
			unitCost: '50000',
		})
		await receiveStock(token, {
			locationId: store.locationId,
			materialId: cupId,
			uomId: uom.pcs,
			qty: '10',
			unitCost: '2000',
		})
		const recipeId = await createRecipe(store, yieldQty, [
			{ materialId: coffeeId, quantity: '0.25', uomId: uom.kg },
			{ materialId: cupId, quantity: '1', uomId: uom.pcs },
		])
		return { store, coffeeId, cupId, recipeId }
	}

	async function createRecipe(
		store: StoreFixture,
		yieldQty: string,
		lines: Array<{ materialId: number; quantity: string; uomId: number }>,
	): Promise<number> {
		const res = await POST('/recipe/create', {
			token,
			body: { menuItemId: store.menuItemId, name: 'Test recipe', yieldQty, lines },
		})
		expect(res.status).toBe(200)
		return (await json(res)).data.id
	}

	/** HPP per serving of the store's menu item at the store's location. */
	async function hpp(store: StoreFixture): Promise<number> {
		const res = await GET('/recipe/hpp', {
			token,
			query: { menuItemId: String(store.menuItemId), locationId: String(store.locationId) },
		})
		expect(res.status).toBe(200)
		return Number((await json<{ data: { hpp: string } }>(res)).data.hpp)
	}

	test('HPP converts recipe UoMs to base and divides by yield', async () => {
		const single = await recipeSetup('1')
		// 250 g × 50 + 1 × 2,000 = 14,500 per serving
		expect(await hpp(single.store)).toBe(14500)

		const double = await recipeSetup('2')
		expect(await hpp(double.store)).toBe(7250)
	})

	test('completing an order deducts recipe materials scaled by quantity', async () => {
		const { store, coffeeId, cupId } = await recipeSetup()
		const { orderId } = await createOrderWithLines(token, {
			locationId: store.locationId,
			lines: [{ menuItemId: store.menuItemId, qty: 2 }],
		})

		// Open orders do not touch stock.
		expect((await stockBalance(token, coffeeId, store.locationId))?.quantity).toBe(2000)

		await payAndComplete(token, store.locationId, orderId)
		expect((await stockBalance(token, coffeeId, store.locationId))?.quantity).toBe(1500)
		expect((await stockBalance(token, cupId, store.locationId))?.quantity).toBe(8)

		const movements = await GET('/inventory/stock/movements', {
			token,
			query: {
				materialId: String(coffeeId),
				locationId: String(store.locationId),
				type: 'sales',
				page: '1',
				limit: '100',
			},
		})
		const sale = (await json<{ data: StockMovement[] }>(movements)).data.find(
			(m) => m.referenceId === orderId,
		)
		expect({ direction: sale?.direction, quantity: Number(sale?.quantity) }).toEqual({
			direction: 'out',
			quantity: 500,
		})
	})

	test('a new recipe replaces the active one for its menu item', async () => {
		const { store, coffeeId, recipeId } = await recipeSetup()
		const replacementId = await createRecipe(store, '1', [
			{ materialId: coffeeId, quantity: '100', uomId: uom.g },
		])

		const active = await GET('/recipe/by-menu-item', {
			token,
			query: { menuItemId: String(store.menuItemId) },
		})
		expect((await json(active)).data.id).toBe(replacementId)
		expect(replacementId).not.toBe(recipeId)

		// 100 g × 50 = 5,000 — the cup line from the old recipe no longer counts.
		expect(await hpp(store)).toBe(5000)
	})

	test('a deleted recipe no longer deducts stock on order completion', async () => {
		const { store, coffeeId, recipeId } = await recipeSetup()
		const removed = await DELETE('/recipe/remove', { token, query: { id: String(recipeId) } })
		expect(removed.status).toBe(200)

		const active = await GET('/recipe/by-menu-item', {
			token,
			query: { menuItemId: String(store.menuItemId) },
		})
		await expectError(active, 404, 'RECIPE_ACTIVE_NOT_FOUND')

		const { orderId } = await createOrderWithLines(token, {
			locationId: store.locationId,
			lines: [{ menuItemId: store.menuItemId, qty: 1 }],
		})
		await payAndComplete(token, store.locationId, orderId)
		expect((await stockBalance(token, coffeeId, store.locationId))?.quantity).toBe(2000)
	})

	test('recipe lines must use a UoM convertible to the material base UoM', async () => {
		const store = await createStoreFixture(token, { basePrice: '1000' })
		const materialId = await createMaterial(token, { baseUomId: uom.g })
		const res = await POST('/recipe/create', {
			token,
			body: {
				menuItemId: store.menuItemId,
				name: 'Bad UoM',
				yieldQty: '1',
				lines: [{ materialId, quantity: '1', uomId: uom.ml }],
			},
		})
		await expectError(res, 400, 'UOM_NOT_CONVERTIBLE')
	})

	test('recipes require an existing menu item and materials', async () => {
		const store = await createStoreFixture(token, { basePrice: '1000' })
		const materialId = await createMaterial(token, { baseUomId: uom.g })

		const noItem = await POST('/recipe/create', {
			token,
			body: {
				menuItemId: 2_000_000_000,
				name: 'Orphan',
				yieldQty: '1',
				lines: [{ materialId, quantity: '1', uomId: uom.g }],
			},
		})
		await expectError(noItem, 404, 'MENU_ITEM_NOT_FOUND')

		const noMaterial = await POST('/recipe/create', {
			token,
			body: {
				menuItemId: store.menuItemId,
				name: 'Ghost material',
				yieldQty: '1',
				lines: [{ materialId: 2_000_000_000, quantity: '1', uomId: uom.g }],
			},
		})
		await expectError(noMaterial, 404, 'MATERIAL_NOT_FOUND')
	})

	test('cashier cannot create recipes', async () => {
		const cashier = await loginAs(SEED_USERS.cashier.username)
		const res = await POST('/recipe/create', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			body: {
				menuItemId: 1,
				name: 'Cashier recipe',
				yieldQty: '1',
				lines: [{ materialId: 1, quantity: '1', uomId: uom.kg }],
			},
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})
})
