import {
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  OnChangeFn,
  PaginationState,
  TableOptions,
  useReactTable,
} from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'
import { DataTableState, UseDataTableReturn } from './data-table-types'

type UseDataTableProps<TData> = Omit<
  TableOptions<TData>,
  'getCoreRowModel' | 'onStateChange'
> & {
  isLoading?: boolean
  ds: DataTableState
}

function useBaseDataTable<TData>({
  data,
  columns,
  isLoading = false,
  ds,
  state = {},
  ...props
}: UseDataTableProps<TData>): UseDataTableReturn<TData> {
  const pagination: PaginationState = useMemo(() => {
    const { page, limit } = ds.pagination
    return {
      pageIndex: page - 1,
      pageSize: limit,
    }
  }, [ds.pagination])

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      ds.setPagination({
        page: next.pageIndex + 1,
        limit: next.pageSize,
      })
    },
    [ds.pagination, pagination],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      globalFilter: ds.search,
      ...state,
    },
    onGlobalFilterChange: ds.setSearch,
    onPaginationChange,
    ...props,
  })

  const { pageIndex, pageSize } = table.getState().pagination

  return {
    table,
    pageIndex,
    pageSize,
    pageCount: table.getPageCount(),
    rowCount: table.getRowCount(),
    isLoading,
    ds,
  }
}

export function useDataTable<TData>(
  props: UseDataTableProps<TData>,
): UseDataTableReturn<TData> {
  return useBaseDataTable({
    ...props,
    manualPagination: true,
  })
}

export function useDataTableAuto<TData>(
  props: UseDataTableProps<TData>,
): UseDataTableReturn<TData> {
  return useBaseDataTable({
    ...props,
    manualPagination: false,
  })
}
