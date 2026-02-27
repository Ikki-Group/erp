import type { Table } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { DataGrid } from '@/components/reui/data-grid/data-grid'
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table'

interface DataTableCardProps<TData extends object> {
  title: string
  table: Table<TData>
  isLoading?: boolean
  recordCount?: number
  action?: ReactNode
  onRowClick?: (row: TData) => void
}

export function DataTableCard<TData extends object>({
  title,
  table,
  isLoading,
  action,
  recordCount = 0,
  onRowClick,
}: DataTableCardProps<TData>) {
  return (
    <DataGrid
      table={table}
      recordCount={recordCount}
      tableClassNames={{ edgeCell: 'px-5' }}
      isLoading={isLoading}
      loadingMode="spinner"
      tableLayout={{
        cellBorder: false,
        // cellBorder: true,
        // columnsPinnable: true,
      }}
      onRowClick={onRowClick}
    >
      <Card className="w-full gap-0! py-3.5" size="sm">
        <CardHeader className="flex items-center justify-between px-3.5 border-b">
          <CardTitle>{title}</CardTitle>
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
        <div className="w-full">
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <CardFooter className="px-3.5 border-t">
          <DataGridPagination className="py-0" />
        </CardFooter>
      </Card>
    </DataGrid>
  )
}
