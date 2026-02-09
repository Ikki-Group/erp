import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import type { TableState } from '@tanstack/react-table'

interface UseDataTableOptions {
  routeId: string
  defaultPageSize?: number
}

export function useDataTable({
  routeId,
  defaultPageSize = 10,
}: UseDataTableOptions) {
  const navigate = useNavigate()
  const search = useSearch({ from: routeId as any }) as any

  // Map URL search params to table state
  const tableState = useMemo(() => {
    return {
      pagination: {
        pageIndex: (Number(search.page) || 1) - 1,
        pageSize: Number(search.limit) || defaultPageSize,
      },
      sorting: search.sort
        ? JSON.parse(decodeURIComponent(search.sort as string))
        : [],
      columnFilters: search.filters
        ? JSON.parse(decodeURIComponent(search.filters as string))
        : [],
    } as Partial<TableState>
  }, [search.page, search.limit, search.sort, search.filters, defaultPageSize])

  const onStateChange = useCallback(
    (nextState: TableState) => {
      const { pagination, sorting, columnFilters } = nextState

      navigate({
        search: ((prev: any) => ({
          ...prev,
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          sort: sorting.length
            ? encodeURIComponent(JSON.stringify(sorting))
            : undefined,
          filters: columnFilters.length
            ? encodeURIComponent(JSON.stringify(columnFilters))
            : undefined,
        })) as any,
      })
    },
    [navigate],
  )

  return {
    tableState,
    onStateChange,
  }
}
