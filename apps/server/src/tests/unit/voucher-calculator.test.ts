import { Money } from '@/shared/domain/money.ts'

import { evaluateVoucher } from '@/modules/pos/voucher/voucher.calculator.ts'

import { describe, expect, test } from 'bun:test'

const NOW = new Date('2026-06-15T12:00:00Z')

const base = {
	isActive: true,
	validFrom: new Date('2026-01-01T00:00:00Z'),
	validUntil: new Date('2026-12-31T23:59:59Z'),
	usageLimit: null,
	usageCount: 0,
	minPurchase: null,
	type: 'fixed' as const,
	value: '10000',
	maxDiscount: null,
}

type Terms = NonNullable<Parameters<typeof evaluateVoucher>[0]>

const evaluate = (overrides: Partial<Terms>, total = '100000') =>
	evaluateVoucher({ ...base, ...overrides }, Money.of(total), NOW)

describe('evaluateVoucher', () => {
	test('fixed voucher discounts its value', () => {
		expect(evaluate({})).toEqual({ valid: true, discountAmount: '10000' })
	})

	test('percentage voucher discounts a share of the total, rounded to amount', () => {
		expect(evaluate({ type: 'percentage', value: '15' }, '33333').discountAmount).toBe('5000')
	})

	test('max discount caps a percentage voucher', () => {
		const result = evaluate({ type: 'percentage', value: '50', maxDiscount: '20000' })
		expect(result.discountAmount).toBe('20000')
	})

	test('rejects missing, inactive, expired, exhausted and below-minimum vouchers', () => {
		expect(evaluateVoucher(undefined, Money.of('1'), NOW).reason).toBe('NOT_FOUND')
		expect(evaluate({ isActive: false }).reason).toBe('INACTIVE')
		expect(evaluate({ validUntil: new Date('2026-06-01T00:00:00Z') }).reason).toBe('EXPIRED')
		expect(evaluate({ validFrom: new Date('2026-07-01T00:00:00Z') }).reason).toBe('EXPIRED')
		expect(evaluate({ usageLimit: 5, usageCount: 5 }).reason).toBe('USAGE_LIMIT_REACHED')
		expect(evaluate({ minPurchase: '150000' }).reason).toBe('BELOW_MIN_PURCHASE')
	})

	test('rejected vouchers discount nothing', () => {
		expect(evaluate({ isActive: false }).discountAmount).toBe('0')
	})

	test('date range is inclusive', () => {
		expect(evaluate({ validUntil: NOW }).valid).toBe(true)
	})
})
