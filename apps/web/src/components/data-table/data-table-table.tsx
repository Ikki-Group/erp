import { flexRender } from '@tanstack/react-table'
import { ComponentProps } from 'react'
import { ChevronsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { getCommonPinningStyles } from './data-table-utils'
import { useDataTableContext } from './data-table-context'

interface DataTableTableProps<TData> extends ComponentProps<'div'> {
  /**
   * Number of skeleton rows to show while loading
   * @default 10
   */
  skeletonRows?: number

  /**
   * Custom empty state message
   */
  emptyMessage?: string

  /**
   * Enable row click handler
   */
  onRowClick?: (row: TData) => void

  /**
   * Enable row double click handler
   */
  onRowDoubleClick?: (row: TData) => void

  /**
   * Custom row className function
   */
  rowClassName?: (row: TData) => string
}

export function DataTableTable<TData>({
  children,
  className,
  skeletonRows = 10,
  emptyMessage = 'No results found.',
  onRowClick,
  onRowDoubleClick,
  rowClassName,
  ...props
}: DataTableTableProps<TData>) {
  const { table, isLoading } = useDataTableContext()

  return (
    <div
      {...props}
      className={cn('overflow-auto border rounded-lg', className)}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const isSorted = header.column.getIsSorted()

                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      ...getCommonPinningStyles({ column: header.column }),
                      width: header.getSize(),
                    }}
                    className={cn(
                      canSort && 'cursor-pointer select-none',
                      header.column.columnDef.meta?.className,
                    )}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && (
                          <span className="ml-auto">
                            {isSorted === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : isSorted === 'desc' ? (
                              <ArrowDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronsUpDownIcon className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {table.getVisibleFlatColumns().map((column) => (
                  <TableCell
                    key={column.id}
                    style={{
                      ...getCommonPinningStyles({ column }),
                    }}
                  >
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            // Data rows
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row.original),
                )}
                onClick={() => onRowClick?.(row.original)}
                onDoubleClick={() => onRowDoubleClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      ...getCommonPinningStyles({ column: cell.column }),
                    }}
                    className={cell.column.columnDef.meta?.className}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            // Empty state
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
