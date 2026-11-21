import { describe, expect, it } from 'vitest'

import { createMaterialLookup } from '@/features/material/components/material-lookup-field'
import { createMenuItemLookup } from '@/features/menu/components/menu-item-lookup-field'

const page = { q: 'kopi', page: 2, limit: 25 }

describe('location-scoped lookups', () => {
	it('partitions material choices by location without losing search or pagination', () => {
		const loc1 = createMaterialLookup(1).listOptions(page).queryKey
		const loc2 = createMaterialLookup(2).listOptions(page).queryKey
		expect(loc1).toContainEqual(expect.objectContaining({ locationId: 1, ...page }))
		expect(loc2).toContainEqual(expect.objectContaining({ locationId: 2, ...page }))
		expect(loc1).not.toEqual(loc2)
	})

	it('keeps global material lookup separate from location-scoped choices', () => {
		const key = createMaterialLookup().listOptions(page).queryKey
		expect(key).not.toContainEqual(expect.objectContaining({ locationId: expect.any(Number) }))
		expect(key).not.toEqual(createMaterialLookup(1).listOptions(page).queryKey)
	})

	it('resolves selected material detail independently without widening the eligible list key', () => {
		const lookup = createMaterialLookup(1)
		const eligible = lookup.listOptions(page).queryKey
		expect(lookup.detailOptions(5).queryKey).toEqual(
			createMaterialLookup(2).detailOptions(5).queryKey,
		)
		expect(lookup.detailOptions(5).queryKey).not.toEqual(eligible)
		expect(lookup.listOptions(page).queryKey).toEqual(eligible)
		expect(eligible).toContainEqual(expect.objectContaining({ locationId: 1 }))
	})

	it('partitions menu choices by location while keeping selected detail canonical', () => {
		const loc1 = createMenuItemLookup(7)
		const loc2 = createMenuItemLookup(8)
		expect(loc1.listOptions(page).queryKey).toContainEqual(
			expect.objectContaining({ locationId: 7, ...page }),
		)
		expect(loc2.listOptions(page).queryKey).not.toEqual(loc1.listOptions(page).queryKey)
		expect(loc1.detailOptions(5).queryKey).toEqual(loc2.detailOptions(5).queryKey)
		expect(loc1.detailOptions(5).queryKey).not.toEqual(loc1.listOptions(page).queryKey)
	})
})
