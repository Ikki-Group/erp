import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { toDisplayCurrency } from '@/lib/currency'

import type { SupplierMaterialDto } from './dto/index.ts'
import {
	PricingFormSchema,
	toPricingCreateInput,
	toPricingFormValues,
	toPricingUpdateInput,
} from './pricing-form-values'

const pricing: SupplierMaterialDto = {
	id: 9,
	supplierId: 7,
	materialId: 225,
	unitPrice: '82340.500125',
	uomId: 125,
	minOrderQty: '0',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-02T00:00:00.000Z'),
	createdBy: null,
	updatedBy: null,
}

describe('supplier pricing form mapping', () => {
	it('retains exact decimal strings, selected IDs and zero minimum when editing', () => {
		expect(toPricingFormValues(pricing)).toEqual({
			materialId: 225,
			unitPrice: '82340.500125',
			uomId: 125,
			minOrderQty: '0',
		})
		expect(toPricingFormValues({ ...pricing, minOrderQty: null }).minOrderQty).toBe('')
	})

	it('trims without rounding and distinguishes an absent minimum from zero', () => {
		const values = {
			...toPricingFormValues(pricing),
			unitPrice: ' 0.000125 ',
			minOrderQty: ' 0 ',
		}
		expect(toPricingCreateInput(7, values)).toEqual({
			supplierId: 7,
			materialId: 225,
			unitPrice: '0.000125',
			uomId: 125,
			minOrderQty: '0',
		})
		expect(toPricingCreateInput(7, { ...values, minOrderQty: ' \t ' }).minOrderQty).toBeNull()
		expect(values.unitPrice).toBe(' 0.000125 ')
	})

	it('updates only mutable price fields, never supplier or material identity', () => {
		expect(toPricingUpdateInput(9, { ...toPricingFormValues(pricing), materialId: 999 })).toEqual({
			id: 9,
			unitPrice: '82340.500125',
			uomId: 125,
			minOrderQty: '0',
		})
	})

	it.each(['.5', '1.', '-1', '1e3', '1,5'])(
		'rejects noncanonical decimal %s in both form and payload',
		(value) => {
			const minimum = { ...toPricingFormValues(pricing), minOrderQty: value }
			const price = { ...toPricingFormValues(pricing), unitPrice: value }
			expect(PricingFormSchema.safeParse(minimum).success).toBe(false)
			expect(PricingFormSchema.safeParse(price).success).toBe(false)
			expect(() => toPricingCreateInput(7, minimum)).toThrow(z.ZodError)
			expect(() => toPricingCreateInput(7, price)).toThrow(z.ZodError)
		},
	)

	it('accepts blank minimum and canonical zero without accepting missing required selections', () => {
		const values = { ...toPricingFormValues(pricing), unitPrice: ' 0 ', minOrderQty: ' ' }
		expect(PricingFormSchema.safeParse(values).success).toBe(true)
		expect(PricingFormSchema.safeParse({ ...values, materialId: null }).success).toBe(false)
		expect(PricingFormSchema.safeParse({ ...values, uomId: null }).success).toBe(false)
	})

	it.each([
		['0.000125', '0,000125'],
		['82340.500125', '82.340,500125'],
		['900719925474099312345.00000100', '900.719.925.474.099.312.345,00000100'],
	])('groups %s without losing decimal precision or trailing zeroes', (value, displayed) => {
		expect(
			toDisplayCurrency(
				toPricingUpdateInput(9, { ...toPricingFormValues(pricing), unitPrice: value }).unitPrice,
			),
		).toBe(displayed)
	})
})
