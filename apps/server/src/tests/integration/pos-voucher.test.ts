import { loginAs } from '../helpers/auth.ts'
import {
	createOrderWithLines,
	createStoreFixture,
	expectError,
	orderDetail,
	payAndComplete,
	uniqueSuffix,
} from '../helpers/fixtures.ts'
import type { StoreFixture } from '../helpers/fixtures.ts'
import { DELETE, POST, PUT, json } from '../helpers/request.ts'
import type { Json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

const DAY = 24 * 60 * 60 * 1000

type VoucherInput = {
	type: 'percentage' | 'fixed'
	value: number
	minPurchase?: number | null
	maxDiscount?: number | null
	validFrom?: Date
	validUntil?: Date
	usageLimit?: number | null
	isActive?: boolean
}

describe('pos/voucher', () => {
	let token: string

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
	})

	function voucherBody(code: string, input: VoucherInput) {
		return {
			code,
			name: `Voucher ${code}`,
			validFrom: new Date(Date.now() - DAY).toISOString(),
			validUntil: new Date(Date.now() + DAY).toISOString(),
			...input,
		}
	}

	async function createVoucher(input: VoucherInput): Promise<{ id: number; code: string }> {
		const code = `V-${uniqueSuffix()}`
		const res = await POST('/pos/voucher/create', { token, body: voucherBody(code, input) })
		expect(res.status).toBe(200)
		return { id: (await json(res)).data.id, code }
	}

	async function validate(code: string, orderTotal: number, as = token): Promise<Json> {
		const res = await POST('/pos/voucher/validate', {
			token: as,
			locationId: SEED_LOCATION_ID,
			body: { code, orderTotal },
		})
		expect(res.status).toBe(200)
		const data = (await json(res)).data
		// Money strings are not normalized ("1000" vs "1000.00"); compare amounts numerically.
		return { ...data, discountAmount: Number(data.discountAmount) }
	}

	// ─── Validation rules ───

	test('percentage discount is capped at maxDiscount', async () => {
		const { code } = await createVoucher({ type: 'percentage', value: 10, maxDiscount: 5000 })

		expect(await validate(code, 20000)).toEqual({ valid: true, discountAmount: 2000 })
		expect(await validate(code, 100000)).toEqual({ valid: true, discountAmount: 5000 })
	})

	test('fixed discount applies only at or above minPurchase', async () => {
		const { code } = await createVoucher({ type: 'fixed', value: 3000, minPurchase: 50000 })

		expect(await validate(code, 49999)).toMatchObject({
			valid: false,
			reason: 'BELOW_MIN_PURCHASE',
		})
		expect(await validate(code, 50000)).toEqual({ valid: true, discountAmount: 3000 })
	})

	test('vouchers outside their validity window are rejected', async () => {
		const expired = await createVoucher({
			type: 'fixed',
			value: 1000,
			validFrom: new Date(Date.now() - 3 * DAY),
			validUntil: new Date(Date.now() - DAY),
		})
		const upcoming = await createVoucher({
			type: 'fixed',
			value: 1000,
			validFrom: new Date(Date.now() + DAY),
			validUntil: new Date(Date.now() + 3 * DAY),
		})

		expect(await validate(expired.code, 10000)).toMatchObject({ valid: false, reason: 'EXPIRED' })
		expect(await validate(upcoming.code, 10000)).toMatchObject({ valid: false, reason: 'EXPIRED' })
	})

	test('unknown and inactive codes are rejected', async () => {
		const inactive = await createVoucher({ type: 'fixed', value: 1000, isActive: false })

		expect(await validate(`NOPE-${uniqueSuffix()}`, 10000)).toMatchObject({
			valid: false,
			reason: 'NOT_FOUND',
		})
		expect(await validate(inactive.code, 10000)).toMatchObject({ valid: false, reason: 'INACTIVE' })
	})

	test('updates and removal take effect on the next validation', async () => {
		const { id, code } = await createVoucher({ type: 'fixed', value: 1000 })
		expect(await validate(code, 10000)).toEqual({ valid: true, discountAmount: 1000 })

		const updated = await PUT('/pos/voucher/update', {
			token,
			body: { id, ...voucherBody(code, { type: 'fixed', value: 2500 }) },
		})
		expect(updated.status).toBe(200)
		expect(await validate(code, 10000)).toEqual({ valid: true, discountAmount: 2500 })

		const removed = await DELETE('/pos/voucher/remove', { token, query: { id: String(id) } })
		expect(removed.status).toBe(200)
		expect(await validate(code, 10000)).toMatchObject({ valid: false })
	})

	// ─── Management guards ───

	test('duplicate voucher codes are rejected', async () => {
		const { code } = await createVoucher({ type: 'fixed', value: 1000 })
		const res = await POST('/pos/voucher/create', {
			token,
			body: voucherBody(code, { type: 'fixed', value: 500 }),
		})
		await expectError(res, 409, 'VOUCHER_CODE_EXISTS')
	})

	test('updating an unknown voucher returns 404', async () => {
		const res = await PUT('/pos/voucher/update', {
			token,
			body: {
				id: 2_000_000_000,
				...voucherBody(`V-${uniqueSuffix()}`, { type: 'fixed', value: 1 }),
			},
		})
		await expectError(res, 404, 'VOUCHER_NOT_FOUND')
	})

	test('cashier can validate vouchers but cannot manage them', async () => {
		const cashier = await loginAs(SEED_USERS.cashier.username)
		const { code } = await createVoucher({ type: 'fixed', value: 1000 })

		expect(await validate(code, 10000, cashier)).toEqual({ valid: true, discountAmount: 1000 })

		const res = await POST('/pos/voucher/create', {
			token: cashier,
			locationId: SEED_LOCATION_ID,
			body: voucherBody(`V-${uniqueSuffix()}`, { type: 'fixed', value: 1000 }),
		})
		await expectError(res, 403, 'PERMISSION_DENIED')
	})

	// ─── Applied to orders ───

	describe('on orders', () => {
		let store: StoreFixture

		beforeAll(async () => {
			store = await createStoreFixture(token, { basePrice: '25000' })
		})

		test('applying a voucher discounts the order before tax', async () => {
			const { code } = await createVoucher({ type: 'fixed', value: 5000 })
			const { orderId } = await createOrderWithLines(token, {
				locationId: store.locationId,
				lines: [{ menuItemId: store.menuItemId, qty: 2 }],
			})

			const res = await POST('/pos/order/voucher/apply', {
				token,
				locationId: store.locationId,
				body: { orderId, voucherCode: code },
			})
			const result = (await json(res)).data
			expect({ applied: result.applied, discountAmount: Number(result.discountAmount) }).toEqual({
				applied: true,
				discountAmount: 5000,
			})

			const detail = await orderDetail(token, store.locationId, orderId)
			expect(Number(detail.subtotal)).toBe(50000)
			expect(Number(detail.discountAmount)).toBe(5000)
			expect(Number(detail.total) - Number(detail.taxAmount)).toBe(45000)

			const second = await POST('/pos/order/voucher/apply', {
				token,
				locationId: store.locationId,
				body: { orderId, voucherCode: code },
			})
			await expectError(second, 400, 'VOUCHER_ALREADY_APPLIED')
		})

		test('a voucher at its usage limit cannot be applied to another order', async () => {
			const { code } = await createVoucher({ type: 'fixed', value: 1000, usageLimit: 1 })

			const first = await createOrderWithLines(token, {
				locationId: store.locationId,
				lines: [{ menuItemId: store.menuItemId, qty: 1 }],
			})
			const applied = await POST('/pos/order/voucher/apply', {
				token,
				locationId: store.locationId,
				body: { orderId: first.orderId, voucherCode: code },
			})
			expect((await json(applied)).data.applied).toBe(true)
			await payAndComplete(token, store.locationId, first.orderId)

			const second = await createOrderWithLines(token, {
				locationId: store.locationId,
				lines: [{ menuItemId: store.menuItemId, qty: 1 }],
			})
			const rejected = await POST('/pos/order/voucher/apply', {
				token,
				locationId: store.locationId,
				body: { orderId: second.orderId, voucherCode: code },
			})
			expect((await json(rejected)).data).toMatchObject({
				applied: false,
				reason: 'USAGE_LIMIT_REACHED',
			})
			expect(
				Number((await orderDetail(token, store.locationId, second.orderId)).discountAmount),
			).toBe(0)
		})
	})
})
