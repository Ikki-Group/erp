import type { OnChangeFn } from '@tanstack/react-table'
import { useState } from 'react'

import type { DataTableFilters, DataTablePagination } from '@/types/data-table-types'

const DEFAULT_PAGINATION: DataTablePagination = { page: 1, limit: 10 }

export interface DataTableState<TFilter extends DataTableFilters = DataTableFilters> {
	pagination: DataTablePagination
	setPagination: OnChangeFn<DataTablePagination>

	search: string
	setSearch: OnChangeFn<string>

	filters: TFilter
	setFilters: OnChangeFn<TFilter>
}

export function useDataTableState<
	TFilter extends DataTableFilters = DataTableFilters,
>(): DataTableState<TFilter> {
	const [pagination, setPagination] = useState<DataTablePagination>(DEFAULT_PAGINATION)

	const [search, setSearch] = useState<string>('')

	const [filters, setFilters] = useState<TFilter>({} as TFilter)

	return { pagination, setPagination, search, setSearch, filters, setFilters }
}
