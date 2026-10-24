// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { queryClient } from '@/lib/tanstack-query'

import { createMenuCategoryLookup } from './components/menu-category-lookup-field.tsx'

afterEach(() => {
	queryClient.clear()
	vi.unstubAllGlobals()
})

const audit = {
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
	createdBy: 1,
	updatedBy: 1,
}

/** 250 categories for location 1 served in pages by the requested page/limit/locationId. */
function stubCategoryServer() {
	vi.stubGlobal('localStorage', { getItem: () => null })
	const requests: URL[] = []
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (input) => {
			const url = new URL(String(input), 'http://localhost')
			requests.push(url)
			const page = Number(url.searchParams.get('page'))
			const limit = Number(url.searchParams.get('limit'))
			const total = 250
			const data = Array.from({ length: Math.min(limit, total - (page - 1) * limit) }, (_, i) => {
				const id = (page - 1) * limit + i + 1
				return {
					id,
					locationId: Number(url.searchParams.get('locationId')),
					name: `Category ${id}`,
					parentId: null,
					sortOrder: 0,
					...audit,
				}
			})
			return new Response(
				JSON.stringify({
					success: true,
					code: 'OK',
					data,
					meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
				}),
				{ headers: { 'Content-Type': 'application/json' } },
			)
		}),
	)
	return requests
}

describe('menu category lookup', () => {
	it('partitions eligible choices by the record location and keeps search/page in the key', () => {
		const page = { q: 'kemang', page: 2, limit: 25 }
		const loc1 = createMenuCategoryLookup(1).listOptions(page).queryKey
		const loc2 = createMenuCategoryLookup(2).listOptions(page).queryKey
		expect(loc1).toContainEqual(expect.objectContaining({ locationId: 1, ...page }))
		expect(loc2).toContainEqual(expect.objectContaining({ locationId: 2, ...page }))
		expect(loc1).not.toEqual(loc2)
		const detail1 = createMenuCategoryLookup(1).detailOptions(5).queryKey
		expect(detail1).not.toEqual(createMenuCategoryLookup(2).detailOptions(5).queryKey)
		expect(detail1).not.toEqual(loc1)
	})

	it('lists only the requested location page, mapped to id and name', async () => {
		const requests = stubCategoryServer()
		const lookup = createMenuCategoryLookup(1)
		const result = await queryClient.fetchQuery(lookup.listOptions({ page: 2, limit: 25 }))
		expect(result.data[0]).toEqual({ id: 26, name: 'Category 26' })
		expect(requests).toHaveLength(1)
		expect(requests[0]!.searchParams.get('locationId')).toBe('1')
	})

	it('resolves a selected category beyond the first 100 from the item detail without any request', async () => {
		const requests = stubCategoryServer()
		const lookup = createMenuCategoryLookup(1, { id: 125, name: 'Kemang category 125' })
		const result = await queryClient.fetchQuery(lookup.detailOptions(125))
		expect(result.data).toEqual({ id: 125, name: 'Kemang category 125' })
		expect(requests).toHaveLength(0)
		expect(lookup.label(result.data)).toBe('Kemang category 125')
	})

	it('resolves an unknown selection by paging the same location-scoped list, never widening it', async () => {
		const requests = stubCategoryServer()
		const lookup = createMenuCategoryLookup(1)
		const result = await queryClient.fetchQuery(lookup.detailOptions(125))
		expect(result.data).toEqual({ id: 125, name: 'Category 125' })
		expect(requests.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
		expect(requests.every((url) => url.searchParams.get('locationId') === '1')).toBe(true)
	})

	it('fails resolution when the category is not in the location, so the selection can be retried', async () => {
		stubCategoryServer()
		const lookup = createMenuCategoryLookup(1)
		await expect(
			queryClient.fetchQuery({ ...lookup.detailOptions(999), retry: false }),
		).rejects.toThrow('Kategori tidak ditemukan.')
	})
})
