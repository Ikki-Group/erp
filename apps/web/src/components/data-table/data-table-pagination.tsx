import { ChevronLeftIcon, ChevronRightIcon, MinusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDataTableContext } from './data-table-root'
import { useMemo } from 'react'
import { Skeleton } from '../ui/skeleton'

interface DataTablePaginationProps extends React.ComponentProps<'div'> {
  pageSizeOptions?: number[]
}

export function DataTablePagination({
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps) {
  const { table, rowCount, pageIndex, pageSize, isLoading, pageCount } =
    useDataTableContext()

  const { from, to } = useMemo(() => {
    const from = rowCount === 0 ? rowCount : pageIndex * pageSize + 1
    const to = Math.min(rowCount, (pageIndex + 1) * pageSize)

    return { from, to }
  }, [rowCount, pageIndex, pageSize])

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between py-2.5 text-sm text-muted-foreground flex-col md:flex-row',
        className,
      )}
      {...props}
    >
      <div className="inline-flex items-center">
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value))
          }}
        >
          <SelectTrigger className="mr-2">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoading ? (
          <Skeleton className="h-4 w-full min-w-32" />
        ) : (
          <>
            <p>{from}</p>
            <MinusIcon className="text-muted-foreground" />
            <p>{`${to} of ${rowCount} result`}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-x-2">
        <div className="inline-flex items-center gap-x-1 px-3 py-[5px]">
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <p>
              {pageIndex + 1} of {Math.max(pageCount, 1)} pages
            </p>
          )}
        </div>
        <Button
          aria-label="Go to previous page"
          variant="outline"
          type="button"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          aria-label="Go to next page"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
