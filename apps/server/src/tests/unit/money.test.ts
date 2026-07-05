/**
 * Unit tests for `@/shared/utils/money`.
 *
 * Verifies exact decimal math (no float drift) for the common money helpers.
 */

import { describe, expect, it } from 'bun:test'

import { money, sum, sumValues, toMoneyString, ZERO } from '@/shared/utils/money'

describe('money helpers', () => {
	it('money() wraps strings/numbers and is exact', () => {
		expect(money('0.1').plus(money('0.2')).toString()).toBe('0.3') // not 0.30000000000000004
		expect(money(5).toString()).toBe('5')
		expect(money().toString()).toBe('0')
	})

	it('money() is identity for a Decimal input', () => {
		const d = money('1.5')
		expect(money(d)).toBe(d)
	})

	it('ZERO is decimal zero', () => {
		expect(ZERO.toString()).toBe('0')
	})

	it('sum() adds a selected field with exact math', () => {
		const items = [{ v: '0.1' }, { v: '0.2' }, { v: '0.3' }]
		expect(sum(items, (i) => i.v).toString()).toBe('0.6')
		expect(sum([], () => 0).toString()).toBe('0')
	})

	it('sumValues() adds a list of money values', () => {
		expect(sumValues(['10.05', 20, money('0.95')]).toString()).toBe('31')
	})

	it('toMoneyString() formats to fixed scale', () => {
		expect(toMoneyString('5')).toBe('5.00')
		expect(toMoneyString('5.1', 3)).toBe('5.100')
	})
})
