// import {
//   getCoreRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   getFilteredRowModel,
//   getFacetedRowModel,
//   getFacetedUniqueValues,
//   getFacetedMinMaxValues,
//   type TableOptions,
//   type RowData,
//   useReactTable,
//   type OnChangeFn,
//   type PaginationState,
//   type SortingState,
//   type ColumnFiltersState,
//   type VisibilityState,
//   type RowSelectionState,
// } from '@tanstack/react-table'
// import { useMemo, useState } from 'react'
// import type {
//   DataTableState,
//   UseDataTableReturn,
//   DataTableFeatures,
//   DataTableCallbacks,
//   DataTableServerConfig,
// } from './data-table-types'

// /**
//  * Props for useDataTable hook
//  * Extends TanStack Table options with custom features
//  */
// type UseDataTableProps<TData extends RowData> = Omit<
//   TableOptions<TData>,
//   'getCoreRowModel' | 'state' | 'onStateChange'
// > & {
//   /**
//    * Loading state for async data
//    */
//   isLoading?: boolean

//   /**
//    * External state management (for URL sync)
//    */
//   state?: Partial<DataTableState>

//   /**
//    * Feature flags to enable/disable functionality
//    */
//   features?: DataTableFeatures

//   /**
//    * Event callbacks
//    */
//   callbacks?: DataTableCallbacks<TData>

//   /**
//    * Server-side configuration
//    * When provided, enables server-side pagination/sorting/filtering
//    */
//   serverConfig?: DataTableServerConfig<TData>

//   /**
//    * Manual pagination control
//    * Set to true when using server-side pagination
//    */
//   manualPagination?: boolean

//   /**
//    * Manual sorting control
//    * Set to true when using server-side sorting
//    */
//   manualSorting?: boolean

//   /**
//    * Manual filtering control
//    * Set to true when using server-side filtering
//    */
//   manualFiltering?: boolean
// }

// /**
//  * Enhanced data table hook with full feature support
//  *
//  * Features:
//  * - Client/Server-side pagination
//  * - Sorting (single/multi-column)
//  * - Filtering (column + global)
//  * - Column visibility
//  * - Row selection
//  * - Column pinning
//  * - Column resizing
//  *
//  * @example
//  * ```tsx
//  * const table = useDataTable({
//  *   data: users,
//  *   columns: userColumns,
//  *   features: {
//  *     enableSorting: true,
//  *     enableFiltering: true,
//  *     enableRowSelection: true,
//  *   },
//  *   callbacks: {
//  *     onRowClick: (row) => navigate(`/users/${row.id}`),
//  *   },
//  * })
//  * ```
//  */
// export function useDataTable<TData extends RowData>({
//   isLoading = false,
//   state: externalState,
//   features = {},
//   callbacks = {},
//   serverConfig,
//   manualPagination = false,
//   manualSorting = false,
//   manualFiltering = false,
//   ...props
// }: UseDataTableProps<TData>): UseDataTableReturn<TData> {
//   // Feature flags with defaults
//   const {
//     enableSorting = true,
//     enableFiltering = false,
//     enableColumnVisibility = false,
//     enableRowSelection = false,
//     enableMultiRowSelection = true,
//     enablePagination = true,
//     enableGlobalFilter = false,
//     enableColumnResizing = false,
//     enableColumnPinning = false,
//   } = features

//   // Internal state management
//   const [sorting, setSorting] = useState<SortingState>([])
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
//   const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
//   const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
//   const [globalFilter, setGlobalFilter] = useState<string>('')

//   // Normalize pagination to 0-based index
//   const pagination = useMemo<PaginationState | undefined>(
//     () =>
//       externalState
//         ? {
//             pageIndex: Math.max((externalState.page ?? 1) - 1, 0),
//             pageSize: Math.max(externalState.limit ?? 10, 1),
//           }
//         : undefined,
//     [externalState],
//   )

//   // Sync external search with global filter
//   const effectiveGlobalFilter = useMemo(
//     () => externalState?.search ?? globalFilter,
//     [externalState?.search, globalFilter],
//   )

//   // Handle sorting changes
//   const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
//     const newSorting =
//       typeof updater === 'function' ? updater(sorting) : updater
//     setSorting(newSorting)

//     if (callbacks.onSortingChange) {
//       callbacks.onSortingChange(
//         newSorting.map((s) => ({ id: s.id, desc: s.desc })),
//       )
//     }
//   }

