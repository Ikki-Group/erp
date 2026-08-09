import { useState } from 'react'
import { useTable } from '@tanstack/react-table'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'

import { dataGridFeatures, type DataGridFeatures } from '@/components/reui/data-grid/data-grid'

interface UseServerTableOptions<TData extends object> {
	data: TData[]
	columns: ColumnDef<DataGridFeatures, TData>[]
	totalCount: number
	pageSize?: number
	defaultPage?: number
	defaultSearch?: string
	onStateChange?: (params: ServerTableParams) => void
}

export interface ServerTableParams {
	page: number
	pageSize: number
	search: string
	sorting: SortingState
}

/**
 * Server-side table where pagination, sorting, and search happen on the backend.
 * The hook manages local state and calls `onStateChange` whenever parameters change,
 * so the parent can refetch data.
 *
 * Use for large datasets where only a page of data is fetched at a time.
 */
export function useServerTable<TData extends object>({
	data,
	columns,
	totalCount,
	pageSize = 10,
	defaultPage = 0,
	defaultSearch = '',
	onStateChange,
}: UseServerTableOptions<TData>) {
	const [globalFilter, setGlobalFilter] = useState(defaultSearch)
	const [sorting, setSorting] = useState<SortingState>([])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: defaultPage,
		pageSize,
	})

	const table = useTable({
		features: dataGridFeatures,
		data,
		columns,
		pageCount: Math.ceil(totalCount / pageSize),
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
			setGlobalFilter(next)
			setPagination((prev) => ({ ...prev, pageIndex: 0 }))
			onStateChange?.({ page: 0, pageSize: pagination.pageSize, search: next, sorting })
		},
		onSortingChange: (updater) => {
			const next = typeof updater === 'function' ? updater(sorting) : updater
			setSorting(next)
			onStateChange?.({ page: pagination.pageIndex, pageSize: pagination.pageSize, search: globalFilter, sorting: next })
		},
		onPaginationChange: (updater) => {
			const next = typeof updater === 'function' ? updater(pagination) : updater
			setPagination(next)
			onStateChange?.({ page: next.pageIndex, pageSize: next.pageSize, search: globalFilter, sorting })
		},
	})

	return {
		table,
		globalFilter,
		setGlobalFilter,
		sorting,
		pagination,
		recordCount: totalCount,
		params: {
			page: pagination.pageIndex,
			pageSize: pagination.pageSize,
			search: globalFilter,
			sorting,
		} satisfies ServerTableParams,
	}
}
