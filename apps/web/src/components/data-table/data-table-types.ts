import type {
  RowData,
  Table,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table'

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

/**
 * Generic filter object for data table
 * Can be extended with specific filter types
 */
export interface DataTableFilters {
  [key: string]: unknown
}

/**
 * Sort configuration
 */
export interface DataTableSort {
  id: string
  desc: boolean
}

/**
 * Complete data table state
 * Used for URL state management and server-side operations
 */
export interface DataTableState<F extends DataTableFilters = DataTableFilters> {
  page: number
  limit: number
  search: string
  filters: F
  sorting?: DataTableSort[]
}

/**
 * Return type from useDataTable hook
 * Provides table instance and computed values
 */
export interface UseDataTableReturn<TData extends RowData = RowData> {
  table: Table<TData>
  pageIndex: number
  pageSize: number
  pageCount: number
  rowCount: number
  isLoading: boolean
}

/**
 * Configuration for server-side data fetching
 */
export interface DataTableServerConfig<TData extends RowData> {
  data: TData[]
  rowCount: number
  pageCount?: number
}

/**
 * Callback types for data table events
 */
export interface DataTableCallbacks<TData extends RowData> {
  onRowClick?: (row: TData) => void
  onRowDoubleClick?: (row: TData) => void
  onSelectionChange?: (selectedRows: TData[]) => void
  onSortingChange?: (sorting: DataTableSort[]) => void
  onFilterChange?: (filters: DataTableFilters) => void
}

/**
 * Feature flags for data table
 */
export interface DataTableFeatures {
  enableSorting?: boolean
  enableFiltering?: boolean
  enableColumnVisibility?: boolean
  enableRowSelection?: boolean
  enableMultiRowSelection?: boolean
  enablePagination?: boolean
  enableGlobalFilter?: boolean
  enableColumnResizing?: boolean
  enableColumnPinning?: boolean
}

/**
 * Internal table state (managed by TanStack Table)
 */
export interface DataTableInternalState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  rowSelection: RowSelectionState
  globalFilter: string
}
