import { describe, expect, it } from 'vitest'

import { tableChangeToSearch } from './list-search'
import {
	deriveResourceListState,
	mergeResourceTableSearch,
	updateResourceFilters,
	type ResourceListEnvelope,
} from './resource-list-state'

const rows = [{ id: 1, name: 'Coffee' }]
const loaded = {
	data: { data: rows, meta: { total: 24 } },
	isPending: false,
	isFetching: false,
	isError: false,
}

describe('resource list state', () => {
	it('does not misrepresent an initial error as an empty database', () => {
		const failed = { ...loaded, data: undefined, isError: true }
		expect(deriveResourceListState(failed, false).state).toBe('initial-error')
		expect(deriveResourceListState({ ...failed, isFetching: true }, true).state).toBe(
			'initial-error',
		)
	})

	it('keeps rows and totals during background refresh and refresh failure', () => {
		const refreshing = deriveResourceListState({ ...loaded, isFetching: true }, false)
		expect(refreshing).toMatchObject({ state: 'ready', recordCount: 24, isRefreshing: true })
		expect(refreshing.rows).toBe(rows)
		const failed = deriveResourceListState({ ...loaded, isError: true }, false)
		expect(failed.state).toBe('refresh-error')
		expect(failed.rows).toBe(rows)
		expect(failed.recordCount).toBe(24)
	})

	it('treats a previously successful empty query failure as an error, not record-empty', () => {
		expect(
			deriveResourceListState(
				{ ...loaded, data: { data: [], meta: { total: 0 } }, isError: true },
				false,
			).state,
		).toBe('refresh-error')
	})

	it('separates initial loading from cached results and shares the empty row reference', () => {
		const pending = { ...loaded, data: undefined, isPending: true, isFetching: true }
		const first = deriveResourceListState(pending, false)
		expect(first.state).toBe('initial-loading')
		expect(first.isRefreshing).toBe(false)
		expect(first.rows).toBe(deriveResourceListState(pending, false).rows)
	})

	it('only shows record-empty for an unfiltered empty collection, not an exhausted page', () => {
		const data: ResourceListEnvelope<{ id: number }> = { data: [], meta: { total: 0 } }
		expect(deriveResourceListState({ ...loaded, data }, false).state).toBe('record-empty')
		expect(deriveResourceListState({ ...loaded, data }, true).state).toBe('filtered-empty')
		expect(
			deriveResourceListState({ ...loaded, data: { ...data, meta: { total: 24 } } }, false).state,
		).toBe('filtered-empty')
	})
})

describe('resource list URL state', () => {
	const current = {
		page: 4,
		pageSize: 10,
		q: 'beans',
		sort: 'name:asc',
		categoryId: 7,
		isActive: 0,
		tab: 'materials',
	}

	it('preserves typed extra filters for pagination, sorting, and search changes', () => {
		const page = mergeResourceTableSearch(
			current,
			tableChangeToSearch(current, { pagination: { pageIndex: 4, pageSize: 25 } }),
		)
		expect(page).toEqual({ ...current, page: 5, pageSize: 25 })
		const sorted = mergeResourceTableSearch(
			current,
			tableChangeToSearch(current, { sorting: [{ id: 'code', desc: true }] }),
		)
		expect(sorted).toEqual({ ...current, page: 1, sort: 'code:desc' })
		const searched = mergeResourceTableSearch(
			current,
			tableChangeToSearch(current, { globalFilter: '' }),
		)
		expect(searched).toEqual({ ...current, page: 1, q: undefined })
	})

	it('resets page for filter changes without dropping zero-valued or unrelated filters', () => {
		const next = updateResourceFilters(current, { categoryId: 12 })
		expect(next).toEqual({ ...current, page: 1, categoryId: 12 })
		expect(current.page).toBe(4)
		const cleared = updateResourceFilters<{
			page: number
			pageSize: number
			categoryId?: number
			isActive?: number
		}>(current, { categoryId: undefined })
		expect(cleared.categoryId).toBeUndefined()
		expect(cleared.isActive).toBe(0)
	})
})
