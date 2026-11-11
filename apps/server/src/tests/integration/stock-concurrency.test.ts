import { stockBalances, stockMovements } from '@/db/schema/inventory.ts'
import { materialLocations, materials } from '@/db/schema/material.ts'
import { menuItems } from '@/db/schema/menu.ts'
import { recipeLines, recipes } from '@/db/schema/recipe.ts'

import { and, db, eq } from '@/infra/database/index.ts'

import { loginAs } from '../helpers/auth.ts'
import { GET, POST } from '../helpers/request.ts'
import type { Json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_PAYMENT_METHOD_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

/**
 * Concurrency guarantees of the stock engine and POS order flow.
 *
 * Every test builds its own materials/menu items so tests stay independent
 * while the suite runs concurrently against a shared seeded DB. Balances are
 * read straight from the DB to bypass the balance read cache.
 */

const SEED_SUPPLIER_ID = 1
const SEED_UOM_ID = 1

// ─── Fixtures ───

async function createAssignedMaterial(label: string): Promise<number> {
	const suffix = crypto.randomUUID().slice(0, 8)
	const [material] = await db
		.insert(materials)
		.values({
			code: `T-${label}-${suffix}`,
			name: `Concurrency ${label} ${suffix}`,
			type: 'raw',
			baseUomId: SEED_UOM_ID,
		})
		.returning({ id: materials.id })
	if (!material) throw new Error('material fixture insert failed')
	await db
		.insert(materialLocations)
		.values({ materialId: material.id, locationId: SEED_LOCATION_ID })
	return material.id
}

/** Menu item whose active recipe consumes `lines` (in the given order) per unit. */
async function createMenuItemWithRecipe(
	lines: Array<{ materialId: number; qty: string }>,
): Promise<number> {
	const suffix = crypto.randomUUID().slice(0, 8)
	const [item] = await db
		.insert(menuItems)
		.values({
			locationId: SEED_LOCATION_ID,
			sku: `T-MI-${suffix}`,
			name: `Concurrency item ${suffix}`,
			basePrice: '10000',
		})
		.returning({ id: menuItems.id })
	if (!item) throw new Error('menu item fixture insert failed')
	const [recipe] = await db
		.insert(recipes)
		.values({ menuItemId: item.id, name: `Recipe ${suffix}`, yieldQty: '1' })
		.returning({ id: recipes.id })
	if (!recipe) throw new Error('recipe fixture insert failed')
	await db.insert(recipeLines).values(
		lines.map((line) => ({
			recipeId: recipe.id,
			materialId: line.materialId,
			quantity: line.qty,
			uomId: SEED_UOM_ID,
		})),
	)
	return item.id
}

async function balanceQty(materialId: number): Promise<number | undefined> {
	const [row] = await db
		.select({ quantity: stockBalances.quantity })
		.from(stockBalances)
		.where(
			and(eq(stockBalances.materialId, materialId), eq(stockBalances.locationId, SEED_LOCATION_ID)),
		)
	return row ? Number(row.quantity) : undefined
}

// ─── Flows ───

async function receiveStock(token: string, materialId: number, qty: string): Promise<Response> {
	const createRes = await POST('/inventory/receiving/create', {
		token,
		body: {
			locationId: SEED_LOCATION_ID,
			supplierId: SEED_SUPPLIER_ID,
			lines: [{ materialId, qty, unitCost: '1000', uomId: SEED_UOM_ID }],
		},
	})
	expect(createRes.status).toBe(200)
	const created: Json = await createRes.json()
	return POST('/inventory/receiving/confirm', {
		token,
		body: { receivingId: created.data.id },
	})
}

async function createOrder(token: string, externalRef?: string): Promise<Response> {
	return POST('/pos/order/create', {
		token,
		locationId: SEED_LOCATION_ID,
		body: { locationId: SEED_LOCATION_ID, type: 'takeaway', externalRef },
	})
}

/** Adds lines and pays the order in full; returns once it is ready to complete. */
async function prepareOrder(token: string, orderId: number, menuItemId: number, qty: number) {
	const syncRes = await POST('/pos/order/lines/sync', {
		token,
		locationId: SEED_LOCATION_ID,
		body: { orderId, lines: [{ menuItemId, qty }] },
	})
	expect(syncRes.status).toBe(200)
	const detailRes = await GET('/pos/order/detail', {
		token,
		locationId: SEED_LOCATION_ID,
		query: { id: String(orderId) },
	})
	const detail: Json = await detailRes.json()
	const payRes = await POST('/pos/order/payment', {
		token,
		locationId: SEED_LOCATION_ID,
		body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: Number(detail.data.total) },
	})
	expect(payRes.status).toBe(200)
}

