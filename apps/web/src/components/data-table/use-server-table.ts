import { useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { dataGridFeatures, type DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import { searchToTableState, tableChangeToSearch } from './list-search.ts'
import type { ListSearch } from './list-search.ts'

interface UseServerTableOptions<TData extends object> {
	data: TData[]
	columns: ColumnDef<DataGridFeatures, TData>[]
	totalCount: number
	/** Current list state, straight from the route's validated URL search. */
	search: ListSearch
	/** Called with the next list state to write back to the URL (router navigate). */
	onSearchChange: (next: ListSearch) => void
}

/**
 * Server-side table whose pagination, sorting, and search state lives in the
 * **URL** (via the route's `validateSearch`), not in component state. The hook
 * derives TanStack Table's state from the passed `search` and, on any change,
 * calls `onSearchChange` with the next `ListSearch` for the route to push onto
 * the URL. Because the URL is the single source of truth, list views are
 * shareable, survive refresh, and respond to the back button — and a route
 * `loader` can prefetch the exact page the URL describes.
 *
 * The hook is deliberately router-agnostic: it takes the current `search` and a
 * setter, so each route owns its own `validateSearch` schema (spreading
 * `listSearchSchema`) and its own `navigate` wiring.
 */
export function useServerTable<TData extends object>({
	data,
	columns,
	totalCount,
	search,
	onSearchChange,
}: UseServerTableOptions<TData>) {
	const { pagination, globalFilter, sorting } = searchToTableState(search)

	const table = useTable({
		features: dataGridFeatures,
		data,
		columns,
		pageCount: Math.ceil(totalCount / search.pageSize),
		state: {
			globalFilter,
			sorting,
			pagination,
		},
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		onGlobalFilterChange: (updater) => {
			const next = typeof updater === 'function' ? updater(globalFilter) : updater
			onSearchChange(tableChangeToSearch(search, { globalFilter: next as string }))
		},
		onSortingChange: (updater) => {
			const next = typeof updater === 'function' ? updater(sorting) : updater
			onSearchChange(tableChangeToSearch(search, { sorting: next }))
		},
		onPaginationChange: (updater) => {
			const next = typeof updater === 'function' ? updater(pagination) : updater
			onSearchChange(tableChangeToSearch(search, { pagination: next }))
		},
	})

	return {
		table,
		globalFilter,
		sorting,
		pagination,
		recordCount: totalCount,
	}
}
