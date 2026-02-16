import type { RowData, Table } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // interface TableMeta<TData extends RowData> {
  //   queryKeys?: QueryKeys
  // }

  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    placeholder?: string
    range?: [number, number]
    unit?: string
    icon?: React.FC<React.SVGProps<SVGSVGElement>>
  }
}

// This file only contains interfaces exported
export interface DataTableFilters {
  [key: string]: unknown
}

export interface DataTableState<F = DataTableFilters> {
  page: number
  limit: number
  search: string
  filters: F
}

export interface UseDataTableReturn<TData = any> {
  table: Table<TData>
  pageIndex: number
  pageSize: number
  pageCount: number
  rowCount: number
  isLoading: boolean
}
