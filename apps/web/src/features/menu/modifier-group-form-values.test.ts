import { describe, expect, it } from 'vitest'

import type { ModifierGroupWithOptionsDto } from './dto/index.ts'
import {
	createModifierOption,
	emptyModifierGroupFormValues,
	ModifierGroupFormSchema,
	nextModifierSortOrder,
	toModifierGroupCreateInput,
	toModifierGroupFormValues,
	toModifierGroupUpdateInput,
} from './modifier-group-form-values.ts'

const group: ModifierGroupWithOptionsDto = {
	id: 7,
	locationId: 3,
	name: 'Ukuran',
	selectionType: 'multiple',
	isRequired: true,
	minSelect: 1,
	maxSelect: null,
	options: [
		{
			id: 11,
			groupId: 7,
			name: 'Besar',
			priceAdjustment: '-2500.125000',
			isDefault: false,
			sortOrder: 4,
			isActive: false,
		},
		{
			id: 12,
			groupId: 7,
			name: 'Kecil',
			priceAdjustment: '0',
			isDefault: true,
			sortOrder: 2,
			isActive: true,
		},
	],
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	createdBy: 1,
	updatedBy: 1,
}

describe('modifier group form values', () => {
	it('round-trips booleans, signed precision, flags, order and inactive options without identifiers', () => {
		const values = toModifierGroupFormValues(group)
		const body = toModifierGroupUpdateInput(group.id, values)
		expect(body).toEqual({
			id: 7,
			name: 'Ukuran',
			selectionType: 'multiple',
			isRequired: true,
			minSelect: 1,
			maxSelect: null,
			options: [
				{
					name: 'Besar',
					priceAdjustment: '-2500.125000',
					isDefault: false,
					sortOrder: 4,
					isActive: false,
				},
				{ name: 'Kecil', priceAdjustment: '0', isDefault: true, sortOrder: 2, isActive: true },
			],
		})
		expect(new Set(values.options.map((option) => option.clientKey)).size).toBe(2)
		expect(body).not.toHaveProperty('locationId')
	})

	it('create carries the pinned location and trims typed values', () => {
		const values = emptyModifierGroupFormValues()
		values.name = '  Gula  '
		values.options[0]!.name = ' Normal '
		values.options[0]!.priceAdjustment = ' -1.50 '
		expect(toModifierGroupCreateInput(5, values)).toMatchObject({
			locationId: 5,
			name: 'Gula',
			options: [{ name: 'Normal', priceAdjustment: '-1.50', isDefault: false, isActive: true }],
		})
	})

	it.each(['0', '-12', '12.500', '-0.01'])('accepts signed decimal %s', (priceAdjustment) => {
		const values = toModifierGroupFormValues(group)
		values.options[0]!.priceAdjustment = priceAdjustment
		expect(ModifierGroupFormSchema.safeParse(values).success).toBe(true)
	})

	it.each(['', '+5', '.5', '1,5', 'abc'])(
		'rejects non-decimal adjustment %j',
		(priceAdjustment) => {
			const values = toModifierGroupFormValues(group)
			values.options[0]!.priceAdjustment = priceAdjustment
			expect(ModifierGroupFormSchema.safeParse(values).success).toBe(false)
		},
	)

	it('requires at least one option and places new rows after the highest persisted order', () => {
		const values = toModifierGroupFormValues(group)
		expect(ModifierGroupFormSchema.safeParse({ ...values, options: [] }).success).toBe(false)
		expect(nextModifierSortOrder(values.options)).toBe(5)
		expect(nextModifierSortOrder([])).toBe(0)
		expect(createModifierOption(5).clientKey).not.toBe(createModifierOption(5).clientKey)
	})
})
