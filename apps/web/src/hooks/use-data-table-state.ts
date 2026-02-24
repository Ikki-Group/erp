import { useState } from 'react'

import { DataTableFilters, DataTablePagination } from '@/types/data-table-types'
import { OnChangeFn } from '@tanstack/react-table'

const DEFAULT_PAGINATION: DataTablePagination = {
  page: 1,
  limit: 10,
}

export interface DataTableState<F extends DataTableFilters = {}> {
  pagination: DataTablePagination
  setPagination: OnChangeFn<DataTablePagination>

  search: string
  setSearch: OnChangeFn<string>

  filters: F
  setFilters: OnChangeFn<F>
}

export function useDataTableState<
  F extends DataTableFilters = DataTableFilters,
>(): DataTableState<F> {
  const [pagination, setPagination] =
    useState<DataTablePagination>(DEFAULT_PAGINATION)

  const [search, setSearch] = useState<string>('')

  const [filters, setFilters] = useState<F>({} as F)

  return {
    pagination,
    setPagination,
    search,
    setSearch,
    filters,
    setFilters,
  }
}
