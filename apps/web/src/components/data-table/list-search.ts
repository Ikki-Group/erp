import { z } from 'zod'

import type { PaginationState, SortingState } from '@tanstack/react-table'

/**
 * The canonical URL-search shape for a server-driven list page. Routes spread
 * `listSearchSchema` into their own `validateSearch` (extending it with
 * feature-specific filters), so pagination/search/sort live in the URL — which
 * makes list views shareable, refresh-stable, and back-button-correct, and lets
 * a route `loader` prefetch the right page.
 *
 * Sort is a compact `"field:dir"` string rather than a nested object so it
 * round-trips through the URL cleanly.
 */

const DEFAULT_PAGE_SIZE = 10

export const listSearchSchema = z.object({
	/** 1-based page number as seen in the URL. */
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(DEFAULT_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
	/** Free-text search term. Absent when empty. */
	q: z.string().min(1).optional(),
	/** Sort spec as `"field:asc"` / `"field:desc"`. Absent when unsorted. */
	sort: z.string().optional(),
})

export type ListSearch = z.infer<typeof listSearchSchema>

/** The subset of table state a change can carry back to the URL. */
export interface TableStateChange {
	pagination?: PaginationState
	globalFilter?: string
	sorting?: SortingState
}

/** The table-shaped state derived from a `ListSearch`. */
export interface DerivedTableState {
	pagination: PaginationState
	globalFilter: string
	sorting: SortingState
}

function parseSort(sort: string | undefined): SortingState {
	if (!sort) return []
	const [id, dir] = sort.split(':')
	if (!id) return []
	return [{ id, desc: dir === 'desc' }]
}

function serializeSort(sorting: SortingState): string | undefined {
	const first = sorting[0]
	if (!first) return undefined
	return `${first.id}:${first.desc ? 'desc' : 'asc'}`
}

/** Projects a URL `ListSearch` into the state shape TanStack Table consumes. */
export function searchToTableState(search: ListSearch): DerivedTableState {
	return {
		pagination: { pageIndex: search.page - 1, pageSize: search.pageSize },
		globalFilter: search.q ?? '',
		sorting: parseSort(search.sort),
	}
}

/**
 * Folds a table state change into the next `ListSearch`. Pagination maps
 * 0-based `pageIndex` back to the 1-based URL `page`; a search-term or sort
 * change resets to page 1 (you're looking at a different result set); an empty
 * term or empty sort is dropped from the search so the URL stays clean.
 */
export function tableChangeToSearch(current: ListSearch, change: TableStateChange): ListSearch {
	if (change.pagination) {
		return { ...current, page: change.pagination.pageIndex + 1, pageSize: change.pagination.pageSize }
	}

	if (change.globalFilter !== undefined) {
		const q = change.globalFilter.trim()
		return { ...current, page: 1, q: q === '' ? undefined : q }
	}

	if (change.sorting !== undefined) {
		return { ...current, page: 1, sort: serializeSort(change.sorting) }
	}

	return current
}
