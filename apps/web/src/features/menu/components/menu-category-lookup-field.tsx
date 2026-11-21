import { useMemo } from 'react'

import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { menuCategoryResource } from '../api'
import type { MenuCategoryRefDto } from '../dto'

const LOOKUP_PAGE_SIZE = 100

/**
 * Category choices come only from that location's paged category list. The category API has no
 * detail endpoint, so a selected category resolves from `known` (the item detail's own category)
 * or, failing that, by paging the same location-scoped list until it is found. Resolution never
 * adds to the eligible list.
 */
export function createMenuCategoryLookup(
	locationId: number,
	known?: MenuCategoryRefDto | null,
): ResourceLookupAdapter<MenuCategoryRefDto> {
	return {
		listOptions: (query) => ({
			queryKey: [...menuCategoryResource.keys.list({ ...query, locationId }), 'lookup'],
			queryFn: async ({ signal }) => {
				const page = await menuCategoryResource.list.fetch({ ...query, locationId }, signal)
				return {
					...page,
					data: page.data.map(({ id, name }) => ({ id, name })),
				}
			},
		}),
		detailOptions: (id) => ({
			queryKey: [...menuCategoryResource.keys.lists(), 'lookup-detail', locationId, id],
			queryFn: async ({ signal }) => {
				if (known?.id === id) return { success: true as const, code: 'OK', data: known }
				for (let page = 1; ; page++) {
					const result = await menuCategoryResource.list.fetch(
						{ page, limit: LOOKUP_PAGE_SIZE, locationId },
						signal,
					)
					const found = result.data.find((category) => category.id === id)
					if (found) {
						return {
							success: true as const,
							code: result.code,
							data: { id: found.id, name: found.name },
						}
					}
					if (page >= result.meta.totalPages) throw new Error('Kategori tidak ditemukan.')
				}
			},
		}),
		label: (category) => category.name,
	}
}

interface MenuCategoryLookupFieldProps extends LookupFieldProps {
	locationId: number
	/** The category the record already has, as enriched by the item detail. */
	known?: MenuCategoryRefDto | null
}

export function MenuCategoryLookupField({
	locationId,
	known,
	...props
}: MenuCategoryLookupFieldProps) {
	const knownId = known?.id
	const knownName = known?.name
	const adapter = useMemo(
		() =>
			createMenuCategoryLookup(
				locationId,
				knownId === undefined ? null : { id: knownId, name: knownName ?? '' },
			),
		[locationId, knownId, knownName],
	)
	return <ResourceLookupField adapter={adapter} placeholder="Cari kategori..." {...props} />
}
