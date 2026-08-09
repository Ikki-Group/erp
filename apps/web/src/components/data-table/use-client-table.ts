import { useState } from 'react'
import { useTable } from '@tanstack/react-table'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'

import { dataGridFeatures, type DataGridFeatures } from '@/components/reui/data-grid/data-grid'

interface UseClientTableOptions<TData extends object> {
	data: TData[]
	columns: ColumnDef<DataGridFeatures, TData>[]
	pageSize?: number
	enableGlobalFilter?: boolean
}

/**
 * Client-side table with built-in pagination, sorting, and global search.
 * All data is held in memory — filtering/pagination happens on the client.
 *
 * Use for small datasets (< 1000 rows) or when the full dataset is already fetched.
 */
export function useClientTable<TData extends object>({
	data,
	columns,
	pageSize = 10,
	enableGlobalFilter = true,
}: UseClientTableOptions<TData>) {
	const [globalFilter, setGlobalFilter] = useState('')
	const [sorting, setSorting] = useState<SortingState>([])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize,
	})

	const table = useTable({
		features: dataGridFeatures,
		data,
		columns,
		state: {
			globalFilter: enableGlobalFilter ? globalFilter : undefined,
			sorting,
			pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
	})

	return {
		table,
		globalFilter,
		setGlobalFilter,
		sorting,
		pagination,
		recordCount: data.length,
	}
}
