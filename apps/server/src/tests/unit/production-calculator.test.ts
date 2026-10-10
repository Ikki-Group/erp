import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

import {
	inputRequirement,
	outputUnitCost,
	plannedOutputQty,
} from '@/modules/production/production.calculator.ts'

import { describe, expect, test } from 'bun:test'

describe('production calculator', () => {
	test('planned output is yield times multiplier', () => {
		expect(plannedOutputQty(Qty.of('2.5'), Qty.of('3')).toNumeric()).toBe('7.500000')
	})

	test('input requirement scales the recipe line by planned / yield', () => {
		// Recipe: 1 L yield uses 600 g sugar; planned 2.5 L → 1500 g.
		expect(inputRequirement(Qty.of('600'), Qty.of('1'), Qty.of('2.5')).toNumeric()).toBe(
			'1500.000000',
		)
		// Non-integer ratio keeps full precision until serialization.
		expect(inputRequirement(Qty.of('1'), Qty.of('3'), Qty.of('1')).toNumeric()).toBe('0.333333')
	})

	test('output unit cost absorbs all input cost over output qty', () => {
		const cost = outputUnitCost(
			[
				{ qty: Qty.of('1500'), unitCost: Money.of('15') },
				{ qty: Qty.of('1000'), unitCost: Money.of('0.5') },
			],
			Qty.of('2500'),
		)
		// (22500 + 500) / 2500 = 9.2
		expect(cost.toCost()).toBe('9.2000')
	})

	test('zero output qty yields zero cost; zero-cost inputs yield zero cost', () => {
		expect(
			outputUnitCost([{ qty: Qty.of('1'), unitCost: Money.of('10') }], Qty.zero()).isZero(),
		).toBe(true)
		expect(
			outputUnitCost([{ qty: Qty.of('5'), unitCost: Money.zero() }], Qty.of('2')).isZero(),
		).toBe(true)
	})
})
