import { calculateLineTotal, calculateOrderTotals } from '@/modules/pos/order/order.calculator.ts'

import { describe, expect, test } from 'bun:test'

// ─── calculateLineTotal ───

describe('calculateLineTotal', () => {
	test('base price only, qty 1', () => {
		const result = calculateLineTotal({ basePrice: 25000, modifierPrices: [], qty: 1 })
		expect(result.unitPrice).toBe(25000)
		expect(result.modifierTotal).toBe(0)
		expect(result.lineTotal).toBe(25000)
	})

	test('base price only, qty > 1', () => {
		const result = calculateLineTotal({ basePrice: 15000, modifierPrices: [], qty: 3 })
		expect(result.unitPrice).toBe(15000)
		expect(result.modifierTotal).toBe(0)
		expect(result.lineTotal).toBe(45000)
	})

	test('with single modifier', () => {
		const result = calculateLineTotal({ basePrice: 20000, modifierPrices: [5000], qty: 2 })
		expect(result.unitPrice).toBe(25000)
		expect(result.modifierTotal).toBe(10000) // 5000 × 2
		expect(result.lineTotal).toBe(50000) // 25000 × 2
	})

	test('with multiple modifiers', () => {
		const result = calculateLineTotal({
			basePrice: 30000,
			modifierPrices: [3000, 2000, 5000],
			qty: 1,
		})
		expect(result.unitPrice).toBe(40000)
		expect(result.modifierTotal).toBe(10000) // (3000+2000+5000) × 1
		expect(result.lineTotal).toBe(40000) // 40000 × 1
	})

	test('with modifiers and qty > 1', () => {
		const result = calculateLineTotal({
			basePrice: 18000,
			modifierPrices: [2000, 3000],
			qty: 4,
		})
		expect(result.unitPrice).toBe(23000) // 18000 + 5000
		expect(result.modifierTotal).toBe(20000) // 5000 × 4
		expect(result.lineTotal).toBe(92000) // 23000 × 4
	})

	test('zero base price with modifiers', () => {
		const result = calculateLineTotal({ basePrice: 0, modifierPrices: [5000], qty: 2 })
		expect(result.unitPrice).toBe(5000)
		expect(result.modifierTotal).toBe(10000)
		expect(result.lineTotal).toBe(10000)
	})

	test('empty modifiers array', () => {
		const result = calculateLineTotal({ basePrice: 10000, modifierPrices: [], qty: 5 })
		expect(result.modifierTotal).toBe(0)
		expect(result.lineTotal).toBe(50000)
	})
})

// ─── calculateOrderTotals ───

describe('calculateOrderTotals', () => {
	test('basic order no discount no tax', () => {
		const result = calculateOrderTotals({
			lineTotals: [25000, 30000, 15000],
			discountAmount: 0,
			taxRate: 0,
		})
		expect(result.subtotal).toBe(70000)
		expect(result.discountAmount).toBe(0)
		expect(result.taxAmount).toBe(0)
		expect(result.total).toBe(70000)
	})

	test('with 11% tax (PPN)', () => {
		const result = calculateOrderTotals({
			lineTotals: [100000],
			discountAmount: 0,
			taxRate: 11,
		})
		expect(result.subtotal).toBe(100000)
		expect(result.taxAmount).toBe(11000) // 100000 × 11 / 100
		expect(result.total).toBe(111000)
	})

	test('with discount and tax', () => {
		const result = calculateOrderTotals({
			lineTotals: [50000, 50000],
			discountAmount: 10000,
			taxRate: 11,
		})
		expect(result.subtotal).toBe(100000)
		expect(result.discountAmount).toBe(10000)
		// taxable = 100000 - 10000 = 90000; tax = 90000 × 11/100 = 9900
		expect(result.taxAmount).toBe(9900)
		// total = 100000 - 10000 + 9900 = 99900
		expect(result.total).toBe(99900)
	})

	test('discount equals subtotal', () => {
		const result = calculateOrderTotals({
			lineTotals: [50000],
			discountAmount: 50000,
			taxRate: 11,
		})
		expect(result.subtotal).toBe(50000)
		// taxable = max(0, 50000 - 50000) = 0; tax = 0
		expect(result.taxAmount).toBe(0)
		// total = max(0, 50000 - 50000 + 0) = 0
		expect(result.total).toBe(0)
	})

	test('discount exceeds subtotal (clamped to 0)', () => {
		const result = calculateOrderTotals({
			lineTotals: [30000],
			discountAmount: 50000,
			taxRate: 11,
		})
		// taxable = max(0, 30000 - 50000) = 0
		expect(result.taxAmount).toBe(0)
		// total = max(0, 30000 - 50000 + 0) = 0
		expect(result.total).toBe(0)
	})

	test('single line', () => {
		const result = calculateOrderTotals({
			lineTotals: [45000],
			discountAmount: 5000,
			taxRate: 10,
		})
		expect(result.subtotal).toBe(45000)
		// taxable = 40000; tax = 4000
		expect(result.taxAmount).toBe(4000)
		expect(result.total).toBe(44000) // 45000 - 5000 + 4000
	})

	test('many lines', () => {
		const result = calculateOrderTotals({
			lineTotals: [10000, 20000, 30000, 40000, 50000],
			discountAmount: 0,
			taxRate: 11,
		})
		expect(result.subtotal).toBe(150000)
		expect(result.taxAmount).toBe(16500) // 150000 × 11/100
		expect(result.total).toBe(166500)
	})

	test('tax rounding (non-integer result rounds half up)', () => {
		// 75000 × 11 / 100 = 8250 (exact, no rounding needed)
		const result = calculateOrderTotals({
			lineTotals: [75000],
			discountAmount: 0,
			taxRate: 11,
		})
		expect(result.taxAmount).toBe(8250)

		// 33333 × 11 / 100 = 3666.63 → rounds to 3667
		const result2 = calculateOrderTotals({
			lineTotals: [33333],
			discountAmount: 0,
			taxRate: 11,
		})
		expect(result2.taxAmount).toBe(3667)
	})
})
