import { describe, expect, test } from 'bun:test'

import {
	Decimal,
	roundCost,
	roundPrice,
	roundQty,
	safeDivide,
	toDecimal,
	weightedAvgCost,
} from '@/shared/utils/money.ts'

// ─── toDecimal ───

describe('toDecimal', () => {
	test('from number', () => {
		const d = toDecimal(100)
		expect(d.toNumber()).toBe(100)
	})

	test('from string', () => {
		const d = toDecimal('123.456789')
		expect(d.toString()).toBe('123.456789')
	})

	test('from zero', () => {
		const d = toDecimal(0)
		expect(d.isZero()).toBe(true)
	})
})

// ─── roundPrice ───

describe('roundPrice', () => {
	test('rounds to nearest integer (half up)', () => {
		expect(roundPrice(toDecimal('4399.5'))).toBe(4400)
	})

	test('rounds down below .5', () => {
		expect(roundPrice(toDecimal('4399.4'))).toBe(4399)
	})

	test('integer passes through', () => {
		expect(roundPrice(toDecimal(15000))).toBe(15000)
	})

	test('zero', () => {
		expect(roundPrice(toDecimal(0))).toBe(0)
	})

	test('large IDR price', () => {
		expect(roundPrice(toDecimal('1500000.7'))).toBe(1500001)
	})
})

// ─── roundCost ───

describe('roundCost', () => {
	test('rounds to 4dp', () => {
		expect(roundCost(toDecimal('5000.12345'))).toBe('5000.1235')
	})

	test('pads to 4dp', () => {
		expect(roundCost(toDecimal(100))).toBe('100.0000')
	})

	test('zero', () => {
		expect(roundCost(toDecimal(0))).toBe('0.0000')
	})

	test('preserves 4dp without rounding', () => {
		expect(roundCost(toDecimal('999.9999'))).toBe('999.9999')
	})
})

// ─── roundQty ───

describe('roundQty', () => {
	test('rounds to 6dp', () => {
		expect(roundQty(toDecimal('1.1234567'))).toBe('1.123457')
	})

	test('pads to 6dp', () => {
		expect(roundQty(toDecimal(5))).toBe('5.000000')
	})

	test('zero', () => {
		expect(roundQty(toDecimal(0))).toBe('0.000000')
	})
})

// ─── weightedAvgCost ───

describe('weightedAvgCost', () => {
	test('basic weighted average', () => {
		// (100 × 5000 + 50 × 6000) / 150 = 800000/150 = 5333.3333...
		const result = weightedAvgCost(toDecimal(100), toDecimal(5000), toDecimal(50), toDecimal(6000))
		expect(roundCost(result)).toBe('5333.3333')
	})

	test('first inbound (oldQty=0)', () => {
		const result = weightedAvgCost(toDecimal(0), toDecimal(0), toDecimal(100), toDecimal(5000))
		expect(roundCost(result)).toBe('5000.0000')
	})

	test('zero total qty returns 0', () => {
		const result = weightedAvgCost(toDecimal(0), toDecimal(0), toDecimal(0), toDecimal(0))
		expect(roundCost(result)).toBe('0.0000')
	})

	test('same cost stays unchanged', () => {
		const result = weightedAvgCost(toDecimal(50), toDecimal(3000), toDecimal(50), toDecimal(3000))
		expect(roundCost(result)).toBe('3000.0000')
	})

	test('large quantities', () => {
		// (10000 × 1500 + 5000 × 2000) / 15000 = 25000000/15000 = 1666.6667
		const result = weightedAvgCost(
			toDecimal(10000),
			toDecimal(1500),
			toDecimal(5000),
			toDecimal(2000),
		)
		expect(roundCost(result)).toBe('1666.6667')
	})

	test('fractional quantities', () => {
		// (2.5 × 10000 + 1.5 × 12000) / 4 = 43000/4 = 10750
		const result = weightedAvgCost(
			toDecimal('2.5'),
			toDecimal(10000),
			toDecimal('1.5'),
			toDecimal(12000),
		)
		expect(roundCost(result)).toBe('10750.0000')
	})
})

// ─── safeDivide ───

describe('safeDivide', () => {
	test('normal division', () => {
		expect(roundCost(safeDivide(toDecimal(120000), toDecimal(12)))).toBe('10000.0000')
	})

	test('divide by zero returns 0', () => {
		expect(roundCost(safeDivide(toDecimal(100), toDecimal(0)))).toBe('0.0000')
	})

	test('zero numerator', () => {
		expect(roundCost(safeDivide(toDecimal(0), toDecimal(50)))).toBe('0.0000')
	})

	test('fractional result', () => {
		// 10000 / 3 = 3333.3333...
		expect(roundCost(safeDivide(toDecimal(10000), toDecimal(3)))).toBe('3333.3333')
	})

	test('result preserves precision in Decimal', () => {
		const result = safeDivide(toDecimal(1), toDecimal(7))
		// Should not lose precision — Decimal has 20dp configured
		expect(result.toDecimalPlaces(10).toString()).toBe('0.1428571429')
	})
})

// ─── Decimal re-export ───

describe('Decimal re-export', () => {
	test('Decimal is usable for arithmetic', () => {
		const a = new Decimal(100)
		const b = new Decimal(200)
		expect(a.add(b).toNumber()).toBe(300)
	})
})
