import { GET, POST, json } from './request.ts'
import { SEED_PAYMENT_METHOD_ID } from './seed.ts'
/**
 * Fixture builders for integration tests.
 *
 * Integration files run concurrently against one shared database, so every
 * fixture gets a unique code and tests only assert on rows they created.
 * Builders go through the public HTTP API and throw on unexpected statuses so
 * setup failures surface as clear errors instead of misleading assertions.
 */
import { expect } from 'bun:test'

/** Seeded supplier (scripts/seeds/supplier.ts). */
export const SEED_SUPPLIER_ID = 1

export type UomCode = 'kg' | 'g' | 'L' | 'ml' | 'pcs'

/** Stock movement row as returned by GET /inventory/stock/movements. */
export interface StockMovement {
	type: string
	direction: 'in' | 'out'
	quantity: string
	referenceType: string | null
	referenceId: number | null
}

/** Short unique suffix for codes that must not collide across concurrent tests. */
export function uniqueSuffix(): string {
	return crypto.randomUUID().slice(0, 8)
}

/** Unwrap `data` from a 200 response; defaults to the `{ id }` entity ref. */
async function expectOk<T = { id: number }>(res: Response, what: string): Promise<T> {
	const body = await json<{ data: T }>(res)
	if (res.status !== 200) {
		throw new Error(`${what} failed with status ${res.status}: ${JSON.stringify(body)}`)
	}
	return body.data
}

/** Assert an HttpError response by status and domain error code. */
export async function expectError(res: Response, status: number, code: string): Promise<void> {
	const body = await json<{ error?: { code?: string } }>(res)
	expect({ status: res.status, code: body.error?.code }).toEqual({ status, code })
}

// ─── Master data ───

