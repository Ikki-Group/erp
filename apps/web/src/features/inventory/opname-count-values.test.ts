import { describe, expect, it } from 'vitest'

import {
	changedOpnameCountRows,
	normalizeOpnameCountValues,
	OpnameCountFormSchema,
	opnameVariance,
	sameOpnameCounts,
	toOpnameCountsInput,
} from './opname-count-values.ts'
import type { OpnameCountFormValues } from './opname-count-values.ts'

const baseline: OpnameCountFormValues = {
	lines: [
		{ lineId: 1, materialId: 10, countedQty: '0', reason: 'Keep zero reason' },
		{ lineId: 2, materialId: 11, countedQty: '9007199254740993.500000', reason: '' },
	],
}

describe('opnameVariance', () => {
	it('is exact beyond double precision', () => {
		expect(opnameVariance('9007199254740993.500000', '9007199254740992.000001')).toBe('1.499999')
		expect(opnameVariance('0.1', '0.3')).toBe('-0.2')
	})
	it('treats zero as a real value and zero difference as 0', () => {
		expect(opnameVariance('0', '2.500125')).toBe('-2.500125')
		expect(opnameVariance('1.50', '1.5')).toBe('0')
		expect(opnameVariance('5', '12')).toBe('-7')
	})
	it('rejects non-decimal input', () => {
		expect(opnameVariance('', '1')).toBeUndefined()
		expect(opnameVariance('1e3', '1')).toBeUndefined()
	})
})

describe('count payload', () => {
	it('sends only changed lines, preserving the reason and clearing blank reasons to null', () => {
		const values: OpnameCountFormValues = {
			lines: [
				{ ...baseline.lines[0]!, countedQty: '3' },
				{ ...baseline.lines[1]!, reason: '  ' },
			],
		}
		expect(toOpnameCountsInput(7, values, baseline)).toEqual({
			opnameId: 7,
			lines: [{ materialId: 10, countedQty: '3', reason: 'Keep zero reason' }],
		})
		expect(changedOpnameCountRows(baseline, baseline)).toEqual([])
	})
	it('clears an existing reason to null', () => {
		const values = { lines: [{ ...baseline.lines[0]!, reason: '' }, baseline.lines[1]!] }
		expect(toOpnameCountsInput(7, values, baseline).lines).toEqual([
			{ materialId: 10, countedQty: '0', reason: null },
		])
	})
	it('normalizes the saved baseline', () => {
		expect(
			normalizeOpnameCountValues({
				lines: [{ ...baseline.lines[0]!, countedQty: ' 4 ', reason: ' x ' }],
			}).lines[0],
		).toMatchObject({ countedQty: '4', reason: 'x' })
	})
})

describe('reviewed saved counts', () => {
	it('ignores row order and decimal padding but detects exact quantity and reason changes', () => {
		const reordered = {
			lines: [
				{ ...baseline.lines[1]!, countedQty: '9007199254740993.5' },
				{ ...baseline.lines[0]!, countedQty: '0.000000' },
			],
		}
		expect(sameOpnameCounts(reordered, baseline)).toBe(true)
		expect(
			sameOpnameCounts(
				{ lines: [{ ...baseline.lines[0]!, countedQty: '0.000001' }, baseline.lines[1]!] },
				baseline,
			),
		).toBe(false)
		expect(
			sameOpnameCounts(
				{ lines: [{ ...baseline.lines[0]!, reason: '' }, baseline.lines[1]!] },
				baseline,
			),
		).toBe(false)
	})
})

describe('schema', () => {
	const parse = (countedQty: string) =>
		OpnameCountFormSchema.safeParse({ lines: [{ countedQty, reason: '' }] }).success
	it('accepts zero and long decimals; rejects empty, negative, and exponent forms', () => {
		expect(parse('0')).toBe(true)
		expect(parse('9007199254740993.500000')).toBe(true)
		expect(parse('')).toBe(false)
		expect(parse('-1')).toBe(false)
		expect(parse('1e3')).toBe(false)
	})
})
