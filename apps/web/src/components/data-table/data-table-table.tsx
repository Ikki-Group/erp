import { flexRender } from '@tanstack/react-table'
import { ComponentProps } from 'react'
import { ChevronsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

import {
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

interface DataTableTableProps extends ComponentProps<'table'> {}

export function DataTableTable({ children, ...props }: DataTableTableProps) {
  const { table, isLoading } = useDataTableContext()
  const pageSize = table.getState().pagination.pageSize

  return (
    <table {...props}>
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
                    header.column.columnDef.meta?.className,
                    'bg-muted/30',
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
          Array.from({ length: pageSize }).map((_, i) => (
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
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              // className={cn(
              //   onRowClick && 'cursor-pointer',
              //   rowClassName?.(row.original),
              // )}
              // onClick={() => onRowClick?.(row.original)}
              // onDoubleClick={() => onRowDoubleClick?.(row.original)}
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
              {/* {emptyMessage} */}
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </table>
  )
}
