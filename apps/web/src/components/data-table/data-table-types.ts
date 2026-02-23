import type { RowData, Table, OnChangeFn } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    // Custom metadata for table-level operations
    // updateData?: (rowIndex: number, columnId: string, value: unknown) => void
    // deleteRow?: (rowIndex: number) => void
  }

  interface ColumnMeta<TData extends RowData, TValue> {
    // Display metadata
    label?: string
    placeholder?: string
    description?: string

    // Numeric metadata
    range?: [number, number]
    unit?: string

    // Visual metadata
    icon?: React.FC<React.SVGProps<SVGSVGElement>>
    className?: string

    // Feature flags
    filterable?: boolean
    sortable?: boolean
    hideable?: boolean
    exportable?: boolean

    // Filter metadata
    filterVariant?: 'text' | 'select' | 'range' | 'date' | 'multi-select'
    filterOptions?: Array<{ label: string; value: string }>
  }
}

/** Pagination state used by DataTable */
export interface DataTablePagination {
  page: number
  limit: number
}

/** Extra filters provided by consumer */
export type DataTableFilters = Record<string, unknown>

export interface DataTableState<F extends DataTableFilters = {}> {
  pagination: DataTablePagination
  setPagination: OnChangeFn<DataTablePagination>

  search: string
  setSearch: OnChangeFn<string>

  filters: F
  setFilters: OnChangeFn<F>
}

export interface UseDataTableReturn<TData> {
  table: Table<TData>
  pageIndex: number
  pageSize: number
  pageCount: number
  rowCount: number
  isLoading: boolean
  ds: DataTableState
}
