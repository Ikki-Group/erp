import { weightedAvgCost } from '@/shared/domain/costing.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

import { describe, expect, test } from 'bun:test'

describe('Money', () => {
	test('preserves decimal arithmetic until numeric serialization', () => {
		expect(Money.of('0.1').add(Money.of('0.2')).toNumeric()).toBe('0.30')
	})

	test('supports multiplication, percentage, comparisons, and boundaries', () => {
		const amount = Money.of('100.125')
		expect(amount.mul(Qty.of('2')).toNumeric()).toBe('200.25')
		expect(amount.percent(11).toNumeric()).toBe('11.01')
		expect(amount.gt(Money.of('100'))).toBe(true)
		expect(amount.gte(Money.of('100.125'))).toBe(true)
		expect(amount.toNumber()).toBe(100)
		expect(Money.zero().isZero()).toBe(true)
	})
})

describe('Qty', () => {
	test('supports high-precision arithmetic and serialization', () => {
		expect(Qty.of('1').add(Qty.of('0.1234567')).toNumeric()).toBe('1.123457')
		expect(Qty.of('2').mul('1.5').toNumeric()).toBe('3.000000')
		expect(Qty.of('1').div(Qty.of('3')).toNumeric()).toBe('0.333333')
	})

	test('division by zero returns zero', () => {
		expect(Qty.of('1').div(Qty.zero()).isZero()).toBe(true)
	})

	test('supports quantity comparisons', () => {
		expect(Qty.of('1').lt(Qty.of('2'))).toBe(true)
		expect(Qty.of('2').gte(Qty.of('2'))).toBe(true)
	})
})

describe('weightedAvgCost', () => {
	test('calculates the weighted average with value objects', () => {
		const result = weightedAvgCost(Qty.of('100'), Money.of('5000'), Qty.of('50'), Money.of('6000'))

		expect(result.toNumeric()).toBe('5333.33')
	})

	test('returns zero for zero total quantity', () => {
		expect(weightedAvgCost(Qty.zero(), Money.zero(), Qty.zero(), Money.zero()).isZero()).toBe(true)
	})
})
