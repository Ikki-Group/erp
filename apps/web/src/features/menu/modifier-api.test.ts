// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'

import { queryClient } from '@/lib/tanstack-query'

import { menuItemExtras, modifierGroupResource } from './api'
import { ModifierGroupWithOptionsDto, MenuItemDetailDto } from './dto'

const group = {
	id: 1,
	locationId: 2,
	name: 'Flavor',
	selectionType: 'multiple',
	isRequired: true,
	minSelect: 0,
	maxSelect: null,
	createdAt: '2026-01-01',
	updatedAt: '2026-01-01',
	createdBy: 1,
	updatedBy: 1,
	options: [
		{
			id: 3,
			groupId: 1,
			name: 'Discount',
			priceAdjustment: '-0.125000',
			isDefault: true,
			isActive: false,
			sortOrder: 9,
		},
	],
}
afterEach(() => {
	queryClient.clear()
	vi.unstubAllGlobals()
})

it('accepts server booleans in modifier and composed item responses without losing option flags or price precision', () => {
	const parsed = ModifierGroupWithOptionsDto.parse(group)
	expect(parsed.isRequired).toBe(true)
	expect(parsed.options[0]).toMatchObject({
		isDefault: true,
		isActive: false,
		priceAdjustment: '-0.125000',
		sortOrder: 9,
	})
	const item = MenuItemDetailDto.parse({
		id: 1,
		locationId: 2,
		sku: 'COFFEE',
		name: 'Coffee',
		categoryId: null,
		basePrice: '10000',
		status: 'active',
		imageUrl: null,
		category: null,
		modifierGroups: [group],
		createdAt: '2026-01-01',
		updatedAt: '2026-01-01',
		createdBy: 1,
		updatedBy: 1,
	})
	expect(item.modifierGroups[0]?.options[0]?.isActive).toBe(false)
})

it.each(['create', 'update', 'remove'] as const)(
	'%s invalidates modifier list/detail and composed item readers',
	async (action) => {
		vi.stubGlobal('localStorage', { getItem: () => null })
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>(async () =>
				Response.json({ success: true, code: 'OK', data: { id: 1 } }),
			),
		)
		const list = modifierGroupResource.list.queryOptions({
			locationId: 2,
			page: 1,
			limit: 10,
		}).queryKey
		const detail = modifierGroupResource.detail.queryOptions({ id: 1 }).queryKey
		const item = menuItemExtras.detail.queryOptions({ id: 1 }).queryKey
		for (const key of [list, detail, item])
			queryClient.setQueryData(key, { success: true, code: 'OK', data: [] })
		const input = {
			name: 'Flavor',
			selectionType: 'multiple' as const,
			isRequired: true,
			minSelect: 0,
			maxSelect: null,
			options: [
				{
					name: 'Discount',
					priceAdjustment: '-0.125000',
					isDefault: true,
					isActive: false,
					sortOrder: 9,
				},
			],
		}
		const mutations = {
			create: () => modifierGroupResource.create.fetch({ locationId: 2, ...input }),
			update: () => modifierGroupResource.update.fetch({ id: 1, ...input }),
			remove: () => modifierGroupResource.remove.fetch({ id: 1 }),
		}
		await mutations[action]()
		for (const key of [list, detail, item])
			expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
	},
)
