import { weightedAvgCost } from '@/shared/domain/costing.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

import { describe, expect, test } from 'bun:test'

describe('Money', () => {
	test('serializes currency amounts at zero decimal places', () => {
		expect(Money.of('0.1').add(Money.of('0.2')).toAmount()).toBe('0')
		expect(Money.of('100.5').toAmount()).toBe('101')
	})

	test('serializes unit costs at four decimal places', () => {
		expect(Money.of('5333.333333').toCost()).toBe('5333.3333')
		expect(Money.of('100').toCost()).toBe('100.0000')
	})

	test('supports multiplication, division, percentage, and comparisons', () => {
		const amount = Money.of('100.125')
		expect(amount.mul(Qty.of('2')).toAmount()).toBe('200')
		expect(amount.percent(11).toAmount()).toBe('11')
		expect(Money.of('10').div(Qty.of('4')).toCost()).toBe('2.5000')
		expect(amount.gt(Money.of('100'))).toBe(true)
		expect(amount.gte(Money.of('100.125'))).toBe(true)
		expect(Money.zero().isZero()).toBe(true)
	})
})

describe('Qty', () => {
	test('supports high-precision arithmetic and serialization', () => {
		expect(Qty.of('1').add(Qty.of('0.1234567')).toNumeric()).toBe('1.123457')
		expect(Qty.of('2').mul('1.5').toNumeric()).toBe('3.000000')
		expect(Qty.of('1').div(Qty.of('3')).toNumeric()).toBe('0.333333')
	})

	test('supports absolute value and quantity comparisons', () => {
		expect(Qty.of('-1.5').abs().toNumeric()).toBe('1.500000')
		expect(Qty.of('1').lt(Qty.of('2'))).toBe(true)
		expect(Qty.of('2').gte(Qty.of('2'))).toBe(true)
		expect(Qty.of('2').eq(Qty.of('2'))).toBe(true)
	})

	test('division by zero returns zero', () => {
		expect(Qty.of('1').div(Qty.zero()).isZero()).toBe(true)
	})
})

describe('weightedAvgCost', () => {
	test('calculates the weighted average with value objects', () => {
		const result = weightedAvgCost(Qty.of('100'), Money.of('5000'), Qty.of('50'), Money.of('6000'))

		expect(result.toCost()).toBe('5333.3333')
	})

	test('resets to incoming cost when old stock is zero or negative', () => {
		expect(
			weightedAvgCost(Qty.zero(), Money.of('1000'), Qty.of('5'), Money.of('6000')).toCost(),
		).toBe('6000.0000')
		expect(
			weightedAvgCost(Qty.of('-2'), Money.of('1000'), Qty.of('5'), Money.of('6000')).toCost(),
		).toBe('6000.0000')
	})

	test('returns zero for zero total quantity when old stock is positive', () => {
		expect(
			weightedAvgCost(Qty.of('1'), Money.of('5000'), Qty.of('-1'), Money.of('6000')).isZero(),
		).toBe(true)
	})
})
