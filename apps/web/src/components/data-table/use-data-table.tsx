import {
  getCoreRowModel,
  getPaginationRowModel,
  TableOptions,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import { DataTableState, UseDataTableReturn } from './data-table-types'

export function useDataTableState() {}

type UseDataTableProps<TData> = Omit<
  TableOptions<TData>,
  'getCoreRowModel' | 'state'
> & {
  isLoading?: boolean
  state?: DataTableState
}

export function useDataTable<TData>({
  isLoading = false,
  state,
  ...props
}: UseDataTableProps<TData>): UseDataTableReturn<TData> {
  // Normalize pagination to 0-based index
  const pagination = useMemo(
    () =>
      state
        ? {
            pageIndex: Math.max(state.page - 1, 0),
            pageSize: Math.max(state.limit, 1),
          }
        : undefined,
    [state],
  )

  const table = useReactTable({
    ...props,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      ...(pagination && { pagination }),
    },
    debugAll: true,
  })

  return {
    table,
    pageIndex: table.getState().pagination.pageIndex,
    pageSize: table.getState().pagination.pageSize,
    pageCount: table.getPageCount(),
    rowCount: table.getRowCount(),
    isLoading,
  }
}
