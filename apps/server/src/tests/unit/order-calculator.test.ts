import {
	calculateLineTotal,
	calculateOrderTotals,
	remainingBalance,
} from '@/modules/pos/order/order.calculator.ts'

import { describe, expect, test } from 'bun:test'

describe('calculateLineTotal', () => {
	test('calculates a price snapshot with modifiers and quantity', () => {
		expect(calculateLineTotal({ basePrice: '20000', modifierPrices: ['5000'], qty: '2' })).toEqual({
			unitPrice: '25000',
			modifierTotal: '10000',
			lineTotal: '50000',
		})
	})

	test('keeps amount serialization at zero decimal places', () => {
		expect(calculateLineTotal({ basePrice: '100.5', modifierPrices: [], qty: '1' }).lineTotal).toBe(
			'101',
		)
	})
})

describe('calculateOrderTotals', () => {
	test('calculates subtotal, discount, tax, and total as numeric strings', () => {
		expect(
			calculateOrderTotals({
				lineTotals: ['50000', '50000'],
				discountAmount: '10000',
				taxRate: '11',
			}),
		).toEqual({
			subtotal: '100000',
			discountAmount: '10000',
			taxAmount: '9900',
			total: '99900',
		})
	})

	test('clamps taxable amount and total at zero', () => {
		const result = calculateOrderTotals({
			lineTotals: ['30000'],
			discountAmount: '50000',
			taxRate: '11',
		})
		expect(result.taxAmount).toBe('0')
		expect(result.total).toBe('0')
	})

	test('rounds tax at the amount boundary', () => {
		const result = calculateOrderTotals({
			lineTotals: ['33333'],
			discountAmount: '0',
			taxRate: '11',
		})
		expect(result.taxAmount).toBe('3667')
	})
})

describe('remainingBalance', () => {
	test('is the unpaid part of the total', () => {
		expect(remainingBalance('99900', '50000').toAmount()).toBe('49900')
	})

	test('is negative when overpaid', () => {
		expect(remainingBalance('99900', '100000').toAmount()).toBe('-100')
	})

	test('is zero when exactly paid', () => {
		expect(remainingBalance('0', '0').isZero()).toBe(true)
	})
})
