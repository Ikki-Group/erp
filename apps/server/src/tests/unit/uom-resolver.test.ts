import { resolveConversion } from '@/modules/uom/domain/uom.resolver.ts'
import type { UomConversionDto } from '@/modules/uom/uom.contract.ts'

import { describe, expect, test } from 'bun:test'

const conversion = (fromUomId: number, toUomId: number, factor: string): UomConversionDto => ({
	id: fromUomId * 100 + toUomId,
	fromUomId,
	toUomId,
	factor,
	createdAt: new Date(),
	updatedAt: new Date(),
	createdBy: null,
	updatedBy: null,
})

describe('resolveConversion', () => {
	test('returns identity conversion without a path', () => {
		expect(resolveConversion(1, 1, '2.5', [])).toEqual({ result: '2.5', path: [] })
	})

	test('resolves a multi-hop conversion with decimal precision', () => {
		const result = resolveConversion(1, 3, '2', [
			conversion(1, 2, '1000'),
			conversion(2, 3, '1000'),
		])
		expect(result?.result).toBe('2000000')
		expect(result?.path).toHaveLength(2)
	})

	test('resolves inverse conversion by dividing the factor', () => {
		const result = resolveConversion(2, 1, '2500', [conversion(1, 2, '1000')])
		expect(result?.result).toBe('2.5')
	})

	test('returns null when no path exists', () => {
		expect(resolveConversion(1, 3, '2', [conversion(1, 2, '1000')])).toBeNull()
	})
})
