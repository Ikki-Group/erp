import { describe, expect, it } from 'vitest'

import { calculateReceivingAmounts } from './receiving-amounts.ts'

describe('calculateReceivingAmounts', () => {
	it('multiplies and sums decimal strings without floating-point rounding', () => {
		expect(
			calculateReceivingAmounts([
				{ qty: '0.1', unitCost: '0.2' },
				{ qty: '0.3', unitCost: '0.1' },
			]),
		).toEqual({ subtotals: ['0.02', '0.03'], total: '0.05' })
	})

	it('preserves large prices and fractional quantities beyond Number precision', () => {
		expect(
			calculateReceivingAmounts([
				{ qty: '1', unitCost: '9007199254740993.01' },
				{ qty: '0.0001', unitCost: '0.0001' },
			]),
		).toEqual({
			subtotals: ['9007199254740993.01', '0.00000001'],
			total: '9007199254740993.01000001',
		})
	})

	it('normalizes insignificant zeros without losing valid zero prices', () => {
		expect(
			calculateReceivingAmounts([
				{ qty: '02.500', unitCost: '10.00' },
				{ qty: '4', unitCost: '0' },
			]),
		).toEqual({ subtotals: ['25', '0'], total: '25' })
	})

	it('does not display an incomplete or invalid amount as a zero-priced receipt', () => {
		expect(
			calculateReceivingAmounts([
				{ qty: '2', unitCost: '' },
				{ qty: '1', unitCost: '12oops' },
				{ qty: '1', unitCost: '5' },
			]),
		).toEqual({ subtotals: [undefined, undefined, '5'], total: undefined })
	})
})
