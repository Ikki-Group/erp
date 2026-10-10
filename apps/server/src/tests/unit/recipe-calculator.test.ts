import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

import { calculateHpp, recipeUsage } from '@/modules/recipe/recipe.calculator.ts'

import { describe, expect, test } from 'bun:test'

describe('calculateHpp', () => {
	test('sums line costs and divides by yield', () => {
		const { lineCosts, hpp } = calculateHpp(
			[
				{ baseQty: Qty.of('0.25'), unitCost: Money.of('80000') },
				{ baseQty: Qty.of('2'), unitCost: Money.of('1500.5') },
			],
			Qty.of('4'),
		)
		expect(lineCosts.map((c) => c.toCost())).toEqual(['20000.0000', '3001.0000'])
		expect(hpp.toCost()).toBe('5750.2500')
	})

	test('keeps sub-unit precision at the cost boundary', () => {
		const { hpp } = calculateHpp([{ baseQty: Qty.of('1'), unitCost: Money.of('10') }], Qty.of('3'))
		expect(hpp.toCost()).toBe('3.3333')
	})

	test('zero yield gives zero HPP', () => {
		const { hpp } = calculateHpp([{ baseQty: Qty.of('1'), unitCost: Money.of('100') }], Qty.zero())
		expect(hpp.toCost()).toBe('0.0000')
	})

	test('no lines gives zero HPP', () => {
		expect(calculateHpp([], Qty.of('1')).hpp.toCost()).toBe('0.0000')
	})
})

describe('recipeUsage', () => {
	test('scales recipe line by order qty over yield', () => {
		expect(recipeUsage(Qty.of('30'), Qty.of('3'), Qty.of('2')).toNumeric()).toBe('45.000000')
	})

	test('zero yield consumes nothing', () => {
		expect(recipeUsage(Qty.of('30'), Qty.of('3'), Qty.zero()).isZero()).toBe(true)
	})
})
