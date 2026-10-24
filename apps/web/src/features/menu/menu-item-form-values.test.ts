import { describe, expect, it } from 'vitest'

import {
	emptyMenuItemFormValues,
	MenuItemFormSchema,
	toMenuItemCreateInput,
	toMenuItemFormValues,
	toMenuItemUpdateInput,
} from './menu-item-form-values.ts'

const item = {
	sku: 'MNU-1',
	name: 'Es Kopi',
	categoryId: 125,
	basePrice: '82340.500125',
	status: 'active' as const,
}

describe('menu item form values', () => {
	it('keeps the exact decimal price string through form and payload mapping', () => {
		const values = toMenuItemFormValues(item)
		expect(values.basePrice).toBe('82340.500125')
		expect(MenuItemFormSchema.safeParse(values).success).toBe(true)
		expect(toMenuItemUpdateInput(1, values).basePrice).toBe('82340.500125')
		expect(toMenuItemCreateInput(3, values).basePrice).toBe('82340.500125')
	})

	it('never sends imageUrl, so the stored image is untouched', () => {
		const values = toMenuItemFormValues(item)
		expect(toMenuItemUpdateInput(1, values)).not.toHaveProperty('imageUrl')
		expect(toMenuItemCreateInput(3, values)).not.toHaveProperty('imageUrl')
	})

	it('pins create to the given location and update to the record id, trimming text', () => {
		const values = { ...toMenuItemFormValues(item), sku: ' A1 ', name: ' Kopi ', basePrice: ' 10 ' }
		expect(toMenuItemCreateInput(3, values)).toEqual({
			locationId: 3,
			sku: 'A1',
			name: 'Kopi',
			categoryId: 125,
			basePrice: '10',
			status: 'active',
		})
		expect(toMenuItemUpdateInput(9, values)).not.toHaveProperty('locationId')
	})

	it('supports clearing the category with null', () => {
		const values = { ...toMenuItemFormValues(item), categoryId: null }
		expect(toMenuItemUpdateInput(1, values).categoryId).toBeNull()
		expect(MenuItemFormSchema.safeParse(values).success).toBe(true)
	})

	it('rejects empty and non-decimal prices', () => {
		for (const basePrice of ['', '1,5', '-1', 'abc']) {
			expect(
				MenuItemFormSchema.safeParse({
					...emptyMenuItemFormValues(),
					sku: 'a',
					name: 'bb',
					basePrice,
				}).success,
			).toBe(false)
		}
	})
})
