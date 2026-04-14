import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
} from '@tanstack/react-table'
import type { OnChangeFn, PaginationState, Table, TableOptions } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { DataTableFilters } from '@/types/data-table-types'

import type { DataTableState } from './use-data-table-state'

export type UseDataTableProps<TData, TFilter extends DataTableFilters = {}> = Omit<
	TableOptions<TData>,
	'getCoreRowModel' | 'onStateChange'
> & { isLoading?: boolean; ds: DataTableState<TFilter> }

/**
 * Creates and configures a TanStack React Table instance connected to the provided data and DataTableState.
 *
 * @param ds - DataTableState that controls pagination, global search, and exposes setters (for example `setPagination` and `setSearch`).
 * @param state - Additional table state to merge with the derived pagination and global filter state.
 * @returns The configured Table instance with core row model, pagination state, and global filtering wired to the provided `ds`.
 */
function useBaseDataTable<TData, TFilter extends DataTableFilters = {}>({
	data,
	columns,
	// oxlint-disable-next-line no-unused-vars
	isLoading = false,
	ds,
	state = {},
	...props
}: UseDataTableProps<TData, TFilter>): Table<TData> {
	// Stable fallback for empty data to prevent infinite re-renders
	// if consumers inline `data: data ?? []`
	const fallbackData = useMemo(() => [], [])
	const stableData = data.length === 0 ? fallbackData : data

	const pagination = useMemo<PaginationState>(
		() => ({ pageIndex: ds.pagination.page - 1, pageSize: ds.pagination.limit }),
		[ds.pagination.page, ds.pagination.limit],
	)

	const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
		(updater) => {
			const next = typeof updater === 'function' ? updater(pagination) : updater

			// Prevent infinite loop by checking if values actually changed
			if (next.pageIndex !== pagination.pageIndex || next.pageSize !== pagination.pageSize) {
				ds.setPagination({ page: next.pageIndex + 1, limit: next.pageSize })
			}
		},
		// oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
		[ds.setPagination, pagination],
	)

	return useReactTable({
		data: stableData,
		columns,
		state: { pagination, globalFilter: ds.search, ...state },
		autoResetPageIndex: false,
		autoResetExpanded: false,
		onGlobalFilterChange: ds.setSearch,
		onPaginationChange,
		getCoreRowModel: getCoreRowModel(),
		...props,
	})
}

/**
 * Creates a TanStack table instance configured for manual pagination, filtering, and sorting.
 *
 * @param props - Table options, columns, data, and a `ds` DataTableState that drive external pagination, filtering, and sorting state
 * @returns A `Table<TData>` instance wired for manual pagination, filtering, and sorting
 */
export function useDataTable<TData, TFilter extends DataTableFilters = {}>(
	props: UseDataTableProps<TData, TFilter>,
): Table<TData> {
	return useBaseDataTable({
		manualPagination: true,
		manualFiltering: true,
		manualSorting: true,
		...props,
	})
}

/**
 * Creates a data table configured with automatic pagination and filtering.
 *
 * @param props - Configuration and state for the table; forwarded to the base hook. Pagination and filtering are enabled automatically by this hook.
 * @returns A `Table<TData>` instance configured for automatic pagination and filtered row modeling.
 */
export function useDataTableAuto<TData, TFilter extends DataTableFilters = {}>(
	props: UseDataTableProps<TData, TFilter>,
): Table<TData> {
	return useBaseDataTable({
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		manualPagination: false,
		...props,
	})
}