/** Resolve seeded UoM ids by code. */
export async function uomIds(token: string): Promise<Record<UomCode, number>> {
	const rows = await expectOk<Array<{ id: number; code: string }>>(
		await GET('/uom/list', { token, query: { page: '1', limit: '100' } }),
		'uom list',
	)
	const ids: Record<string, number> = Object.fromEntries(rows.map((row) => [row.code, row.id]))
	for (const code of ['kg', 'g', 'L', 'ml', 'pcs'] as const) {
		if (ids[code] === undefined) throw new Error(`Seeded UoM "${code}" not found`)
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- presence checked above
	return ids as Record<UomCode, number>
}

export async function createLocation(
	token: string,
	type: 'store' | 'warehouse' = 'store',
): Promise<number> {
	const suffix = uniqueSuffix()
	const data = await expectOk(
		await POST('/location/create', {
			token,
			body: { code: `T-${suffix}`, name: `Test ${type} ${suffix}`, type },
		}),
		'location create',
	)
	return data.id
}

export async function createMaterial(
	token: string,
	opts: { baseUomId: number; type?: 'raw' | 'semi_finished' },
): Promise<number> {
	const suffix = uniqueSuffix()
	const data = await expectOk(
		await POST('/material/create', {
			token,
			body: {
				code: `TM-${suffix}`,
				name: `Test Material ${suffix}`,
				type: opts.type ?? 'raw',
				baseUomId: opts.baseUomId,
			},
		}),
		'material create',
	)
	return data.id
}

async function assignMaterial(
	token: string,
	materialId: number,
	locationId: number,
): Promise<void> {
	await expectOk(
		await POST('/material/assignment/assign', { token, body: { materialId, locationId } }),
		'material assign',
	)
}

/** Create a material and assign it to each given location. */
export async function createAssignedMaterial(
	token: string,
	opts: { baseUomId: number; locationIds: number[]; type?: 'raw' | 'semi_finished' },
): Promise<number> {
	const materialId = await createMaterial(token, opts)
	for (const locationId of opts.locationIds) await assignMaterial(token, materialId, locationId)
	return materialId
}

// ─── Stock ───

/** Create and confirm a receiving so the material has stock at the location. */
export async function receiveStock(
	token: string,
	opts: { locationId: number; materialId: number; uomId: number; qty: string; unitCost: string },
): Promise<number> {
	const created = await expectOk(
		await POST('/inventory/receiving/create', {
			token,
			body: {
				locationId: opts.locationId,
				supplierId: SEED_SUPPLIER_ID,
				lines: [
					{
						materialId: opts.materialId,
						qty: opts.qty,
						unitCost: opts.unitCost,
						uomId: opts.uomId,
					},
				],
			},
		}),
		'receiving create',
	)
	await expectOk(
		await POST('/inventory/receiving/confirm', { token, body: { receivingId: created.id } }),
		'receiving confirm',
	)
	return created.id
}

/** Current stock balance, or `undefined` when no balance row exists yet. */
export async function stockBalance(
	token: string,
	materialId: number,
	locationId: number,
): Promise<{ quantity: number; costPrice: number } | undefined> {
	const res = await GET('/inventory/stock/balance', {
		token,
		query: { materialId: String(materialId), locationId: String(locationId) },
	})
	if (res.status === 404) return undefined
	const data = await expectOk<{ quantity: string; costPrice: string }>(res, 'stock balance')
	return { quantity: Number(data.quantity), costPrice: Number(data.costPrice) }
}

// ─── POS ───

export interface StoreFixture {
	locationId: number
	menuItemId: number
	shiftId: number
}

/**
 * Isolated store: new store location, one menu item, the seeded cash payment
 * method enabled, and an open shift for the token's user. Isolation keeps the
 * one-open-shift-per-user-and-location rule from coupling concurrent tests.
 */
export async function createStoreFixture(
	token: string,
	opts: { basePrice: string; openingCash?: number },
): Promise<StoreFixture> {
	const locationId = await createLocation(token, 'store')
	const suffix = uniqueSuffix()
	const item = await expectOk(
		await POST('/menu/item/create', {
			token,
			body: {
				locationId,
				sku: `SKU-${suffix}`,
				name: `Test Item ${suffix}`,
				basePrice: opts.basePrice,
			},
		}),
		'menu item create',
	)
	await expectOk(
		await POST('/payment-method/location/assign', {
			token,
			body: { paymentMethodId: SEED_PAYMENT_METHOD_ID, locationId },
		}),
		'payment method assign',
	)
	const shift = await expectOk(
		await POST('/pos/shift/open', {
			token,
			locationId,
			body: { locationId, openingCash: opts.openingCash ?? 0 },
		}),
		'shift open',
	)
	return { locationId, menuItemId: item.id, shiftId: shift.id }
}

/** Create an order with lines and return its id and server-computed total. */
export async function createOrderWithLines(
	token: string,
	opts: {
		locationId: number
		lines: Array<{ menuItemId: number; qty: number }>
		tableId?: number
	},
): Promise<{ orderId: number; total: number }> {
	const created = await expectOk(
		await POST('/pos/order/create', {
			token,
			locationId: opts.locationId,
			body: {
				locationId: opts.locationId,
				type: opts.tableId ? 'dine_in' : 'takeaway',
				...(opts.tableId ? { tableId: opts.tableId } : {}),
			},
		}),
		'order create',
	)
	await expectOk(
		await POST('/pos/order/lines/sync', {
			token,
			locationId: opts.locationId,
			body: { orderId: created.id, lines: opts.lines },
		}),
		'order lines sync',
	)
	const detail = await orderDetail(token, opts.locationId, created.id)
	return { orderId: created.id, total: Number(detail.total) }
}

/** Money fields of an order, as returned by the API (decimal strings). */
export interface OrderAmounts {
	subtotal: string
	discountAmount: string
	taxAmount: string
	total: string
}

export async function orderDetail(
	token: string,
	locationId: number,
	orderId: number,
): Promise<OrderAmounts> {
	return expectOk<OrderAmounts>(
		await GET('/pos/order/detail', { token, locationId, query: { id: String(orderId) } }),
		'order detail',
	)
}

/** Pay the order's current total in cash and complete it. */
export async function payAndComplete(
	token: string,
	locationId: number,
	orderId: number,
): Promise<void> {
	const detail = await orderDetail(token, locationId, orderId)
	await expectOk(
		await POST('/pos/order/payment', {
			token,
			locationId,
			body: { orderId, paymentMethodId: SEED_PAYMENT_METHOD_ID, amount: Number(detail.total) },
		}),
		'order payment',
	)
	await expectOk(
		await POST('/pos/order/complete', { token, locationId, body: { orderId } }),
		'order complete',
	)
}
