import { DataTablePagination } from './data-table-types'

export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export const DEFAULT_PAGINATION: DataTablePagination = {
  page: 1,
  limit: 1,
}
