import { describe, expect, it } from 'vitest'

import type { RecipeDetailDto } from './dto/index.ts'
import {
	createRecipeLine,
	emptyRecipeFormValues,
	RecipeFormSchema,
	toRecipeFormValues,
	toRecipeInput,
	toRecipeUpdateInput,
} from './recipe-form-values.ts'

const audit = {
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	createdBy: 1,
	updatedBy: 1,
}

const detail: RecipeDetailDto = {
	id: 4,
	menuItemId: 9,
	name: 'Es Kopi Susu',
	yieldQty: '2.5000',
	isActive: true,
	...audit,
	lines: [
		{
			id: 1,
			recipeId: 4,
			materialId: 11,
			quantity: '0.0500',
			uomId: 3,
			materialName: 'Kopi',
			uomCode: 'kg',
		},
		{
			id: 2,
			recipeId: 4,
			materialId: 12,
			quantity: '120',
			uomId: 4,
			materialName: 'Susu',
			uomCode: 'ml',
		},
	],
}

describe('recipe form mapping', () => {
	it('keeps decimal strings exactly as stored, without numeric round-trips', () => {
		const values = toRecipeFormValues(detail)
		expect(values.yieldQty).toBe('2.5000')
		expect(values.lines.map((l) => l.quantity)).toEqual(['0.0500', '120'])

		const input = toRecipeInput(values)
		expect(input.yieldQty).toBe('2.5000')
		expect(input.lines.map((l) => l.quantity)).toEqual(['0.0500', '120'])
	})

	it('gives each loaded row its own stable client key and never sends it', () => {
		const values = toRecipeFormValues(detail)
		const keys = values.lines.map((l) => l.clientKey)
		expect(new Set(keys).size).toBe(2)

		const input = toRecipeInput(values)
		for (const line of input.lines)
			expect(Object.keys(line).sort()).toEqual(['materialId', 'quantity', 'uomId'])
		expect(JSON.stringify(input)).not.toContain(keys[0])
	})

	it('omits the immutable menu item from an update body', () => {
		const update = toRecipeUpdateInput(4, toRecipeInput(toRecipeFormValues(detail)))
		expect(update).not.toHaveProperty('menuItemId')
		expect(update.id).toBe(4)
	})

	it('trims entered text and decimals in the payload', () => {
		const values = emptyRecipeFormValues()
		values.menuItemId = 9
		values.name = '  Kopi  '
		values.yieldQty = ' 1 '
		values.lines = [{ ...createRecipeLine(), materialId: 1, quantity: ' 0.5 ', uomId: 2 }]
		const input = toRecipeInput(values)
		expect(input).toMatchObject({ name: 'Kopi', yieldQty: '1' })
		expect(input.lines[0]?.quantity).toBe('0.5')
	})
})

describe('recipe form schema', () => {
	it('requires at least one ingredient with guidance', () => {
		const values = { ...toRecipeFormValues(detail), lines: [] }
		const result = RecipeFormSchema.safeParse(values)
		expect(result.success).toBe(false)
		expect(result.error?.issues).toContainEqual(expect.objectContaining({ path: ['lines'] }))
	})

	it('rejects non-decimal or negative quantities and accepts valid recipes', () => {
		const base = toRecipeFormValues(detail)
		expect(RecipeFormSchema.safeParse(base).success).toBe(true)
		for (const quantity of ['abc', '-1', '1,5', '']) {
			const bad = { ...base, lines: [{ ...base.lines[0]!, quantity }] }
			expect(RecipeFormSchema.safeParse(bad).success).toBe(false)
		}
	})
})