async function completeOrder(token: string, orderId: number): Promise<Response> {
	return POST('/pos/order/complete', {
		token,
		locationId: SEED_LOCATION_ID,
		body: { orderId },
	})
}

// ─── Tests ───

describe('stock concurrency', () => {
	let ownerToken: string
	let cashierToken: string

	beforeAll(async () => {
		ownerToken = await loginAs(SEED_USERS.owner.username)
		cashierToken = await loginAs(SEED_USERS.cashier.username)
		// Ensure the cashier has an open shift (already-open is fine).
		await POST('/pos/shift/open', {
			token: cashierToken,
			locationId: SEED_LOCATION_ID,
			body: { locationId: SEED_LOCATION_ID, openingCash: 500000 },
		})
	})

	test('concurrent first-time inbound movements all land on the balance', async () => {
		const materialId = await createAssignedMaterial('FIRST')
		expect(await balanceQty(materialId)).toBeUndefined()

		const qtys = ['1', '2', '3', '4', '5', '6']
		const responses = await Promise.all(
			qtys.map((qty) => receiveStock(ownerToken, materialId, qty)),
		)
		for (const res of responses) expect(res.status).toBe(200)

		expect(await balanceQty(materialId)).toBe(21)
	})

	test('concurrent orders consuming shared materials in opposite order do not deadlock', async () => {
		const materialA = await createAssignedMaterial('A')
		const materialB = await createAssignedMaterial('B')
		const itemAB = await createMenuItemWithRecipe([
			{ materialId: materialA, qty: '2' },
			{ materialId: materialB, qty: '3' },
		])
		const itemBA = await createMenuItemWithRecipe([
			{ materialId: materialB, qty: '5' },
			{ materialId: materialA, qty: '7' },
		])

		const orderIds: number[] = []
		for (let i = 0; i < 4; i++) {
			const res = await createOrder(cashierToken)
			expect(res.status).toBe(200)
			const body: Json = await res.json()
			orderIds.push(body.data.id)
		}
		// Two orders per direction, each for one unit.
		await Promise.all(
			orderIds.map((orderId, i) => prepareOrder(cashierToken, orderId, i % 2 ? itemBA : itemAB, 1)),
		)

		const completions = await Promise.all(
			orderIds.map((orderId) => completeOrder(cashierToken, orderId)),
		)
		for (const res of completions) expect(res.status).toBe(200)

		// Sales are permissive, so balances go negative from a missing row.
		expect(await balanceQty(materialA)).toBe(-(2 * 2 + 7 * 2))
		expect(await balanceQty(materialB)).toBe(-(3 * 2 + 5 * 2))
	})

	test('order create is idempotent per externalRef and stock is deducted once', async () => {
		const material = await createAssignedMaterial('IDEM')
		const item = await createMenuItemWithRecipe([{ materialId: material, qty: '4' }])
		const externalRef = `test-ext-${crypto.randomUUID()}`

		// Concurrent retries resolve to one order.
		const concurrent = await Promise.all([
			createOrder(cashierToken, externalRef),
			createOrder(cashierToken, externalRef),
			createOrder(cashierToken, externalRef),
		])
		const ids = await Promise.all(
			concurrent.map(async (res) => {
				expect(res.status).toBe(200)
				const body: Json = await res.json()
				return body.data.id as number
			}),
		)
		expect(new Set(ids).size).toBe(1)
		const orderId = ids[0] as number

		// A later sequential retry returns the same order.
		const retry: Json = await (await createOrder(cashierToken, externalRef)).json()
		expect(retry.data.id).toBe(orderId)

		await prepareOrder(cashierToken, orderId, item, 2)

		// Concurrent completes: exactly one wins; stock is deducted once.
		const completions = await Promise.all([
			completeOrder(cashierToken, orderId),
			completeOrder(cashierToken, orderId),
		])
		expect(completions.map((res) => res.status).toSorted((a, b) => a - b)).toEqual([200, 400])

		const movements = await db
			.select({ id: stockMovements.id })
			.from(stockMovements)
			.where(
				and(eq(stockMovements.referenceType, 'order'), eq(stockMovements.referenceId, orderId)),
			)
		expect(movements).toHaveLength(1)
		expect(await balanceQty(material)).toBe(-8)
	})
})