//   // Handle selection changes
//   const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
//     const newSelection =
//       typeof updater === 'function' ? updater(rowSelection) : updater
//     setRowSelection(newSelection)

//     if (callbacks.onSelectionChange && props.data) {
//       const selectedRows = Object.keys(newSelection)
//         .filter((key) => newSelection[key])
//         .map((key) => props.data![parseInt(key)])
//       callbacks.onSelectionChange(selectedRows)
//     }
//   }

//   // Create table instance
//   const table = useReactTable<TData>({
//     ...props,

//     // Core
//     getCoreRowModel: getCoreRowModel(),

//     // Pagination
//     ...(enablePagination && {
//       getPaginationRowModel: getPaginationRowModel(),
//       manualPagination: manualPagination || !!serverConfig,
//       ...(serverConfig && {
//         pageCount:
//           serverConfig.pageCount ??
//           Math.ceil(serverConfig.rowCount / (pagination?.pageSize ?? 10)),
//         rowCount: serverConfig.rowCount,
//       }),
//     }),

//     // Sorting
//     ...(enableSorting && {
//       getSortedRowModel: getSortedRowModel(),
//       manualSorting: manualSorting || !!serverConfig,
//       enableSorting: true,
//       enableMultiSort: true,
//     }),

//     // Filtering
//     ...(enableFiltering && {
//       getFilteredRowModel: getFilteredRowModel(),
//       getFacetedRowModel: getFacetedRowModel(),
//       getFacetedUniqueValues: getFacetedUniqueValues(),
//       getFacetedMinMaxValues: getFacetedMinMaxValues(),
//       manualFiltering: manualFiltering || !!serverConfig,
//       enableColumnFilters: true,
//     }),

//     // Global filter
//     ...(enableGlobalFilter && {
//       enableGlobalFilter: true,
//       globalFilterFn: 'includesString',
//     }),

//     // Column features
//     enableColumnResizing: enableColumnResizing,
//     columnResizeMode: 'onChange',
//     enableColumnPinning: enableColumnPinning,
//     enableHiding: enableColumnVisibility,

//     // Row selection
//     enableRowSelection: enableRowSelection,
//     enableMultiRowSelection: enableMultiRowSelection,

//     // State
//     state: {
//       ...(pagination && { pagination }),
//       ...(enableSorting && { sorting }),
//       ...(enableFiltering && { columnFilters }),
//       ...(enableColumnVisibility && { columnVisibility }),
//       ...(enableRowSelection && { rowSelection }),
//       ...(enableGlobalFilter && { globalFilter: effectiveGlobalFilter }),
//     },

//     // State updaters
//     onSortingChange: handleSortingChange,
//     onColumnFiltersChange: setColumnFilters,
//     onColumnVisibilityChange: setColumnVisibility,
//     onRowSelectionChange: handleRowSelectionChange,
//     onGlobalFilterChange: setGlobalFilter,

//     // Disable debug in production
//     debugTable: process.env.NODE_ENV === 'development',
//     debugHeaders: process.env.NODE_ENV === 'development',
//     debugColumns: process.env.NODE_ENV === 'development',
//   })

//   // Compute derived values
//   const pageIndex = table.getState().pagination.pageIndex
//   const pageSize = table.getState().pagination.pageSize
//   const rowCount = serverConfig?.rowCount ?? table.getRowCount()
//   const pageCount = serverConfig?.pageCount ?? table.getPageCount()

//   return {
//     table,
//     pageIndex,
//     pageSize,
//     pageCount,
//     rowCount,
//     isLoading,
//   }
// }

// /**
//  * Hook for managing data table state in URL search params
//  * Use with Tanstack Router's search params
//  *
//  * @example
//  * ```tsx
//  * const [state, setState] = useDataTableState()
//  * const table = useDataTable({ state, ... })
//  * ```
//  */
// export function useDataTableState<
//   F extends Record<string, unknown> = Record<string, unknown>,
// >() {
//   // This will be implemented based on your router setup
//   // For now, returning a placeholder
//   return [
//     {
//       page: 1,
//       limit: 10,
//       search: '',
//       filters: {} as F,
//     },
//     (state: Partial<DataTableState<F>>) => {
//       // Update URL search params
//       console.log('Update state:', state)
//     },
//   ] as const
// }
