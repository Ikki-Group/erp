export interface DataTablePagination {
	page: number
	limit: number
}

export type DataTableFilters = Record<string, unknown>

export interface DataTableState<F extends DataTableFilters = Record<string, never>> {
	pagination: DataTablePagination
	search: string
	filters: F
}
