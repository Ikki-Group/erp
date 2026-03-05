import { useCallback, useMemo } from 'react'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  OnChangeFn,
  PaginationState,
  Table,
  TableOptions,
} from '@tanstack/react-table'
import type { DataTableFilters } from '@/types/data-table-types'
import type { DataTableState } from './use-data-table-state'

export type UseDataTableProps<
  TData,
  TFilter extends DataTableFilters = {},
> = Omit<TableOptions<TData>, 'getCoreRowModel' | 'onStateChange'> & {
  isLoading?: boolean
  ds: DataTableState<TFilter>
}

function useBaseDataTable<TData, TFilter extends DataTableFilters = {}>({
  data,
  columns,
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
    () => ({
      pageIndex: ds.pagination.page - 1,
      pageSize: ds.pagination.limit,
    }),
    [ds.pagination.page, ds.pagination.limit]
  )

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    updater => {
      const next = typeof updater === 'function' ? updater(pagination) : updater

      // Prevent infinite loop by checking if values actually changed
      if (
        next.pageIndex !== pagination.pageIndex ||
        next.pageSize !== pagination.pageSize
      ) {
        ds.setPagination({
          page: next.pageIndex + 1,
          limit: next.pageSize,
        })
      }
    },
    [ds.setPagination, pagination]
  )

  return useReactTable({
    data: stableData,
    columns,
    state: {
      pagination,
      globalFilter: ds.search,
      ...state,
    },
    autoResetPageIndex: false,
    autoResetExpanded: false,
    onGlobalFilterChange: ds.setSearch,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    ...props,
  })
}

export function useDataTable<TData, TFilter extends DataTableFilters = {}>(
  props: UseDataTableProps<TData, TFilter>
): Table<TData> {
  return useBaseDataTable({
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    ...props,
  })
}

export function useDataTableAuto<TData, TFilter extends DataTableFilters = {}>(
  props: UseDataTableProps<TData, TFilter>
): Table<TData> {
  return useBaseDataTable({
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false,
    ...props,
  })
}
