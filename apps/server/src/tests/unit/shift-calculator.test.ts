import { Money } from '@/shared/domain/money.ts'

import { reconcileShift } from '@/modules/pos/shift/shift.calculator.ts'

import { describe, expect, test } from 'bun:test'

describe('reconcileShift', () => {
	test('expected cash is opening plus cash payments', () => {
		const { expectedCash, variance } = reconcileShift({
			openingCash: Money.of('500000'),
			cashPayments: Money.of('250000'),
			closingCash: Money.of('750000'),
		})
		expect(expectedCash.toAmount()).toBe('750000')
		expect(variance.isZero()).toBe(true)
	})

	test('short drawer gives a negative variance', () => {
		const { variance } = reconcileShift({
			openingCash: Money.of('500000'),
			cashPayments: Money.of('250000'),
			closingCash: Money.of('740000'),
		})
		expect(variance.toAmount()).toBe('-10000')
	})

	test('over drawer gives a positive variance', () => {
		const { variance } = reconcileShift({
			openingCash: Money.zero(),
			cashPayments: Money.zero(),
			closingCash: Money.of('5000'),
		})
		expect(variance.toAmount()).toBe('5000')
	})
})
